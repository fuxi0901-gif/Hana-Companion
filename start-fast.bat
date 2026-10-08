@echo off
REM ===========================================================================
REM Hana-Companion - FAST Windows launcher (double-clickable)
REM ---------------------------------------------------------------------------
REM Skips ALL setup checks and starts the server directly with the project's
REM local virtual environment (.venv). Use this as your DAILY launcher once
REM start-companion.bat has completed the first-run setup.
REM
REM Falls back to start-companion.bat automatically if .venv is missing.
REM ===========================================================================

setlocal enableextensions
title Hana-Companion (fast)

REM Always run from the folder this script lives in (the project root).
cd /d "%~dp0"

if not exist "pyproject.toml" (
  echo   Please run this from the extracted project folder, not from inside the ZIP.
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo   .venv not found - running the full first-run setup instead...
  call start-companion.bat
  exit /b %ERRORLEVEL%
)

if not exist "conf.yaml" (
  copy /Y "config_templates\conf.hana-companion.default.yaml" "conf.yaml" >nul
  echo   Created conf.yaml from the default template.
)

echo ============================================================
echo   Hana-Companion (fast start) - server starting...
echo   Leave THIS WINDOW OPEN while you chat.
echo   Browser opens automatically once the server is ready
echo   (or browse to http://localhost:12393 manually).
echo   To quit: close this window (or press Control-C).
echo ============================================================
echo.

".venv\Scripts\python.exe" run_server.py --open-browser

echo.
echo   Server stopped.
pause
