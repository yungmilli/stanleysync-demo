@echo off
setlocal
title StanleySync Manual Seed

set "SUITE_DIR=C:\Users\mcsta\AppData\Local\StanleySyncApp\StanleySync_Suite"
set "APP_DIR=%SUITE_DIR%\apps\quoteflow"

echo ==========================================
echo   StanleySync Manual Seed
echo ==========================================
echo.
echo This refreshes demo data. It is optional.
echo It does not start the app.
echo.

cd /d "%APP_DIR%"
if errorlevel 1 (
  echo ERROR: Could not open:
  echo %APP_DIR%
  pause
  exit /b 1
)

call npm.cmd run db:seed
if errorlevel 1 (
  echo.
  echo Seed failed. Review the message above.
  pause
  exit /b 1
)

echo.
echo Seed completed.
pause
