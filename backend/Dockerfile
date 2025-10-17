FROM oven/bun:1.2.19

WORKDIR /app

# Copy backend files
COPY backend/package.json ./backend/package.json
COPY backend/bunfig.toml ./backend/bunfig.toml
COPY backend/drizzle.config.ts ./backend/drizzle.config.ts

# Copy shared package files
COPY shared/package.json ./shared/package.json
COPY shared/bun.lock ./shared/bun.lock

# Install backend dependencies
WORKDIR /app/backend
RUN bun install --frozen-lockfile

# Install shared dependencies
WORKDIR /app/shared
RUN bun install --frozen-lockfile

# Copy shared services
WORKDIR /app
COPY shared/ /app/shared/

# Copy backend source
COPY backend/src/ /app/backend/src/

# Expose port
EXPOSE 4000

WORKDIR /app/backend

# Start server
CMD ["bun", "start"]

