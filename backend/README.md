# clicker backend

express api for the telegram mini app

## setup

```bash
bun install
cp .env.example .env
# edit .env with your values
```

## dev

```bash
bun dev
```

## prod

```bash
bun start
```

## endpoints

- `GET /health` - health check
- `GET /api/clicker/stats?userId=X&initData=Y` - get user stats
- `POST /api/clicker/click` - record clicks
  ```json
  { "userId": "123", "amount": 5, "initData": "..." }
  ```

all endpoints validate telegram web app data
