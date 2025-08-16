#!/bin/bash

# Set environment
export NODE_ENV=production

# Create logs directory
mkdir -p /home/LogFiles

# Log to file and console
exec > >(tee -a /home/LogFiles/startup.log) 2>&1
echo "[$(date)] Starting application..."

# Log environment variables for debugging
echo "[$(date)] Environment Variables:"
echo "- PORT: ${PORT}"
echo "- WEBSITES_PORT: ${WEBSITES_PORT}"
echo "- NODE_ENV: ${NODE_ENV}"

# Set default port if not specified
export PORT=${PORT:-3000}
export WEBSITES_PORT=${WEBSITES_PORT:-$PORT}

# Ensure the port is available
if command -v lsof > /dev/null; then
    if lsof -i :$PORT | grep -q LISTEN; then
        echo "[$(date)] WARNING: Port $PORT is in use. Attempting to find an available port..."
        # Try to find an available port
        for p in $(seq 3000 4000); do
            if ! lsof -i :$p > /dev/null 2>&1; then
                echo "[$(date)] Found available port: $p"
                export PORT=$p
                export WEBSITES_PORT=$p
                break
            fi
done
    fi
fi

echo "[$(date)] Using port: $PORT"

# Install dependencies
echo "[$(date)] Installing dependencies..."
# Build frontend if needed
echo "[$(date)] Building frontend..."
npm run build --if-present || echo "Build step not needed or failed"

# Set default port if not specified
if [ -z "$PORT" ]; then
    PORT=3000
    echo "[$(date)] WARNING: No PORT environment variable set, defaulting to $PORT"
fi

# Export the port for Node.js
export PORT

# Start the Node.js application
echo "[$(date)] Starting Node.js application on port $PORT..."
node server.js