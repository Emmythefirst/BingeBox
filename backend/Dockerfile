# Simple Dockerfile for the backend service
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "dist/index.js"]
