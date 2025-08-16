#!/bin/bash

# Exit on any error
set -e

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the frontend if needed
echo "Building frontend..."
npm run build --if-present

# Get the port from environment variable or use default
PORT=${PORT:-8181}

# In Azure, we don't need to check for port in use
# as each deployment gets its own isolated environment

echo "Starting server on port $PORT..."
# Use 0.0.0.0 to listen on all network interfaces
node server.js
