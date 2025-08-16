@echo off
echo Starting deployment...

:: Set environment variables
set NODE_ENV=production

:: Install dependencies
echo Installing dependencies...
call npm install --only=production

:: Build the frontend if needed
echo Building frontend...
call npm run build --if-present

:: Start the application
echo Starting application...
node server.js

exit 0
