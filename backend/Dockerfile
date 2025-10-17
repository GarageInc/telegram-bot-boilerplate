FROM oven/bun:1.2.19

WORKDIR /app

# Copy backend files
COPY backend/package.json ./backend/package.json
COPY backend/bunfig.toml ./backend/bunfig.toml
COPY backend/drizzle.config.ts ./backend/drizzle.config.ts

# Install dependencies
WORKDIR /app/backend
RUN bun install --frozen-lockfile

# Copy shared services
COPY shared/ /app/shared/

# Copy backend source
COPY backend/src/ /app/backend/src/

# Expose port
EXPOSE 4000

# Start server
CMD ["bun", "start"]

