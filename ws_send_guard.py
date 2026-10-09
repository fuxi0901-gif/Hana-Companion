"""Serialize WebSocket writes per connection.

Why this exists: the server awaits ``websocket.send_text`` from several tasks that
belong to the SAME connection at the same time - the conversation chain, the
ordered TTS payload sender task, and the receive loop replying to a client
message. ``websockets.legacy.protocol.WebSocketCommonProtocol._drain_helper`` is
copied from ``asyncio.FlowControlMixin`` and asserts ``waiter is None or
waiter.cancelled()``; once the transport is paused (the base64 audio frames
easily exceed the write high-water mark) two concurrent sends leave that waiter
pending and the next one trips the assert. The bare ``AssertionError`` has an
empty ``str()``, so ``process_single_conversation`` logs
"Error in conversation chain: " and the client receives
``{"type": "error", "message": "Conversation error: "}`` - which is what the
desktop pet and the web page render as "回答中断".

Patching ``starlette.websockets.WebSocket.send`` - the single choke point every
``send_text`` / ``send_bytes`` / ``accept`` / ``close`` funnels through - with a
per-connection mutex restores the library invariant. Registered from
``run_server.py`` so nothing under ``src/`` has to change.
"""

import asyncio

from loguru import logger

_installed = False


def install() -> bool:
    """Wrap starlette's WebSocket.send with a per-connection lock. Idempotent."""
    global _installed
    if _installed:
        return True

    try:
        from starlette.websockets import WebSocket
    except Exception as e:  # pragma: no cover - starlette is a hard dependency
        logger.warning(f"WebSocket send guard unavailable ({type(e).__name__}: {e})")
        return False

    original_send = WebSocket.send
    if getattr(original_send, "_send_guard_installed", False):
        _installed = True
        return True

    async def send(self, message):
        lock = self.__dict__.get("_send_lock")
        if lock is None:
            lock = asyncio.Lock()
            self.__dict__["_send_lock"] = lock

        await lock.acquire()
        try:
            await original_send(self, message)
        finally:
            # release() is synchronous, so a cancelled sender still frees the lock
            lock.release()

    send._send_guard_installed = True
    WebSocket.send = send
    _installed = True
    logger.info("WebSocket writes are now serialized per connection.")
    return True
