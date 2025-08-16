#!/bin/bash

# Exit on any error
set -e

# Azure App Service requires the application to listen on port 8080.
# We explicitly export this environment variable to ensure it's used.
export PORT=8080

# Create logs directory if it doesn't exist
mkdir -p /home/LogFiles

# Redirect all output to the log file
exec > >(tee -a /home/LogFiles/startup.log) 2>&1

echo "[$(date)] Starting application..."

# Install production dependencies
echo "[$(date)] Installing production dependencies..."
npm install --only=production

# Build the frontend if needed
echo "[$(date)] Building frontend..."
npm run build --if-present

# Start the Node.js application
echo "[$(date)] Starting server on port $PORT..."

# Use exec to replace the shell process with Node.js
exec node server.js