FROM node:18-alpine

# --- ALTERNATIVE FIXES for OpenSSL 1.1 (if Prisma upgrade is not feasible) ---
#
# A. Pin to old Alpine (includes OpenSSL 1.1)
# FROM node:18-alpine3.18
#
# B. Switch to Debian slim and install libssl1.1
# FROM node:18-bullseye-slim
# RUN apt-get update && apt-get install -y --no-install-recommends libssl1.1 \
#  && rm -rf /var/lib/apt/lists/*
#
# C. Temporary symlink hack (least desirable - use if other options fail)
#    Requires `openssl` (OpenSSL 3.x) to be installed first.
# RUN apk add --no-cache openssl \
#  && ln -s /usr/lib/libssl.so.3     /usr/lib/libssl.so.1.1 \
#  && ln -s /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.1
#
# --- END ALTERNATIVE FIXES ---

WORKDIR /app

# Copy package files
COPY package*.json ./

# No extra system packages required with Prisma >= 5.4

# Install dependencies including dev dependencies for build
RUN npm install

# Copy source files
COPY tsconfig.json ./
COPY .env.example ./
COPY src/ ./src/
COPY prisma/ ./prisma/
COPY server-test.js ./
COPY start.sh ./

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Clean up dev dependencies
RUN npm prune --production

# Make the start script executable
RUN chmod +x /app/start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Run the application using the compiled JavaScript
CMD ["node", "dist/index.js"]
