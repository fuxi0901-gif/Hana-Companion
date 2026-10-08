"""
Live conf.yaml hot-reload manager.
==============================
Keeps the running server in sync with conf.yaml WITHOUT a restart:

- ``reload_from_disk()`` re-reads conf.yaml, validates it, and applies it to the
  shared default ServiceContext (exactly what a WebSocket config-switch does),
  then repoints every connected session that is still on the base config at the
  rebuilt engines. Sessions running a character override keep their own agent —
  re-selecting the character re-applies, same as before.
- A background file watcher (mtime polling + stability debounce) calls the same
  reload whenever the user hand-edits conf.yaml, so a pasted API key / model
  swap / language change applies in seconds with zero restarts.
- Conversation continuity: the fresh agent inherits the previous agent's
  in-memory message list, so an LLM key swap mid-chat does not wipe the current
  conversation.

Safety rules:
- A config that fails validation is rejected loudly and the OLD config stays
  live (a half-finished manual edit never breaks the running server).
- Reloads are serialized by an asyncio.Lock; the watcher waits for the file to
  stop changing (2 consecutive changed polls) before reloading.
- The watcher thread must never crash the app: every tick is exception-guarded.
"""

import os
import json
import asyncio
import threading
from typing import Callable, Optional

from loguru import logger

from .config_manager import read_yaml, validate_config

CONF_PATH = "conf.yaml"
WATCH_INTERVAL = 1.5  # seconds between mtime polls
CHANGED_POLLS = 2  # consecutive changed polls before treating the write as done


