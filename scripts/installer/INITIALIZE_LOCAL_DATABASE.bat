@echo off
setlocal
title StanleySync Database Initialization

set "INSTALL_DIR=%~dp0"
set "SUITE_DIR=%INSTALL_DIR%StanleySync_Suite"

echo ==========================================
echo   StanleySync Local Database Initialization
echo ==========================================
echo.
echo This runs Prisma generate, validates the schema, and applies
echo production migrations with prisma migrate deploy.
echo.
echo It does not seed demo data unless you run npm.cmd run db:seed manually.
echo.

cd /d "%SUITE_DIR%"
if errorlevel 1 (
  echo ERROR: Could not open:
  echo %SUITE_DIR%
  pause
  exit /b 1
)

if not exist ".env" (
  echo ERROR: .env file is missing.
  echo Create .env from .env.example and set DATABASE_URL, NEXTAUTH_SECRET,
  echo NEXTAUTH_URL, APP_BASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD.
  pause
  exit /b 1
)

call npm.cmd install
if errorlevel 1 goto error

call npm.cmd run db:generate
if errorlevel 1 goto error

call npm.cmd run prisma:validate
if errorlevel 1 goto error

call npm.cmd run db:deploy
if errorlevel 1 goto error

call npm.cmd run build:production
if errorlevel 1 goto error

echo.
echo Database initialized and production build completed.
echo Start StanleySync from the desktop or Start Menu shortcut.
echo First run setup:
echo   http://localhost:3000/admin/first-run
pause
exit /b 0

:error
echo.
echo Initialization failed. Review the error above.
pause
exit /b 1
