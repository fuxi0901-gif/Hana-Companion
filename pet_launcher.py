"""Desktop-pet launcher and localhost control API.

Splits the pet process management out of run_server.py so the server entry point
stays untouched apart from two additive calls. The Electron app lives in
``desktop-pet/`` and reads the same ``desktop-pet/settings.json`` we write here,
which is how the in-app settings panel (and this API) drives a window that is a
completely separate process.

Design notes:
- Endpoints reuse the localhost+proxy guard from llm_config_route, like every
  other local-only router in this project.
- Only whitelisted keys with validated types are ever written to settings.json,
  and the file is replaced atomically (never appended / sed-ed).
- The Electron executable path is fixed inside desktop-pet/node_modules; no
  caller-supplied path is ever handed to subprocess.
- The pet is optional: if the npm dependencies are not installed we only log a
  hint. Nothing here may break the server.
"""

import os
import re
import json
import time
import socket
import threading
import subprocess
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Request
from starlette.responses import JSONResponse
from loguru import logger

# REUSE the localhost+proxy guard every other local-only router uses.
from src.open_llm_vtuber.llm_config_route import _is_local_request, _forbidden
from src.open_llm_vtuber.config_manager.utils import read_yaml
from src.open_llm_vtuber.chat_history_manager import get_history

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #

ROOT = Path(__file__).parent.resolve()
PET_DIR = ROOT / "desktop-pet"
SETTINGS_PATH = PET_DIR / "settings.json"
MODEL_DICT_PATH = ROOT / "model_dict.json"
LIVE2D_DIR = "live2d-models"
CONF_PATH = ROOT / "conf.yaml"

# Default: the pet appears on the desk as soon as the project is run.
DEFAULTS: dict = {
    "autoShow": True,  # spawn the pet when the server starts
    "visible": True,  # window shown (false = hidden, process stays alive)
    "followWeb": True,  # mirror whichever character the web client uses
    "character": "conf.yaml",  # switch-config file for the pet's own client
    "petUid": "",  # the pet's own client_uid, reported by its renderer
    "model": "",  # live2d skin name; "" = follow the character config
    "scale": 0.85,
    "alwaysOnTop": True,
    "clickThrough": False,
    "quitRequested": False,  # cross-process stop, see terminate_pet()
    # Whether the persistent chat log is shown over the pet. The ✕ on the panel,
    # the right-click menu and the settings pages all flip this; the pet mirrors
    # it locally and persists it so a restart keeps the choice.
    "chatVisible": True,
    # Reply presentation: bubbleMode shows the current answer in a speech bubble
    # anchored at the Live2D mouth (off = the log box at the top only). voiceReply
    # gates TTS playback: false keeps the text but stays silent. Both are flipped
    # from the pet's right-click menu and the settings page.
    "bubbleMode": True,
    "voiceReply": True,
    # Conversation merge (see frontend/pet.html + app.js): the pet and the web
    # client can share ONE chat_history session so each side's messages show up
    # for the other. history_uid is chosen by whichever client starts first and
    # published here; sharedConfUid guards against resuming it under a different
    # character. shareHistory=false falls back to the old per-client behaviour.
    "sharedHistoryUid": "",
    "sharedConfUid": "",
    "shareHistory": True,
}

# Whitelist + type check so a POST body can never smuggle an arbitrary key.
_SCALARS = {
    "autoShow": bool,
    "visible": bool,
    "followWeb": bool,
    "alwaysOnTop": bool,
    "clickThrough": bool,
    "quitRequested": bool,
    "chatVisible": bool,
    "bubbleMode": bool,
    "voiceReply": bool,
    "shareHistory": bool,
    "model": str,
    "petUid": str,
}
SCALE_RANGE = (0.4, 2.5)

# Character + model names: bare yaml basename / folder name, never a path.
_CHARACTER_RE = re.compile(r"^[A-Za-z0-9_\-.]{1,80}\.yaml$")
_MODEL_NAME_RE = re.compile(r"^[A-Za-z0-9_\-. ]{1,120}$")
# client_uid as issued by the websocket handler (uuid4 hex).
_UID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")

