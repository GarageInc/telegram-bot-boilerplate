# Fly.io Deployment Guide

This guide explains how to deploy the Telegram bot to Fly.io.

## Prerequisites

1. Install the Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Sign up and log in:
   ```bash
   fly auth signup
   # or if you already have an account:
   fly auth login
   ```

## Initial Setup

### 1. Create the App

```bash
# Create a new app (or use the existing fly.toml)
fly apps create clicker-bot --org personal
```

### 2. Set Up PostgreSQL Database

```bash
# Create a Postgres cluster
fly postgres create --name clicker-postgres --region fra

# Attach it to your app
fly postgres attach clicker-postgres --app clicker-bot
# This automatically sets DATABASE_URL as a secret
```

### 3. Set Up Redis

```bash
# Create a Redis instance
fly redis create --name clicker-redis --region fra --plan free

# Get the Redis URL
fly redis status clicker-redis

# Set the Redis URLs as secrets
fly secrets set REDIS_URL="redis://[your-redis-url]:6379" --app clicker-bot
fly secrets set QUEUE_REDIS_URL="redis://[your-redis-url]:6379" --app clicker-bot
```

### 4. Set Required Secrets

```bash
# Bot configuration
fly secrets set BOT_TOKEN="your-telegram-bot-token" --app clicker-bot
fly secrets set BOT_WEBHOOK_HOST="https://clicker-bot.fly.dev" --app clicker-bot
fly secrets set ENABLE_WEBHOOKS="true" --app clicker-bot

# Referral encryption keys (generate random strings)
fly secrets set REFERRAL_CRYPTO_KEY="your-32-character-hex-key" --app clicker-bot
fly secrets set REFERRAL_CRYPTO_IV="your-16-character-hex-iv" --app clicker-bot

# Mini app URL
fly secrets set MINI_APP_URL="https://your-webapp-url.com" --app clicker-bot

# Optional: Webhook security
fly secrets set WEBHOOK_SECRET_TOKEN="your-random-secret-token" --app clicker-bot

# Optional: Slack notifications
fly secrets set SLACK_WEBHOOK="https://hooks.slack.com/..." --app clicker-bot

# Optional: Fast send (MTProto)
fly secrets set TELEGRAM_API_ID="your-api-id" --app clicker-bot
fly secrets set TELEGRAM_API_HASH="your-api-hash" --app clicker-bot
```

### 5. Deploy

```bash
# Deploy the bot
fly deploy --app clicker-bot

# Check status
fly status --app clicker-bot

# View logs
fly logs --app clicker-bot
```

## Useful Commands

```bash
# View current secrets (names only)
fly secrets list --app clicker-bot

# SSH into the machine
fly ssh console --app clicker-bot

# Scale the app
fly scale count 1 --app clicker-bot
fly scale memory 256 --app clicker-bot

# Check app status
fly status --app clicker-bot

# View metrics
fly dashboard --app clicker-bot

# Restart the app
fly apps restart clicker-bot
```

## Database Migrations

If you need to run database migrations:

```bash
# SSH into the machine
fly ssh console --app clicker-bot

# Run your migration command
bun run migrate
```

## Monitoring

```bash
# Real-time logs
fly logs --app clicker-bot

# Health check status
fly checks list --app clicker-bot

# Machine status
fly machine list --app clicker-bot
```

## Troubleshooting

### Bot not responding to webhooks

1. Check if webhook is set correctly:
   ```bash
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
   ```

2. Verify the health check endpoint:
   ```bash
   curl https://clicker-bot.fly.dev/health
   ```

3. Check logs:
   ```bash
   fly logs --app clicker-bot
   ```

### Database connection issues

1. Verify DATABASE_URL is set:
   ```bash
   fly secrets list --app clicker-bot
   ```

2. Test database connection:
   ```bash
   fly ssh console --app clicker-bot
   # Inside the machine:
   psql $DATABASE_URL
   ```

### Memory issues

If the bot is running out of memory:

```bash
# Scale up memory
fly scale memory 512 --app clicker-bot
```

## GitHub Actions CI/CD (Optional)

Create `.github/workflows/fly-deploy.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only --app clicker-bot
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Get your Fly API token: `fly auth token`
Add it to GitHub: Settings → Secrets → Actions → New repository secret

## Cost

Fly.io free tier includes:
- 3 shared-cpu-1x VMs with 256MB RAM each
- 3GB persistent volume storage
- 160GB outbound data transfer

Your bot should easily fit within the free tier!

