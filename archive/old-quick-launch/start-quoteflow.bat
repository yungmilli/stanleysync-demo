@echo off
setlocal
title StanleySync QuoteFlow Launcher

set "ROOT_DIR=C:\Users\mcsta\AppData\Local\StanleySyncApp"
set "SUITE_DIR=%ROOT_DIR%\StanleySync_Suite"
set "APP_URL=http://localhost:3000/quote"

echo ==========================================
echo   StanleySync QuoteFlow Local Launcher
echo ==========================================
echo.
echo Opening app folder:
echo %SUITE_DIR%
echo.
echo This opens customer-facing QuoteFlow intake.
echo Admin workspace is available at http://localhost:3000/admin
echo.

cd /d "%SUITE_DIR%"
if errorlevel 1 (
  echo Could not open the StanleySync suite folder.
  echo Check that StanleySyncApp exists in AppData\Local.
  echo.
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

echo Starting the QuoteFlow dev server...
echo The app will open in your browser at:
echo %APP_URL%
echo.

start "" "%APP_URL%"
call npm.cmd run dev

echo.
echo QuoteFlow has stopped or closed.
pause
