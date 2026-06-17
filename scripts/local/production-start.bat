@echo off
setlocal
title StanleySync Production Start

set "SUITE_DIR=C:\Users\mcsta\AppData\Local\StanleySyncApp\StanleySync_Suite"

echo ==========================================
echo   StanleySync Production Start
echo ==========================================
echo.
echo This starts the built app with Next.js production mode.
echo Run production-build.bat first after code or dependency changes.
echo.

cd /d "%SUITE_DIR%"
if errorlevel 1 (
  echo ERROR: Could not open:
  echo %SUITE_DIR%
  pause
  exit /b 1
)

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel%==0 (
  echo Port 3000 is already in use.
  echo Stop the existing server first:
  echo   scripts\local\stop-dev-server.bat
  pause
  exit /b 1
)

echo Starting StanleySync at:
echo   http://localhost:3000
echo Login:
echo   http://localhost:3000/login
echo.
echo Press Ctrl+C to stop.
echo.

call npm.cmd run start:production

echo.
echo StanleySync production server stopped.
pause