_lock = threading.Lock()
_proc: Optional[subprocess.Popen] = None

# The pet rewrites this every few seconds while it is alive. It is how the
# launcher notices an instance it did not spawn itself (a previous run, or a
# manual "npm start") — Electron's single-instance lock would otherwise make
# our own child exit instantly and report a running pet as dead.
LOCK_PATH = PET_DIR / "pet.lock"
LOCK_STALE_SECONDS = 8


# --------------------------------------------------------------------------- #
# settings.json
# --------------------------------------------------------------------------- #

def read_settings() -> dict:
    """Return the pet settings merged over defaults (never raises)."""
    merged = dict(DEFAULTS)
    try:
        with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f)
        if isinstance(raw, dict):
            for k, v in raw.items():
                if k in DEFAULTS and _is_valid_value(k, v):
                    merged[k] = v
    except FileNotFoundError:
        pass
    except Exception as e:
        logger.warning(f"pet settings unreadable, using defaults: {type(e).__name__}")
    return merged


def write_settings(patch: dict) -> dict:
    """Merge validated keys into settings.json atomically; return new settings."""
    with _lock:
        current = read_settings()
        for k, v in (patch or {}).items():
            if k in DEFAULTS and _is_valid_value(k, v):
                current[k] = v
        tmp = SETTINGS_PATH.with_suffix(".json.tmp")
        PET_DIR.mkdir(parents=True, exist_ok=True)
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(current, f, ensure_ascii=False, indent=2)
        os.replace(tmp, SETTINGS_PATH)
        return current


def _is_valid_value(key: str, value) -> bool:
    if key == "scale":
        return isinstance(value, (int, float)) and SCALE_RANGE[0] <= value <= SCALE_RANGE[1]
    if key == "character":
        return isinstance(value, str) and (
            value == "conf.yaml" or bool(_CHARACTER_RE.match(value))
        )
    if key == "model":
        return isinstance(value, str) and (value == "" or bool(_MODEL_NAME_RE.match(value)))
    if key == "petUid":
        return isinstance(value, str) and (value == "" or bool(_UID_RE.match(value)))
    if key in ("sharedHistoryUid", "sharedConfUid"):
        # history_uid / conf_uid are both bare ids, never a path.
        return isinstance(value, str) and (value == "" or bool(_UID_RE.match(value)))
    if key in _SCALARS:
        return isinstance(value, _SCALARS[key])
    return False


# --------------------------------------------------------------------------- #
# Process management
# --------------------------------------------------------------------------- #

def electron_binary() -> Optional[str]:
    """Path of the locally installed Electron binary, or None if not installed."""
    dist = PET_DIR / "node_modules" / "electron" / "dist"
    for name in ("electron.exe", "Electron"):
        candidate = dist / name
        if candidate.exists():
            return str(candidate)
    return None


def pet_installed() -> bool:
    return electron_binary() is not None


def is_running() -> bool:
    if _proc is not None and _proc.poll() is None:
        return True
    try:
        return (time.time() - os.path.getmtime(LOCK_PATH)) < LOCK_STALE_SECONDS
    except OSError:
        return False


