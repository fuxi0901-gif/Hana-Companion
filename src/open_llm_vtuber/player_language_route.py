"""
Player language endpoint.
=========================
Localhost-only REST endpoint the settings UI calls to read/write
``system_config.player_language``. The compiled frontend has always POSTed here
(the UI language follows the player language: zh-CN -> 简体 UI, zh-TW -> 繁體 UI),
but no handler existed, so the call 404'd and the language switch silently did
nothing. This route fixes that:

- GET  /api/player-language  -> {"language": "..."}
- POST /api/player-language  -> {"language": "...", "ok": true} — validates,
  surgically rewrites the leaf in conf.yaml (comments preserved; inserts the
  leaf if the template lacked it), then HOT-APPLIES it via the shared
  ConfigHotReloader (system prompt language instruction + ASR language clamp +
  simplified/traditional conversion switch all rebuild live).

Design notes (mirrors llm_config_route / translator_route conventions):
- Localhost+Tailscale guard REUSED verbatim from llm_config_route.
- conf.yaml writes are surgical line edits + atomic replace + one-time .bak.
- Accepted values: the UI's PLAYER_LANGUAGE_OPTIONS set (BCP47-ish), plus a
  permissive regex so future UI values don't 400.
"""

import os
import re

from fastapi import APIRouter, Request
from starlette.responses import JSONResponse
from loguru import logger

# REUSE the localhost+proxy guard — do not diverge.
from .llm_config_route import _is_local_request, _forbidden
from .translator_route import _quote_yaml_scalar, _atomic_write, _backup_once

CONF_PATH = "conf.yaml"

# BCP47-ish language tag: 2-3 letters, optional -subtags (each 2-8 alnum).
_LANGUAGE_RE = re.compile(r"^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$")

_SYSTEM_BLOCK_RE = re.compile(r"^(\s*)system_config:\s*(#.*)?$")


def _read_player_language() -> str | None:
    """Return the current player_language leaf, or None if unset/missing."""
    from .llm_config_route import _load_conf

    try:
        data = _load_conf()
        value = (data.get("system_config") or {}).get("player_language")
        return str(value) if value is not None else None
    except Exception as e:
        logger.error(f"player-language read failed: {type(e).__name__}: {e}")
        return None


def _write_player_language(language: str) -> None:
    """Surgically rewrite (or insert) system_config.player_language.

    Preserves every comment/structure outside the single leaf. Atomic write.
    Raises on structural problems so the caller can 500 without touching the
    file state.
    """
    with open(CONF_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Locate the top-level system_config: block.
    start = None
    block_indent = None
    for i, line in enumerate(lines):
        m = _SYSTEM_BLOCK_RE.match(line)
        if m:
            start = i
            block_indent = len(m.group(1))
            break
    if start is None:
        raise KeyError("system_config: block not found in conf.yaml")

    # Block extent: contiguous lines more-indented than the key.
    end = len(lines)
    for j in range(start + 1, len(lines)):
        raw = lines[j]
        if raw.strip() == "" or raw.lstrip().startswith("#"):
            continue
        if len(raw) - len(raw.lstrip()) <= block_indent:
            end = j
            break

    # Rewrite the leaf if it exists inside the block.
    for j in range(start + 1, end):
        stripped = lines[j].lstrip()
        if stripped.startswith("player_language:"):
            indent_ws = lines[j][: len(lines[j]) - len(stripped)]
            comment = ""
            m_comment = re.search(r"(\s+#.*?)\s*$", lines[j].rstrip("\n"))
            if m_comment:
                comment = m_comment.group(1)
            lines[j] = (
                f"{indent_ws}player_language: "
                f"{_quote_yaml_scalar(language)}{comment}\n"
            )
            _backup_once()
            _atomic_write(lines)
            return

    # Leaf missing (e.g. older template): insert right after the block key.
    indent_ws = " " * (block_indent + 2)
    lines.insert(start + 1, f"{indent_ws}player_language: '{language}'\n")
    _backup_once()
    _atomic_write(lines)


def init_player_language_route(hot_reloader=None) -> APIRouter:
    """Read/write system_config.player_language. Localhost-only.

    - GET  /api/player-language -> {"language": "..."}
    - POST /api/player-language -> validate, persist, hot-apply
    """
    router = APIRouter()

    @router.get("/api/player-language")
    async def get_player_language(request: Request):
        if not _is_local_request(request):
            return _forbidden()
        language = _read_player_language()
        if language is None:
            # Unset (e.g. template lacked the leaf) — report empty, not 500.
            return JSONResponse({"language": ""})
        return JSONResponse({"language": language})

    @router.post("/api/player-language")
    async def save_player_language(request: Request):
        if not _is_local_request(request):
            return _forbidden()
        try:
            body = await request.json()
        except Exception:
            return JSONResponse(
                status_code=400, content={"ok": False, "error": "Invalid JSON body."}
            )

        language = str(body.get("language", "")).strip()
        if not language or len(language) > 20 or not _LANGUAGE_RE.match(language):
            return JSONResponse(
                status_code=400,
                content={"ok": False, "error": "Invalid language value."},
            )

        try:
            _write_player_language(language)
        except Exception as e:
            logger.error(f"player-language write failed: {type(e).__name__}: {e}")
            return JSONResponse(
                status_code=500,
                content={"ok": False, "error": "Could not write config file."},
            )

        applied = False
        if hot_reloader is not None:
            try:
                result = await hot_reloader.reload_from_disk(
                    reason="player-language"
                )
                applied = bool(result.get("ok"))
            except Exception as e:
                logger.warning(
                    f"player-language hot-apply failed: {type(e).__name__}: {e}"
                )

        logger.info(f"player-language saved: {language} (hot_applied={applied})")
        return JSONResponse(
            {
                "ok": True,
                "language": language,
                "hot_applied": applied,
                "restart_required": False,
            }
        )

    return router
