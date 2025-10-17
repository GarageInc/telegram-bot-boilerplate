# Use the official Bun image as base - pinned to specific version
FROM oven/bun:1.2.19 as base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock drizzle.config.ts ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build web app
WORKDIR /app/web
RUN bun install --frozen-lockfile
RUN bun run build

# Type check the main project
WORKDIR /app
RUN bun run check

# Build stage (optional - Bun can run TypeScript directly)
FROM base as build

# Create production image - pinned to specific version
FROM oven/bun:1.2.19-slim as production

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package.json bun.lock drizzle.config.ts ./
RUN bun install --frozen-lockfile --production

# Copy built application
COPY --from=build /app/src ./src

# Copy built web app
COPY --from=build /app/web/dist ./web/dist

# Expose port (if needed for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun --version || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV BUN_ENV=production

# Start the application
CMD ["bun", "run", "start"] 