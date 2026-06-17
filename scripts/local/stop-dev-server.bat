@echo off
setlocal
title Stop StanleySync Dev Server

echo ==========================================
echo   Stop StanleySync Dev Server
echo ==========================================
echo.

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000"') do (
  echo Stopping process %%p on port 3000...
  taskkill /PID %%p /F
)

echo.
echo If no process was listed, port 3000 was already free.
pause
