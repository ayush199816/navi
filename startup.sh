#!/bin/bash

# Set environment
export NODE_ENV=production

# Create logs directory
mkdir -p /home/LogFiles

# Log to file and console
exec > >(tee -a /home/LogFiles/startup.log) 2>&1
echo "[$(date)] Starting application..."

# Kill any existing Node.js processes using the same port
echo "[$(date)] Checking for processes using port $PORT..."
if command -v lsof > /dev/null; then
    if lsof -i :${PORT:-8080} | grep -q LISTEN; then
        echo "[$(date)] Found processes using port ${PORT:-8080}, attempting to terminate..."
        lsof -ti :${PORT:-8080} | xargs kill -9 || true
        sleep 2
    fi
fi

# Install dependencies
echo "[$(date)] Installing dependencies..."
npm install --only=production

# Build frontend if needed
echo "[$(date)] Building frontend..."
npm run build --if-present || echo "Build step failed or not needed"

# Start the application
echo "[$(date)] Starting Node.js application..."
exec node server.js