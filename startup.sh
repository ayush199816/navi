#!/bin/bash

# Set environment
export NODE_ENV=production

# Create logs directory
mkdir -p /home/LogFiles

# Log to file and console
exec > >(tee -a /home/LogFiles/startup.log) 2>&1
echo "[$(date)] Starting application..."

# Function to check if port is in use
port_in_use() {
    local port=$1
    if command -v lsof > /dev/null; then
        if lsof -i :$port | grep -q LISTEN; then
            return 0 # Port is in use
        fi
    fi
    return 1 # Port is available
}

# Try multiple ports if needed
PORTS_TO_TRY=(${PORT} 3000 3001 8080 8081 5000 5001)
AVAILABLE_PORT=""

for port in "${PORTS_TO_TRY[@]}"; do
    if ! port_in_use $port; then
        AVAILABLE_PORT=$port
        break
    fi
    echo "[$(date)] Port $port is in use, trying next..."
done

if [ -z "$AVAILABLE_PORT" ]; then
    echo "[$(date)] ERROR: No available ports to use. Please free up a port and try again."
    exit 1
fi

export PORT=$AVAILABLE_PORT
echo "[$(date)] Using port: $PORT"

# Kill any existing Node.js processes that might be using this port
if command -v lsof > /dev/null; then
    if lsof -i :$PORT | grep -q LISTEN; then
        echo "[$(date)] Found processes using port $PORT, attempting to terminate..."
        lsof -ti :$PORT | xargs kill -9 || true
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
echo "[$(date)] Starting Node.js application on port $PORT..."
node server.js