FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

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
EXPOSE $PORT

# Run the application using the compiled JavaScript
CMD ["node", "dist/index.js"]
