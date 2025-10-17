# Use the official Bun image as base
FROM oven/bun:1.2.19 AS base

WORKDIR /app

# Copy bot package files
COPY bot/package.json ./bot/package.json
COPY bot/bun.lock ./bot/bun.lock
COPY bot/bunfig.toml ./bot/bunfig.toml
COPY bot/drizzle.config.ts ./bot/drizzle.config.ts

# Copy shared package files
COPY shared/package.json ./shared/package.json
COPY shared/bun.lock ./shared/bun.lock

# Install bot dependencies
WORKDIR /app/bot
RUN bun install

# Install shared dependencies
WORKDIR /app/shared
RUN bun install

# Copy shared services
WORKDIR /app
COPY shared/ /app/shared/

# Copy bot source
COPY bot/src/ /app/bot/src/

# Production image
FROM oven/bun:1.2.19-slim AS production

WORKDIR /app

# Copy bot package files
COPY bot/package.json ./bot/package.json
COPY bot/bun.lock ./bot/bun.lock
COPY bot/bunfig.toml ./bot/bunfig.toml
COPY bot/drizzle.config.ts ./bot/drizzle.config.ts

# Copy shared package files
COPY shared/package.json ./shared/package.json
COPY shared/bun.lock ./shared/bun.lock

# Install production dependencies
WORKDIR /app/bot
RUN bun install

# Install shared dependencies
WORKDIR /app/shared
RUN bun install

# Copy shared services
WORKDIR /app
COPY shared/ /app/shared/

# Copy source from build stage
COPY --from=base /app/bot/src /app/bot/src

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production
ENV BUN_ENV=production

# Start the bot
CMD ["bun", "run", "start"] 