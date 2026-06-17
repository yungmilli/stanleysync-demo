@echo off
setlocal
title StanleySync Manual Database Maintenance

set "SUITE_DIR=C:\Users\mcsta\AppData\Local\StanleySyncApp\StanleySync_Suite"
set "APP_DIR=%SUITE_DIR%\apps\quoteflow"

echo ==========================================
echo   StanleySync Manual Database Maintenance
echo ==========================================
echo.
echo This script does NOT run old Lead-era migrations.
echo The legacy Lead table was replaced by Customer, QuoteFlow,
echo BusinessWorkspace, WorkFlow, and CalOps models.
echo.
echo This script only regenerates and validates Prisma.
echo Additive SQL migrations should be run manually only when
echo a new migration is intentionally added.
echo.

cd /d "%APP_DIR%"
if errorlevel 1 (
  echo ERROR: Could not open:
  echo %APP_DIR%
  pause
  exit /b 1
)

call npm.cmd run db:generate
if errorlevel 1 goto error

call npm.cmd run prisma:validate
if errorlevel 1 goto error

echo.
echo Prisma generate and validate completed.
echo No migrations were run automatically.
pause
exit /b 0

:error
echo.
echo Database maintenance failed. Review the message above.
pause
exit /b 1
