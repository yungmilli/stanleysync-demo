@echo off
setlocal
title StanleySync App

set "INSTALL_DIR=%~dp0"
set "SUITE_DIR=%INSTALL_DIR%StanleySync_Suite"
set "APP_URL=http://localhost:3000"
set "LOGIN_URL=http://localhost:3000/login"

echo ==========================================
echo   StanleySync App
echo ==========================================
echo.
echo Installed suite folder:
echo %SUITE_DIR%
echo.

cd /d "%SUITE_DIR%"
if errorlevel 1 (
  echo ERROR: Could not open the StanleySync_Suite folder.
  echo Expected:
  echo %SUITE_DIR%
  echo.
  pause
  exit /b 1
)

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel%==0 (
  echo Port 3000 is already in use.
  echo StanleySync may already be running.
  echo.
  echo Open:
  echo   %APP_URL%
  echo Login:
  echo   %LOGIN_URL%
  echo.
  start "" "%APP_URL%"
  pause
  exit /b 0
)

if not exist ".next" (
  echo Production build not found.
  echo Run Initialize StanleySync Database, then run:
  echo   npm.cmd run build:production
  echo.
  pause
  exit /b 1
)

echo Starting StanleySync production server.
echo Open:
echo   %APP_URL%
echo Login:
echo   %LOGIN_URL%
echo First run setup:
echo   %APP_URL%/admin/first-run
echo.
echo Press Ctrl+C to stop.
echo.

start "" cmd /c "timeout /t 4 /nobreak >nul && start "" http://localhost:3000"
call npm.cmd run start:production

echo.
echo StanleySync stopped.
pause
