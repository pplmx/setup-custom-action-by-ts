# Base image for building the application
FROM node:22-bookworm AS builder

ARG NODE_MIRROR="https://registry.npmmirror.com"
RUN npm config set -g registry ${NODE_MIRROR}

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml to the container
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm i --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm build

# Run tests as part of the build process
RUN pnpm test

# Final image using distroless for running the application
FROM gcr.io/distroless/nodejs22-debian12

LABEL author="Mystic"

# Set working directory
WORKDIR /app

# Copy built application code and necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["dist/index.js"]
