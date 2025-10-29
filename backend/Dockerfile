# Use Node.js 20 LTS Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
# Note: 'g++', 'make', 'python3', 'sqlite-dev' are required
RUN apk add --no-cache python3 g++ make sqlite-dev

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies, forcing native modules to build from source
RUN npm install --build-from-source

# Copy the rest of the app
COPY . .

# Build TypeScript
RUN npm run build

# Create directories for volumes
RUN mkdir -p /app/data /app/media

# Expose backend port
EXPOSE 3000

# Default command
CMD ["node", "dist/server.js"]
