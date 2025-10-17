# Use the official Bun image as base
FROM oven/bun:1.2.19 AS base

# Set working directory
WORKDIR /app

# Copy common folder
COPY common/ ./common/

# Copy bot files
COPY bot/package.json bot/bun.lock ./
RUN bun install --frozen-lockfile

COPY bot/ ./


# Production image
FROM oven/bun:1.2.19-slim AS production

WORKDIR /app

# Copy common folder
COPY common/ ./common/

# Copy bot package files
COPY bot/package.json bot/bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy source from build stage
COPY --from=base /app/src ./src

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production
ENV BUN_ENV=production

# Start the bot
CMD ["bun", "run", "start"] 