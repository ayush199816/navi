#!/bin/bash

# Exit on any error
set -e

# Azure App Service requires the application to listen on port 8080.
# We explicitly export this environment variable to ensure it's used.
export PORT=8080

# Install production dependencies
echo "Installing production dependencies..."
npm install --only=production

# The GitHub Actions workflow handles building, so this step might not be needed
# on the server. If your build process generates files needed for runtime,
# you can keep this line.
echo "Building frontend..."
npm run build --if-present

# This log message will now correctly show "Starting server on port 8080..."
echo "Starting server on port $PORT..."

# Use 0.0.0.0 to listen on all network interfaces
# The 'exec' command ensures that the Node.js process receives the
# PORT environment variable and gracefully handles signals from Azure.
exec node server.js