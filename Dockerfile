FROM node:18-alpine

WORKDIR /app

# Install dependencies including openssl for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Ensure NODE_ENV is not 'production' here or use --include=dev
RUN npm install --include=dev

# Copy the rest of the application code
COPY . .

# Explicitly generate Prisma client after all source code is present
RUN npx prisma generate

# Build the application
RUN npm run build

# Set the environment variable directly in the container
ENV NODE_ENV=production

# Explicitly set PORT to 3000 as required by Railway
ENV PORT=3000

# Explicitly expose port 3000 as shown in Railway config
EXPOSE 3000

# Command to run the application - simply node (no PM2)
# This uses the "start" script from package.json
CMD ["npm", "start"]
