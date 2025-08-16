#!/bin/bash

# Set environment
PORT=${PORT:-8080}
NODE_ENV=${PRODUCTION:-production}
export PORT NODE_ENV

# Create logs directory
mkdir -p /home/LogFiles

# Log to file and console
exec > >(tee -a /home/LogFiles/startup.log) 2>&1
echo "[$(date)] Starting application..."

# Install dependencies
echo "[$(date)] Installing dependencies..."
npm install --only=production

# Build frontend if needed
echo "[$(date)] Building frontend..."
npm run build --if-present || echo "Build step failed or not needed"

# Start the application
echo "[$(date)] Starting Node.js application on port $PORT..."
exec node server.js