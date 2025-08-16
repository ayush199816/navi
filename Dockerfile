# Use Node.js 22 LTS as base image
FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source
COPY . .

# Create startup script
RUN echo '#!/bin/sh\nnode server.js' > /usr/local/bin/start.sh && \
    chmod +x /usr/local/bin/start.sh

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run the app
CMD ["/usr/local/bin/start.sh"]
