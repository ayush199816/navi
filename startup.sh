#!/bin/bash

# Exit on any error
set -e

# Install dependencies
npm install

# Build the frontend if needed
npm run build --if-present

# Get the port from environment variable or use default
PORT=${PORT:-8181}

# Function to check if port is in use
port_in_use() {
    netstat -tuln | grep -q ":$1 "
}

# If port is in use, kill the process using it
if port_in_use $PORT; then
    echo "Port $PORT is in use. Attempting to free it..."
    fuser -k $PORT/tcp || true
    sleep 2
fi

# Start the Node.js application
echo "Starting server on port $PORT..."
node server.js
