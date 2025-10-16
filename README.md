# Telegram Clicker Game Bot

A scalable Telegram bot clicker game built with Bun, grammY, React, PostgreSQL, and Redis.

## Features

- 🎮 Telegram Mini App with React UI
- 🏆 Real-time leaderboard (top 20 clickers)
- 📊 Live stats updates with adaptive rate limiting
- ⚡ Redis-backed click counters for performance
- 🗄️ PostgreSQL for persistent storage
- 🔄 Automatic session management
- 📱 Responsive design with Telegram theme support
- 🎯 Handles 100k+ users and 5k+ concurrent sessions

## Getting Started

### Prerequisites

- Bun runtime
- PostgreSQL database
- Redis server
- Telegram Bot Token

### Installation

```bash
# Install backend dependencies
bun install

# Install frontend dependencies
cd web
bun install
cd ..
```

### Environment Variables

Create a `.env` file in the root directory:

```env
BOT_TOKEN=your_bot_token
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
QUEUE_REDIS_URL=redis://localhost:6379
MINI_APP_URL=https://your-domain.com/miniapp
DATA_ENCRYPTION_KEY=your_encryption_key
REFERRAL_CRYPTO_KEY=your_crypto_key
REFERRAL_CRYPTO_IV=your_crypto_iv
```

### Database Setup

```bash
# Run migrations
psql $DATABASE_URL -f src/infra/database/drizzle/0001_cute_leech.sql
```

### Development

```bash
# Run backend in watch mode
bun dev

# Run frontend dev server (separate terminal)
cd web
bun run dev

# Type check
bun check
```

### Production Build

```bash
# Build frontend
cd web
bun run build
cd ..

# Run backend
bun start
```

### Docker Deployment

```bash
# Build and run with docker-compose
docker-compose up -d
```

## Project Structure

```
├── src/
│   ├── api/              # API handlers for Mini App
│   ├── command/          # Bot commands
│   ├── menus/            # Telegram bot menus
│   ├── services/         # Business logic services
│   │   ├── clicker.service.ts
│   │   ├── leaderboard.service.ts
│   │   └── broadcaster.service.ts
│   ├── repositories/     # Database layer
│   └── infra/            # Infrastructure (DB, Redis)
├── web/                  # React Mini App
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   └── types/        # TypeScript types
│   └── dist/             # Built files (generated)
└── docs/                 # Documentation
```

## Architecture

### Backend Services

- **ClickerService**: Manages click increments with Redis caching
- **LeaderboardService**: Handles top 20 rankings with caching
- **BroadcasterService**: Real-time updates with adaptive rate limiting

### Rate Limiting Strategy

The broadcaster service automatically adjusts update intervals based on active sessions:
- 2-second intervals with few users
- Up to 30 seconds with 5000+ concurrent users
- Stays within Telegram's 30 msg/sec rate limit

### Data Flow

1. User clicks in Mini App
2. Client-side batching (500ms debounce)
3. API call to backend
4. Redis increment (instant)
5. PostgreSQL sync (batched, 100 users)
6. Broadcaster pushes updates to active sessions

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for more information.