class ConfigHotReloader:
    """Applies conf.yaml changes to the live server without a restart."""

    def __init__(
        self,
        default_context_cache,
        ws_handler_getter: Callable,
    ):
        """
        Parameters:
        - default_context_cache: the shared ServiceContext used for new sessions.
        - ws_handler_getter: zero-arg callable returning the live WebSocketHandler
          (or None before it exists), used to reach connected sessions.
        """
        self._default = default_context_cache
        self._ws_handler_getter = ws_handler_getter
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._lock = asyncio.Lock()
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._last_mtime: Optional[float] = None
        self._changed_count = 0

    # ------------------------------------------------------------------ #
    # Core reload
    # ------------------------------------------------------------------ #

    async def reload_from_disk(self, reason: str = "manual") -> dict:
        """Re-read conf.yaml and apply it to the running server.

        Returns {"ok": bool, "error": str, "sessions_updated": int}.
        On any failure the previously loaded config stays live.
        """
        async with self._lock:
            try:
                raw = read_yaml(CONF_PATH) or {}
                new_config = validate_config(
                    {
                        "system_config": raw.get("system_config"),
                        "character_config": raw.get("character_config"),
                    }
                )
            except Exception as e:
                logger.warning(
                    f"[hot-reload] conf.yaml rejected ({reason}): {type(e).__name__}: {e}. "
                    "Keeping the previously loaded config."
                )
                return {"ok": False, "error": str(e), "sessions_updated": 0}

            default = self._default
            old_agent = default.agent_engine

            try:
                await default.load_from_config(new_config)
            except Exception as e:
                logger.error(
                    f"[hot-reload] load_from_config failed ({reason}): "
                    f"{type(e).__name__}: {e}. Keeping the previously loaded config."
                )
                return {"ok": False, "error": str(e), "sessions_updated": 0}

            # Conversation continuity: transplant the previous agent's in-memory
            # messages into the fresh agent so a mid-chat LLM swap keeps context.
            new_agent = default.agent_engine
            if (
                old_agent is not None
                and new_agent is not None
                and old_agent is not new_agent
                and isinstance(getattr(old_agent, "_memory", None), list)
                and old_agent._memory
            ):
                try:
                    new_agent._memory = old_agent._memory
                    logger.debug("[hot-reload] transplanted conversation memory.")
                except Exception:
                    pass

            sessions = await self._repoint_base_sessions(old_agent)
            # Sync the watcher baseline so a reload triggered by an API save
            # (which just wrote conf.yaml) is not immediately re-run by the
            # file watcher a few seconds later.
            self._last_mtime = self._current_mtime()
            logger.info(
                f"[hot-reload] applied conf.yaml ({reason}); "
                f"{sessions} live session(s) updated."
            )
            return {"ok": True, "error": "", "sessions_updated": sessions}

    async def _repoint_base_sessions(self, old_agent) -> int:
        """Point still-connected base-config sessions at the rebuilt engines.

        A session is "on the base config" iff its agent_engine IS the old shared
        agent object — including the both-are-None case (the agent failed to
        initialize with a placeholder key, and the user has just fixed it).
        Sessions that ran a character switch own a different agent and are left
        untouched; re-selecting the character re-applies base changes, as before.
        """
        try:
            handler = self._ws_handler_getter()
        except Exception:
            handler = None
        if handler is None:
            return 0

        default = self._default
        updated = 0
        try:
            contexts = dict(getattr(handler, "client_contexts", {}) or {})
        except Exception:
            return 0
        for client_uid, ctx in contexts.items():
            try:
                if ctx is None:
                    continue
                on_base = ctx.agent_engine is old_agent or (
                    old_agent is None and ctx.agent_engine is None
                )
                if not on_base:
                    continue
                ctx.config = default.config.model_copy(deep=True)
                ctx.system_config = default.system_config.model_copy(deep=True)
                ctx.character_config = default.character_config.model_copy(deep=True)
                ctx.asr_engine = default.asr_engine
                ctx.tts_engine = default.tts_engine
                ctx.vad_engine = default.vad_engine
                ctx.translate_engine = default.translate_engine
                ctx.subtitle_translate_engine = default.subtitle_translate_engine
                ctx.live2d_model = default.live2d_model
                ctx.agent_engine = default.agent_engine
                ctx.system_prompt = default.system_prompt
                ctx.mcp_prompt = default.mcp_prompt
                updated += 1

                # Mirror the messages handle_config_switch sends so the UI
                # refreshes model info instead of showing stale state.
                send = getattr(ctx, "send_text", None)
                if send is not None:
                    await _send_switch_msgs(send, ctx)
            except Exception as e:
                logger.warning(
                    f"[hot-reload] session {client_uid} update failed: "
                    f"{type(e).__name__}: {e}"
                )
        return updated

    # ------------------------------------------------------------------ #
    # File watcher
    # ------------------------------------------------------------------ #

    def start(self) -> None:
        """Start the background watcher (call from the running event loop)."""
        if self._thread is not None and self._thread.is_alive():
            return
        try:
            self._loop = asyncio.get_running_loop()
        except RuntimeError:
            logger.warning(
                "[hot-reload] start() called outside an event loop; watcher disabled."
            )
            return
        self._last_mtime = self._current_mtime()
        self._stop_event.clear()
        self._thread = threading.Thread(
            target=self._watch_loop, name="conf-hot-reload", daemon=True
        )
        self._thread.start()
        logger.info(
            f"[hot-reload] watching {CONF_PATH} — edits apply live, no restart needed."
        )

    def stop(self) -> None:
        self._stop_event.set()

    def _current_mtime(self) -> Optional[float]:
        try:
            return os.stat(CONF_PATH).st_mtime
        except OSError:
            return None

    def _watch_loop(self) -> None:
        while not self._stop_event.wait(WATCH_INTERVAL):
            try:
                mtime = self._current_mtime()
                if mtime is None or mtime == self._last_mtime:
                    self._changed_count = 0
                    continue
                # File changed: wait for the write to settle (editors save in
                # multiple steps; atomic replace + follow-up writes happen).
                self._changed_count += 1
                if self._changed_count < CHANGED_POLLS:
                    continue
                self._changed_count = 0
                self._last_mtime = mtime
                if self._loop is not None and self._loop.is_running():
                    asyncio.run_coroutine_threadsafe(
                        self.reload_from_disk(reason="file-change"), self._loop
                    )
            except Exception as e:
                # The watcher must never die.
                logger.debug(f"[hot-reload] watcher tick error: {type(e).__name__}: {e}")


async def _send_switch_msgs(send, ctx) -> None:
    """Send the same config-switch notifications handle_config_switch uses."""
    try:
        await send(
            json.dumps(
                {
                    "type": "set-model-and-conf",
                    "model_info": ctx.live2d_model.model_info,
                    "conf_name": ctx.character_config.conf_name,
                    "conf_uid": ctx.character_config.conf_uid,
                }
            )
        )
        await send(
            json.dumps(
                {
                    "type": "config-switched",
                    "message": "Configuration hot-reloaded from conf.yaml",
                }
            )
        )
    except Exception:
        pass