def spawn_pet(port: int, *, visible: bool = True) -> dict:
    """Start the pet if it is not already running. Returns a status dict."""
    global _proc
    exe = electron_binary()
    if not exe:
        return {
            "ok": False,
            "reason": "not-installed",
            "hint": "npm install --prefix desktop-pet",
        }
    if is_running():
        write_settings({"visible": visible})
        return {"ok": True, "reason": "already-running"}

    # Clear any stop flag left over from the previous shutdown, otherwise the
    # new window would quit itself on the first poll. Also drop a heartbeat
    # file that has not expired yet, so "quit then show" works immediately.
    write_settings({"quitRequested": False, "visible": visible})
    try:
        LOCK_PATH.unlink()
    except OSError:
        pass

    args = [exe, str(PET_DIR), f"--server=http://127.0.0.1:{int(port)}"]
    if not visible:
        args.append("--hidden")
    flags = 0
    if os.name == "nt":
        flags = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
    try:
        _proc = subprocess.Popen(
            args,
            cwd=str(PET_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=flags,
        )
    except Exception as e:
        logger.warning(f"Could not start the desktop pet: {type(e).__name__}: {e}")
        return {"ok": False, "reason": "spawn-failed", "error": str(e)}

    logger.info(f"Desktop pet started (pid {_proc.pid}) on port {port}.")
    return {"ok": True, "reason": "started", "pid": _proc.pid}


def terminate_pet() -> None:
    """Stop the pet.

    The flag is what actually stops an instance we did not spawn (the file
    contract works even after this process is gone, so it is also the atexit
    path: the window notices within a second and closes itself). We only
    hard-kill our own child if it did not make that in time, and then drop the
    heartbeat it never got to remove — otherwise a follow-up "show" would
    believe the dead instance is still running.
    """
    global _proc
    write_settings({"quitRequested": True})
    deadline = time.time() + 4.0
    while time.time() < deadline:
        if _proc is None or _proc.poll() is not None:
            break
        time.sleep(0.25)
    if _proc is not None and _proc.poll() is None:
        try:
            _proc.terminate()
            _proc.wait(timeout=5)
        except Exception:
            try:
                _proc.kill()
            except Exception:
                pass
        logger.info("Desktop pet stopped.")
    _proc = None
    try:
        LOCK_PATH.unlink()
    except OSError:
        pass


def launch_when_ready(port: int, timeout: float = 600.0) -> None:
    """Spawn the pet once the server is actually accepting connections.

    Same reason _open_browser_when_ready exists: first-run startup (model
    download + avatar load) is far slower than a fixed delay can predict, and
    the window would just sit on a retrying page.
    """
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=1.0):
                pass
        except OSError:
            time.sleep(0.5)
            continue
        result = spawn_pet(port)
        if not result.get("ok") and result.get("reason") == "not-installed":
            logger.info(
                "Desktop pet not started: Electron dependencies are missing. "
                "Run 'npm install --prefix desktop-pet' (or 'cd desktop-pet && "
                "npm install'), then start the server again. Disable this "
                "message with --no-pet."
            )
        return
    logger.warning("Server did not become ready in time; the pet was not started.")


# --------------------------------------------------------------------------- #
# Skins (read-only view of the model registry, for the pet's skin selector)
# --------------------------------------------------------------------------- #

def list_skins() -> dict:
    """Return the registered live2d models plus the name the base config uses."""
    models = []
    try:
        with open(MODEL_DICT_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f)
        if isinstance(raw, list):
            for m in raw:
                if isinstance(m, dict) and m.get("name") and m.get("url"):
                    models.append(m)
    except Exception as e:
        logger.warning(f"model_dict.json unreadable: {type(e).__name__}")

    current = None
    try:
        conf = read_yaml(str(CONF_PATH)) or {}
        current = (conf.get("character_config") or {}).get("live2d_model_name")
    except Exception:
        pass
    return {"skins": models, "current": current, "dir": f"/{LIVE2D_DIR}"}


# --------------------------------------------------------------------------- #
# Live client state (read-only view of the running WebSocket sessions)
#
# A character switch in the web UI is per-connection (switch-config reloads that
# client's own ServiceContext) and is never persisted anywhere, so the only place
# that knows "who the user is currently talking to on the web" is the handler's
# client_contexts. We only READ it — src/ stays untouched.
# --------------------------------------------------------------------------- #

_MAP_TTL = 4.0
_map_cache: dict = {"ts": 0.0, "map": {}, "base_uid": ""}
# client_uid -> (character signature, when it last changed). Only ever holds
# currently connected clients; used to tell which page the user is driving.
_sig_seen: dict = {}


def config_alts_dir() -> str:
    """The characters/ override directory (system_config.config_alts_dir)."""
    try:
        conf = read_yaml(str(CONF_PATH)) or {}
        alt = (conf.get("system_config") or {}).get("config_alts_dir")
        if isinstance(alt, str) and alt.strip():
            return alt.strip()
    except Exception:
        pass
    return "characters"


