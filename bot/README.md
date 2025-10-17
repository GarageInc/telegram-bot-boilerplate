# telegram clicker game

click button, number go up

## setup

```bash
bun install
cd backend && bun install && cd ..
cd web && bun install && cd ..
```

## env

```env
BOT_TOKEN=...
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
QUEUE_REDIS_URL=redis://localhost:6379
MINI_APP_URL=https://your-domain.com/miniapp
BACKEND_PORT=4000
```

## migrations

```bash
psql $DATABASE_URL -f src/infra/database/drizzle/0001_cute_leech.sql
```

## dev

```bash
bun dev                      # bot
cd backend && bun dev        # api
cd web && bun dev            # frontend
```

## prod

```bash
cd web && bun run build && cd ..
docker-compose up -d
```

## structure

```
├── src/          # telegram bot
├── backend/      # express api
├── web/          # react mini app
└── common/       # shared code
    ├── database/
    ├── repositories/
    └── services/
```

## how it works

user clicks → express api → redis → postgres (batched) → bot broadcasts updates

- common = shared services
- backend = api server
- src = telegram bot
- web = mini app ui
