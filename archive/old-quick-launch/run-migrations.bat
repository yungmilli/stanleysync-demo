@echo off
setlocal
title StanleySync Database Migration Runner

set "SUITE_DIR=C:\Users\mcsta\AppData\Local\StanleySyncApp\StanleySync_Suite"
set "APP_DIR=%SUITE_DIR%\apps\quoteflow"

echo ==========================================
echo   StanleySync Database Migration Runner
echo ==========================================
echo.
echo Project:
echo %APP_DIR%
echo.

netstat -ano | findstr ":3000" >nul
if not errorlevel 1 (
  echo A dev server appears to be running on port 3000.
  echo Stop it before migrations if Prisma reports a locked engine file.
  echo.
)

cd /d "%APP_DIR%"
if errorlevel 1 (
  echo Could not open the QuoteFlow app folder.
  pause
  exit /b 1
)

call npm.cmd run db:generate
if errorlevel 1 goto error
call npx.cmd prisma db execute --file prisma\migrations\20260422190000_ops_backfill_manual\migration.sql --schema prisma\schema.prisma
if errorlevel 1 goto error
call npx.cmd prisma db execute --file prisma\migrations\20260422190500_quote_status_backfill_manual\migration.sql --schema prisma\schema.prisma
if errorlevel 1 goto error
call npx.cmd prisma db execute --file prisma\migrations\20260428130000_quoteflow_workorder_drafts\migration.sql --schema prisma\schema.prisma
if errorlevel 1 goto error
call npx.cmd prisma db execute --file prisma\migrations\20260428133000_quote_request_legacy_cleanup\migration.sql --schema prisma\schema.prisma
if errorlevel 1 goto error
call npx.cmd prisma db execute --file prisma\migrations\20260508120000_modular_suite_workspaces\migration.sql --schema prisma\schema.prisma
if errorlevel 1 goto error
call npx.cmd prisma db execute --file prisma\migrations\20260508150000_phase5_product_ux_foundation\migration.sql --schema prisma\schema.prisma
if errorlevel 1 goto error
echo.
echo Migration commands finished.
pause
exit /b 0

:error
echo.
echo Migration command failed. Review the message above.
pause
exit /b 1
