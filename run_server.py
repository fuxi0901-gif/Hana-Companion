import os
import sys
import time
import atexit
import socket
import asyncio
import argparse
import threading
import webbrowser
from pathlib import Path
import tomli
import uvicorn
from loguru import logger

from src.open_llm_vtuber.server import WebSocketServer
from src.open_llm_vtuber.config_manager import Config, read_yaml, validate_config

os.environ["HF_HOME"] = str(Path(__file__).parent / "models")
os.environ["MODELSCOPE_CACHE"] = str(Path(__file__).parent / "models")


def get_version() -> str:
    with open("pyproject.toml", "rb") as f:
        pyproject = tomli.load(f)
    return pyproject["project"]["version"]


def init_logger(console_log_level: str = "INFO") -> None:
    logger.remove()
    # Console output
    logger.add(
        sys.stderr,
        level=console_log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | {message}",
        colorize=True,
    )

    # File output
    logger.add(
        "logs/debug_{time:YYYY-MM-DD}.log",
        rotation="10 MB",
        retention="30 days",
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message} | {extra}",
        backtrace=True,
        diagnose=True,
    )


def parse_args():
    parser = argparse.ArgumentParser(description="Hana-Companion Server")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    parser.add_argument(
        "--hf_mirror", action="store_true", help="Use Hugging Face mirror"
    )
    parser.add_argument(
        "--open-browser",
        action="store_true",
        help="Open the app in the default browser once the server is actually ready",
    )
    return parser.parse_args()


def _open_browser_when_ready(host: str, port: int, timeout: float = 600.0) -> None:
    """Open the default browser ONLY after the server is accepting connections.

    The launcher used to open the browser on a fixed short delay, but first-run
    startup (downloading the speech model + loading the avatar) can take much
    longer, so the browser hit the port before uvicorn was listening and the user
    saw 'connection refused'. Poll the port and open exactly when it is ready."""
    connect_host = "127.0.0.1" if host in ("0.0.0.0", "", "::", "::1") else host
    url = f"http://localhost:{port}"
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection((connect_host, port), timeout=1.0):
                pass
        except OSError:
            time.sleep(0.5)
            continue
        # The port is accepting connections — the app is up. Open the browser once.
        try:
            webbrowser.open(url)
            logger.info(f"Opened {url} in your browser.")
        except Exception as e:
            logger.warning(
                f"Could not auto-open the browser ({type(e).__name__}: {e}). "
                f"Open {url} manually."
            )
        return
    logger.warning(
        "Server did not become ready in time; the browser was not auto-opened."
    )


@logger.catch
def run(console_log_level: str, open_browser: bool = False):
    init_logger(console_log_level)
    logger.info(f"Hana-Companion, version v{get_version()}")

    atexit.register(WebSocketServer.clean_cache)

    # First run: if conf.yaml is missing (e.g. a fresh download where conf.yaml is
    # not shipped), create it from the bundled default template so every entry
    # point works — the double-click launcher AND a plain `uv run run_server.py`.
    if not os.path.exists("conf.yaml"):
        import shutil

        _template = "config_templates/conf.hana-companion.default.yaml"
        if os.path.exists(_template):
            shutil.copy(_template, "conf.yaml")
            logger.info(
                "conf.yaml not found — created it from "
                "config_templates/conf.hana-companion.default.yaml (first run)."
            )
        else:
            logger.warning("conf.yaml not found and no default template available.")

    # Load configurations from yaml file
    config: Config = validate_config(read_yaml("conf.yaml"))
    server_config = config.system_config

    if server_config.enable_proxy:
        logger.info("Proxy mode enabled - /proxy-ws endpoint will be available")

    # Initialize the WebSocket server (synchronous part)
    server = WebSocketServer(config=config)

    # Perform asynchronous initialization (loading context, etc.)
    logger.info("Initializing server context...")
    try:
        asyncio.run(server.initialize())
        logger.info("Server context initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize server context: {e}")
        sys.exit(1)  # Exit if initialization fails

    # Open the browser only once the server is actually listening (opt-in; the
    # double-click launcher passes --open-browser). The thread polls the port and
    # opens exactly when ready, so a slow first-run startup never shows a
    # 'connection refused' page.
    if open_browser:
        threading.Thread(
            target=_open_browser_when_ready,
            args=(server_config.host, server_config.port),
            daemon=True,
        ).start()

    # Run the Uvicorn server
    logger.info(f"Starting server on {server_config.host}:{server_config.port}")
    uvicorn.run(
        app=server.app,
        host=server_config.host,
        port=server_config.port,
        log_level=console_log_level.lower(),
    )


if __name__ == "__main__":
    args = parse_args()
    console_log_level = "DEBUG" if args.verbose else "INFO"
    if args.verbose:
        logger.info("Running in verbose mode")
    else:
        logger.info(
            "Running in standard mode. For detailed debug logs, use: uv run run_server.py --verbose"
        )
    if args.hf_mirror:
        os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
    run(console_log_level=console_log_level, open_browser=args.open_browser)
