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

# Railway will inject the PORT environment variable. 
# EXPOSE is good for documentation but your app must use process.env.PORT.
# No need to EXPOSE if Railway handles it.

# Command to run the application
# This uses the "start" script from package.json: "NODE_ENV=production pm2-runtime start ecosystem.config.js"
CMD ["npm", "start"]
