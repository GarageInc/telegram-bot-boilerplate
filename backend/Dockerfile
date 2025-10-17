FROM oven/bun:1.2.19

WORKDIR /app

# Copy common folder
COPY common/ ./common/

# Copy backend files
COPY backend/package.json ./package.json
COPY backend/bunfig.toml ./bunfig.toml

# Install dependencies
RUN bun install --frozen-lockfile

# Copy backend source
COPY backend/src/ ./src/

# Expose port
EXPOSE 4000

# Start server
CMD ["bun", "start"]

