# Stage 1: Build environment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including dev for building)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Compile TypeScript
RUN npm run build


# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variable for production optimizations
ENV NODE_ENV=production

# Copy package files and install ONLY production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy compiled JavaScript from the builder stage
COPY --from=builder /app/dist ./dist

# The API runs on port 5000 by default (as per env.ts)
EXPOSE 5000

# Run the API server by default.
# Note: To run the background worker using this same image, 
# override the command in your docker-compose.yml to: CMD ["node", "dist/workers/ingestWorker.js"]
CMD ["node", "dist/index.js"]