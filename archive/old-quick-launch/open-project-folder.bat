@echo off
setlocal
title Open StanleySync Project Folder

set "ROOT_DIR=C:\Users\mcsta\AppData\Local\StanleySyncApp"
set "SUITE_DIR=%ROOT_DIR%\StanleySync_Suite"

echo ==========================================
echo   Open StanleySync Project Folder
echo ==========================================
echo.
echo Opening:
echo %SUITE_DIR%
echo.

cd /d "%ROOT_DIR%"
if errorlevel 1 (
  echo Could not open StanleySyncApp root.
  pause
  exit /b 1
)

if not exist "%SUITE_DIR%" (
  echo StanleySync_Suite folder was not found.
  pause
  exit /b 1
)

start "" "%SUITE_DIR%"
pause
