#!/bin/sh
echo "---> Running start.sh <---_"

echo "Current Working Directory: $(pwd)"
echo "Listing files in /app:"
ls -la /app

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "PORT: $PORT (from environment)"
echo "NODE_ENV: $NODE_ENV (from environment)"

echo "Attempting to start server-test.js..."
# Run the application - Node will look in /app by default due to WORKDIR /app
node /app/server-test.js
