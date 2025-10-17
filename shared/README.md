# Shared Services

This directory contains shared code used by both the backend and bot applications.

## Structure

- `database/` - Shared database schemas
  - `schema.ts` - Drizzle ORM schema definitions
- `repositories/` - Shared repository implementations
  - `user.repository.ts` - User data access layer
- `services/` - Shared service implementations
  - `clicker.service.ts` - Click tracking and user interaction service
  - `leaderboard.service.ts` - Leaderboard ranking service
  - `redis.service.ts` - Redis client wrapper with connection management

## Database Schema

The `database/schema.ts` file defines the PostgreSQL schema used across all services:
- `users` table with click tracking, referrals, and user metadata
- `MessageStore` table for message persistence
- Type-safe schema exports for use with Drizzle ORM

## Repositories

### User Repository (`repositories/user.repository.ts`)
Complete user data access layer with all CRUD operations:
- Basic CRUD: `findAll`, `findById`, `newUser`, `updateUser`, `deleteUser`
- Search: `findUserByUsername`, `findUserByRefCode`, `findUserByDisplayName`
- Referrals: `getAllReferredUsersRecursive`, `getReferredUsersCount`
- Bulk operations: `findByIds`, `updateUsersWhitelisted`, `findWhitelistedIdsByIds`
- Leaderboard: `getTopClickerUsers`, `getUserRank`

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

Both `backend` and `bot` import these shared modules:

```typescript
// Database schema
import { users } from "../../shared/database/schema";

// Repositories
import { makeUserRepository } from "../../shared/repositories/user.repository";

// Services
import { makeRedisService } from "../../shared/services/redis.service";
import { makeClickerService } from "../../shared/services/clicker.service";
import { makeLeaderboardService } from "../../shared/services/leaderboard.service";
```

## Docker

The Dockerfiles maintain the correct directory structure:
- Working directory: `/app`
- Shared code: `/app/shared/`
- Backend code: `/app/backend/`
- Bot code: `/app/bot/`

This ensures that relative imports like `../../../shared/` work correctly in both development and production environments.
