#!/bin/bash

# Exit on any error
set -e

# Install dependencies
npm install

# Build the frontend if needed
npm run build --if-present

# Start the Node.js application
node server.js