def character_file_map() -> dict:
    """conf_uid -> switch-config filename for the base + every override file.

    Cached briefly: the pet polls every couple of seconds and this reads YAML.
    """
    now = time.time()
    if now - _map_cache["ts"] < _MAP_TTL:
        return _map_cache["map"]

    mapping: dict = {}
    base_uid = ""
    try:
        base_uid = str(
            ((read_yaml(str(CONF_PATH)) or {}).get("character_config") or {}).get(
                "conf_uid"
            )
            or ""
        )
        if base_uid:
            mapping[base_uid] = "conf.yaml"
    except Exception as e:
        logger.debug(f"base conf unreadable: {type(e).__name__}")

    alts = ROOT / config_alts_dir()
    if alts.is_dir():
        for path in sorted(alts.glob("*.yaml")):
            if not _CHARACTER_RE.match(path.name):
                continue
            try:
                cc = (read_yaml(str(path)) or {}).get("character_config") or {}
            except Exception:
                continue  # a hand-broken override must not break the whole map
            uid = cc.get("conf_uid") or path.stem
            if uid:
                mapping.setdefault(str(uid), path.name)

    _map_cache.update(ts=now, map=mapping, base_uid=base_uid)
    return mapping


def read_client_characters(get_contexts, exclude_uid: str = "") -> dict:
    """Snapshot the character each live client uses; never raises.

    ``web`` is the client the pet should mirror: the one whose character changed
    most recently (ties go to the newest connection) that is not the pet itself
    (``exclude_uid``). ``mine`` is the pet's own context, so the caller can tell
    whether it is already in sync instead of re-sending switch-config every poll.
    """
    out = {
        "following": False,
        "web": None,
        "mine": None,
        "clients": [],
    }
    if get_contexts is None:
        out["reason"] = "no-session-access"
        return out
    try:
        contexts = dict(get_contexts() or {})
        settings = read_settings()
        out["following"] = bool(settings.get("followWeb"))
        # Callers that do not know the pet's own uid (the web settings panel)
        # still get the pet out of the way via the uid it reported on connect.
        exclude_uid = exclude_uid or settings.get("petUid") or ""
    except Exception as e:
        out["reason"] = f"{type(e).__name__}"
        return out

    mapping = character_file_map()
    base_uid = _map_cache.get("base_uid") or ""
    others = []
    for uid, ctx in contexts.items():
        try:
            cc = ctx.character_config
            conf_uid = str(cc.conf_uid or "")
            item = {
                "uid": str(uid),
                "conf_uid": conf_uid,
                "conf_name": cc.conf_name,
                "live2d_model_name": cc.live2d_model_name,
                "filename": mapping.get(conf_uid),
            }
        except Exception:
            continue
        if uid == exclude_uid:
            out["mine"] = item
        else:
            others.append(item)

    out["clients"] = others

    # Which page is "the web"? The one the user actually operates: the client
    # whose character changed most recently. A second or auto-reconnecting tab
    # that reset to the base character must not outrank a tab they just clicked,
    # so a fresh connection only wins when nobody has switched at all.
    now = time.time()
    changed: dict = {}
    live_uids = set()
    for item in others:
        uid = item["uid"]
        sig = f"{item['conf_uid']}|{item['live2d_model_name']}"
        live_uids.add(uid)
        seen = _sig_seen.get(uid)
        if seen is None:
            # A (re)connecting page always lands on the base character, because
            # nothing persists it — so arriving on another one means the user
            # picked that page.
            _sig_seen[uid] = (sig, 0.0 if item["conf_uid"] == base_uid else now)
        elif seen[0] != sig:
            _sig_seen[uid] = (sig, now)
        changed[uid] = _sig_seen[uid][1]
    for uid in [u for u in _sig_seen if u not in live_uids]:
        _sig_seen.pop(uid, None)

    best = None
    best_ts = -1.0
    for c in reversed(others):
        if not c["filename"]:
            continue
        ts = changed.get(c["uid"], 0.0)
        if ts > best_ts:
            best, best_ts = c, ts
    out["web"] = best
    return out


# --------------------------------------------------------------------------- #
# Route factory
# --------------------------------------------------------------------------- #

