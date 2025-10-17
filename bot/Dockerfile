# Use the official Bun image as base
FROM oven/bun:1.2.19 AS base

WORKDIR /app


# Copy bot package files
COPY bot/package.json ./package.json
COPY bot/bun.lock ./bun.lock
COPY bot/bunfig.toml ./bunfig.toml
COPY bot/drizzle.config.ts ./drizzle.config.ts

# Install dependencies
RUN bun install --frozen-lockfile

# Copy bot source
COPY bot/src/ ./src/

# Production image
FROM oven/bun:1.2.19-slim AS production

WORKDIR /app

# Copy bot package files
COPY bot/package.json ./package.json
COPY bot/bun.lock ./bun.lock
COPY bot/bunfig.toml ./bunfig.toml
COPY bot/drizzle.config.ts ./drizzle.config.ts

# Install production dependencies
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