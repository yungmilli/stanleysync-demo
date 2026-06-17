@echo off
setlocal
title StanleySync Production Build

set "SUITE_DIR=C:\Users\mcsta\AppData\Local\StanleySyncApp\StanleySync_Suite"

echo ==========================================
echo   StanleySync Production Build
echo ==========================================
echo.
echo This builds the existing StanleySync app for production.
echo It does not run migrations and does not seed data.
echo.

cd /d "%SUITE_DIR%"
if errorlevel 1 (
  echo ERROR: Could not open:
  echo %SUITE_DIR%
  pause
  exit /b 1
)

call npm.cmd run db:generate
if errorlevel 1 goto error

call npm.cmd run prisma:validate
if errorlevel 1 goto error

call npm.cmd run build:production
if errorlevel 1 goto error

echo.
echo Production build completed.
echo Start with:
echo   npm run start:production
pause
exit /b 0

:error
echo.
echo Production build failed. Review the output above.
pause
exit /b 1
