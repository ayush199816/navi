#!/bin/bash

# Exit on any error
set -e

# Set environment
PORT=${PORT:-8080}
NODE_ENV=${NODE_ENV:-production}

export PORT NODE_ENV

# Create logs directory
mkdir -p /home/LogFiles

# Install dependencies
echo "[$(date)] Installing dependencies..."
npm install --only=production

# Build frontend if needed
echo "[$(date)] Building frontend..."
npm run build --if-present

# Start the application
echo "[$(date)] Starting Node.js application on port $PORT..."
exec node server.js