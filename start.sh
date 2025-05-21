#!/bin/sh
echo "Starting application..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "PORT: $PORT"
echo "NODE_ENV: $NODE_ENV"

# Run the application
node server-test.js
