@echo off
setlocal
title StanleySync CoreOps Launcher

set "ROOT_DIR=C:\Users\mcsta\AppData\Local\StanleySyncApp"
set "SUITE_DIR=%ROOT_DIR%\StanleySync_Suite"
set "APP_URL=http://localhost:3000/admin"

echo ==========================================
echo   StanleySync CoreOps Local Launcher
echo ==========================================
echo.
echo Project:
echo %SUITE_DIR%
echo.
echo Starting the modular StanleySync suite:
echo - CoreOps
echo - QuoteFlow
echo - WorkFlow
echo - SiteBuilder
echo - CalOps when enabled
echo.

cd /d "%SUITE_DIR%"
if errorlevel 1 (
  echo Could not open the StanleySync suite folder.
  pause
  exit /b 1
)

netstat -ano | findstr ":3000" >nul
if not errorlevel 1 (
  echo A dev server already appears to be running on port 3000.
  echo Opening %APP_URL%
  start "" "%APP_URL%"
  pause
  exit /b 0
)

echo Opening %APP_URL%
start "" "%APP_URL%"
call npm.cmd run dev

echo.
echo StanleySync has stopped.
pause
