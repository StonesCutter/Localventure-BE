FROM node:18-alpine

WORKDIR /app

# Install dependencies including openssl
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install Node.js dependencies
RUN npm install

# Copy source code
COPY . .


# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "dev"]
