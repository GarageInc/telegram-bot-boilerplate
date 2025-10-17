# Fly.io Quick Start Guide

Quick reference for deploying to Fly.io.

## 📁 Project Structure

```
komi/test/
├── bot/
│   ├── fly.toml              # Bot app config (ggclicker-bot-4764)
│   └── Dockerfile
├── backend/
│   ├── fly.toml              # Backend app config (ggclicker-backend-4764)
│   └── Dockerfile
├── shared/                   # Shared code
├── fly-setup.sh             # Initial infrastructure setup
├── fly-deploy-all.sh        # Deploy apps
├── fly-secrets-setup.sh     # Configure secrets
└── fly-db-connect.sh        # Connect to database
```

## 🚀 Quick Deployment (3 Steps)

### 1. Setup Infrastructure (One-time)

```bash
./fly-setup.sh
```

This creates:
- PostgreSQL database: `ggclicker-bot-4764-db`
- Redis instance: `ggclicker-bot-4764-redis`

### 2. Configure Secrets

```bash
./fly-secrets-setup.sh
```

Follow the prompts to set:
- Bot secrets (BOT_TOKEN, REDIS_URL, etc.)
- Backend secrets (BOT_TOKEN, REDIS_URL)

### 3. Deploy Apps

```bash
./fly-deploy-all.sh
```

Choose:
- Deploy Bot only
- Deploy Backend only
- Deploy both

## 📋 Apps Overview

| App | URL | Port | Description |
|-----|-----|------|-------------|
| Bot | https://ggclicker-bot-4764.fly.dev | 3000 | Telegram bot with webhooks |
| Backend | https://ggclicker-backend-4764.fly.dev | 4000 | REST API backend |
| Database | ggclicker-bot-4764-db.internal | 5432 | PostgreSQL |
| Redis | ggclicker-bot-4764-redis.internal | 6379 | Redis (Upstash) |

## 🔧 Common Commands

### Deployment

```bash
# Deploy bot
cd /path/to/komi/test
fly deploy -c bot/fly.toml --app ggclicker-bot-4764

# Deploy backend
fly deploy -c backend/fly.toml --app ggclicker-backend-4764

# Use the script (easier)
./fly-deploy-all.sh
```

### Monitoring

```bash
# Check status
fly status --app ggclicker-bot-4764
fly status --app ggclicker-backend-4764

# View logs (real-time)
fly logs --app ggclicker-bot-4764
fly logs --app ggclicker-backend-4764

# Check health
curl https://ggclicker-bot-4764.fly.dev/health
curl https://ggclicker-backend-4764.fly.dev/health
```

### Secrets Management

```bash
# List secrets (names only)
fly secrets list --app ggclicker-bot-4764
fly secrets list --app ggclicker-backend-4764

# Set a secret
fly secrets set KEY="value" --app ggclicker-bot-4764

# Remove a secret
fly secrets unset KEY --app ggclicker-bot-4764

# Use the script (easier)
./fly-secrets-setup.sh
```

### Database Access

```bash
# Quick connect
fly postgres connect -a ggclicker-bot-4764-db

# Connect with script
./fly-db-connect.sh

# SSH into database
fly ssh console -a ggclicker-bot-4764-db
psql -U postgres
```

### Redis Access

```bash
# Get Redis connection info
fly redis status ggclicker-bot-4764-redis

# Connect with redis-cli
redis-cli -u "rediss://default:password@fly-ggclicker-bot-4764-redis.upstash.io:6379"
```

## 🔐 Required Secrets

### Bot App (`ggclicker-bot-4764`)

```bash
BOT_TOKEN                 # Telegram bot token
DATABASE_URL              # Auto-set when postgres attached
REDIS_URL                 # From fly redis status
QUEUE_REDIS_URL           # Same as REDIS_URL
BOT_WEBHOOK_HOST          # https://ggclicker-bot-4764.fly.dev
ENABLE_WEBHOOKS           # true
REFERRAL_CRYPTO_KEY       # openssl rand -hex 16
REFERRAL_CRYPTO_IV        # openssl rand -hex 8
MINI_APP_URL              # Your webapp URL
WEBHOOK_SECRET_TOKEN      # openssl rand -hex 32 (optional)
SLACK_WEBHOOK             # Slack webhook URL (optional)
TELEGRAM_API_ID           # For fastSend (optional)
TELEGRAM_API_HASH         # For fastSend (optional)
```

### Backend App (`ggclicker-backend-4764`)

```bash
BOT_TOKEN                 # Same as bot (for Telegram validation)
DATABASE_URL              # Auto-set when postgres attached
REDIS_URL                 # From fly redis status
```

## 🐛 Troubleshooting

### Bot not responding

```bash
# Check logs
fly logs --app ggclicker-bot-4764

# Verify webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Check health
curl https://ggclicker-bot-4764.fly.dev/health

# Restart
fly apps restart ggclicker-bot-4764
```

### Backend not working

```bash
# Check logs
fly logs --app ggclicker-backend-4764

# Check health
curl https://ggclicker-backend-4764.fly.dev/health

# SSH into machine
fly ssh console --app ggclicker-backend-4764
```

### Database connection issues

```bash
# Verify DATABASE_URL is set
fly secrets list --app ggclicker-bot-4764

# Test connection
fly ssh console --app ggclicker-bot-4764
echo $DATABASE_URL
```

### Out of memory

```bash
# Check current memory
fly status --app ggclicker-bot-4764

# Scale up (edit fly.toml or use command)
fly scale memory 1024 --app ggclicker-bot-4764
```

## 💰 Free Tier Limits

Fly.io free tier includes:
- **3 shared-cpu-1x VMs** (256MB RAM each)
- **3GB persistent volume** storage
- **160GB outbound** data transfer

Your setup uses:
- 1 VM for bot (512MB)
- 1 VM for backend (512MB)
- PostgreSQL (shared)
- Redis (Upstash free tier)

**Total: Fits in free tier!** 🎉

## 📚 Useful Links

- Fly.io Dashboard: https://fly.io/dashboard
- PostgreSQL Docs: https://fly.io/docs/postgres/
- Redis Docs: https://fly.io/docs/reference/redis/
- Secrets Docs: https://fly.io/docs/reference/secrets/

## 🔄 Update Apps

When you make code changes:

```bash
# Quick update
./fly-deploy-all.sh

# Or deploy individually
fly deploy -c bot/fly.toml --app ggclicker-bot-4764
fly deploy -c backend/fly.toml --app ggclicker-backend-4764
```

## 🗑️ Cleanup (if needed)

```bash
# Delete apps
fly apps destroy ggclicker-bot-4764
fly apps destroy ggclicker-backend-4764

# Delete database and Redis
fly postgres destroy ggclicker-bot-4764-db
fly redis destroy ggclicker-bot-4764-redis
```

---

**Need help?** Check the detailed guide in `FLY_DEPLOYMENT.md`

