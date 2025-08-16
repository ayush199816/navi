@echo off
echo Starting deployment...

:: Set environment variables
set NODE_ENV=production
set PORT=3000
set WEBSITE_NODE_DEFAULT_VERSION=18-lts

:: Change to app directory
cd /d %~dp0

:: Install dependencies
echo Installing dependencies...
call npm install --production

:: Build frontend if needed
if exist "package.json" (
  findstr /i /c:"\"build\"" package.json >nul 2>&1
  if %ERRORLEVEL% EQU 0 (
    echo Building frontend...
    call npm run build
  )
)

:: Start the server
echo Starting server on port %PORT%...
call node server.js

exit 0
