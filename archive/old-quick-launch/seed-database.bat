@echo off
setlocal
title StanleySync Seed Database

set "SUITE_DIR=C:\Users\mcsta\AppData\Local\StanleySyncApp\StanleySync_Suite"
set "APP_DIR=%SUITE_DIR%\apps\quoteflow"

echo ==========================================
echo   StanleySync Seed Database
echo ==========================================
echo.
echo Seeding demo workspaces, users, quotes, WorkFlow jobs, SiteBuilder, and CalOps data.
echo.

cd /d "%APP_DIR%"
if errorlevel 1 (
  echo Could not open the QuoteFlow app folder.
  pause
  exit /b 1
)

call npm.cmd run db:seed
if errorlevel 1 (
  echo.
  echo Seed command failed. Review the message above.
  pause
  exit /b 1
)
echo.
echo Seed command finished.
pause
