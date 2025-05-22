#!/usr/bin/env bash
set -e

echo "---> Running start.sh <---"

echo "Current Working Directory: $(pwd)"
echo "Node version: $(node -v)"
echo "PORT: $PORT (from environment)"
echo "NODE_ENV: $NODE_ENV (from environment)"

echo "Starting application from dist/index.js..."
# Run the main application
node dist/index.js
