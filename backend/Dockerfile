FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose backend service port
EXPOSE 5000

# Set Node environment to production
ENV NODE_ENV=production

# Start Express server
CMD ["node", "index.js"]
