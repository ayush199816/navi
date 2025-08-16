#!/bin/bash

# Set environment
export NODE_ENV=production

# Create logs directory
mkdir -p /home/LogFiles

# Log to file and console
exec > >(tee -a /home/LogFiles/startup.log) 2>&1
echo "[$(date)] Starting application..."

# Ensure consistent port configuration
export PORT=${PORT:-3000}
export WEBSITES_PORT=${WEBSITES_PORT:-$PORT}

# Log environment variables for debugging
echo "[$(date)] Environment Variables:"
echo "- PORT: ${PORT}"
echo "- WEBSITES_PORT: ${WEBSITES_PORT}"
echo "- NODE_ENV: ${NODE_ENV}"

# Verify required environment variables
if [ -z "$MONGODB_URI" ]; then
  echo "[$(date)] ERROR: MONGODB_URI is not set" >&2
  exit 1
fi

# Set default port if not specified

# Install dependencies
echo "[$(date)] Installing dependencies..."
npm install --production

# Build frontend if needed
echo "[$(date)] Building frontend..."
npm run build --if-present || echo "Build step not needed or failed"

# Ensure server.js is executable
chmod +x server.js

# Start the application
echo "[$(date)] Starting Node.js application..."
exec node server.js