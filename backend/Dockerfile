FROM oven/bun:1.2.19

WORKDIR /app

# Copy common folder
COPY common/ ./common/

# Copy backend package.json
COPY backend/package.json ./package.json

# Install dependencies
RUN bun install --frozen-lockfile

# Copy backend source
COPY backend/src/ ./src/

# Expose port
EXPOSE 4000

# Start server
CMD ["bun", "start"]

