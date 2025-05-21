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

# Railway will inject the PORT environment variable. 
# Our app must use process.env.PORT to bind correctly.

# Command to run the application - simply node (no PM2)
# This uses the "start" script from package.json
CMD ["npm", "start"]