def init_pet_route(port: int, get_contexts=None) -> APIRouter:
    """Localhost-only endpoints that drive the desktop pet process.

    - GET  /api/pet                -> {running, installed, settings}
    - GET  /api/pet/web-character  -> character the web client currently uses
    - POST /api/pet/show           -> spawn (if needed) + make visible
    - POST /api/pet/hide           -> hide the window, keep the process alive
    - POST /api/pet/quit           -> stop the process this launcher started
    - POST /api/pet/settings       -> merge a validated patch into settings.json
    - GET  /api/pet/skins          -> live2d models the pet can display

    ``get_contexts`` is a callable returning the live WebSocketHandler's
    client_contexts; passing it in keeps src/ unmodified and the read optional.
    """
    router = APIRouter()

    def guard(request: Request):
        return None if _is_local_request(request) else _forbidden()

    @router.get("/api/pet")
    async def pet_state(request: Request):
        blocked = guard(request)
        if blocked:
            return blocked
        return JSONResponse(
            {
                "running": is_running(),
                "installed": pet_installed(),
                "settings": read_settings(),
                "scaleRange": list(SCALE_RANGE),
            }
        )

    @router.get("/api/pet/web-character")
    async def pet_web_character(request: Request, exclude: str = ""):
        blocked = guard(request)
        if blocked:
            return blocked
        return JSONResponse(read_client_characters(get_contexts, exclude))

    @router.get("/api/pet/skins")
    async def pet_skins(request: Request):
        blocked = guard(request)
        if blocked:
            return blocked
        return JSONResponse(list_skins())

    @router.get("/api/pet/history")
    async def pet_history(request: Request, conf_uid: str = "", history_uid: str = ""):
        """Read-only view of one persisted conversation, for live pet<->web sync.

        A single conversation is sent only to the client that spoke (the fork does
        not broadcast one client's turn to another), so each side polls this to
        mirror the shared chat_history file. Both ids are bare ids, never a path.
        """
        blocked = guard(request)
        if blocked:
            return blocked
        if not _is_valid_value("sharedConfUid", conf_uid) or not _is_valid_value(
            "sharedHistoryUid", history_uid
        ):
            return JSONResponse(status_code=400, content={"ok": False, "error": "bad id"})
        messages = [
            {
                "role": m.get("role"),
                "content": m.get("content", ""),
                "name": m.get("name"),
                "timestamp": m.get("timestamp", ""),
            }
            for m in get_history(conf_uid, history_uid)
            if m.get("role") in ("human", "ai", "system")
        ]
        return JSONResponse(
            {
                "ok": True,
                "count": len(messages),
                # Cheap change key for the pollers: count + last-timestamp stays
                # identical between turns, so an unchanged conversation never
                # triggers a re-render on every poll.
                "sig": f"{len(messages)}:{messages[-1]['timestamp'] if messages else ''}",
                "messages": messages,
            }
        )

    @router.post("/api/pet/show")
    async def pet_show(request: Request):
        blocked = guard(request)
        if blocked:
            return blocked
        write_settings({"visible": True})
        result = spawn_pet(port)
        return JSONResponse(
            {**result, "running": is_running(), "settings": read_settings()}
        )

    @router.post("/api/pet/hide")
    async def pet_hide(request: Request):
        blocked = guard(request)
        if blocked:
            return blocked
        write_settings({"visible": False})
        return JSONResponse({"ok": True, "settings": read_settings()})

    @router.post("/api/pet/quit")
    async def pet_quit(request: Request):
        blocked = guard(request)
        if blocked:
            return blocked
        terminate_pet()
        return JSONResponse({"ok": True, "running": is_running()})

    @router.post("/api/pet/settings")
    async def pet_settings(request: Request):
        blocked = guard(request)
        if blocked:
            return blocked
        try:
            body = await request.json()
        except Exception:
            body = {}
        if not isinstance(body, dict):
            body = {}
        patch = {k: v for k, v in body.items() if _is_valid_value(k, v)}
        if not patch:
            return JSONResponse(
                status_code=400,
                content={"ok": False, "error": "No valid settings in the body."},
            )
        return JSONResponse({"ok": True, "settings": write_settings(patch)})

    return router
