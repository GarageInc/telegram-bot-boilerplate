# Use the official Bun image as base
FROM oven/bun:1.2.19 as base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Type check
RUN bun run check

# Production image
FROM oven/bun:1.2.19-slim as production

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY --from=base /app/../common ../common

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Copy source from build stage
COPY --from=base /app/src ./src

# Expose port for health checks
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV BUN_ENV=production

# Start the bot
CMD ["bun", "run", "start"] 