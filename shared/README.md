# Shared Services

This directory contains shared services used by both the backend and bot applications.

## Services

### Redis Service (`services/redis.service.ts`)
- Provides Redis connection and operations
- Used by both backend and bot for caching and data persistence

### Clicker Service (`services/clicker.service.ts`)
- Manages click counting and syncing
- Features:
  - Real-time click tracking in Redis
  - Periodic sync of active users (every 5 seconds)
  - Batch sync at 100 pending users
  - Automatic cache warming on startup

### Leaderboard Service (`services/leaderboard.service.ts`)
- Manages leaderboard functionality
- Caches top clickers with 5-second TTL
- Provides user ranking

## Usage

Both `backend` and `bot` import these services:

```typescript
import { makeRedisService } from "../../shared/services/redis.service";
import { makeClickerService } from "../../shared/services/clicker.service";
import { makeLeaderboardService } from "../../shared/services/leaderboard.service";
```

## Docker

The shared directory is copied into both Docker images:
- `backend/Dockerfile`: Copies `shared/` before building
- `bot/Dockerfile`: Copies `shared/` in both build and production stages
