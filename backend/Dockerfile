FROM oven/bun:1.2.19

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Expose port
EXPOSE 4000

# Start server
CMD ["bun", "start"]

