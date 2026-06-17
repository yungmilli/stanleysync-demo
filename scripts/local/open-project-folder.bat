@echo off
setlocal
title Open StanleySync Suite Folder

set "SUITE_DIR=C:\Users\mcsta\AppData\Local\StanleySyncApp\StanleySync_Suite"

echo Opening:
echo %SUITE_DIR%
echo.

cd /d "%SUITE_DIR%"
if errorlevel 1 (
  echo ERROR: Could not open StanleySync_Suite.
  pause
  exit /b 1
)

start "" "%SUITE_DIR%"
pause
