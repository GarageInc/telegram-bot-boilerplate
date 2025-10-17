#!/bin/bash
# Fly.io Setup Script for ggclicker-bot-4764

set -e  # Exit on error

ORIGINAL_APP_NAME="ggclicker-bot"
APP_NAME="ggclicker-bot-4764"
REGION="ams"  # Amsterdam
DB_NAME="${APP_NAME}-db"
REDIS_NAME="${APP_NAME}-redis"

echo "🚀 Setting up Fly.io services for ${APP_NAME}"

# Check if fly is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Install it:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if logged in
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io. Run: fly auth login"
    exit 1
fi

echo ""
echo "📦 Step 1: Creating PostgreSQL database..."
if fly postgres list | grep -q "${DB_NAME}"; then
    echo "✅ PostgreSQL ${DB_NAME} already exists"
else
    fly postgres create \
      --name ${DB_NAME} \
      --region ${REGION} \
      --initial-cluster-size 1 \
      --vm-size shared-cpu-1x \
      --volume-size 1
    echo "✅ PostgreSQL ${DB_NAME} created"
fi

echo ""
echo "🔗 Step 2: Attaching PostgreSQL to app..."
if fly postgres db list --app ${DB_NAME} 2>/dev/null | grep -q "${ORIGINAL_APP_NAME}"; then
    echo "✅ PostgreSQL already attached"
else
    fly postgres attach ${DB_NAME} --app ${ORIGINAL_APP_NAME}
    echo "✅ PostgreSQL attached (DATABASE_URL auto-set)"
fi

echo ""
echo "🔴 Step 3: Creating Redis instance..."
if fly redis list | grep -q "${REDIS_NAME}"; then
    echo "✅ Redis ${REDIS_NAME} already exists"
else
    fly redis create \
      --name ${REDIS_NAME} \
      --region ${REGION} 
    echo "✅ Redis ${REDIS_NAME} created"
fi

echo ""
echo "📝 Step 4: Getting Redis connection info..."
REDIS_STATUS=$(fly redis status ${REDIS_NAME} 2>/dev/null || echo "")
if [ -z "$REDIS_STATUS" ]; then
    echo "❌ Could not get Redis status"
    exit 1
fi

echo "$REDIS_STATUS"
echo ""
echo "⚠️  Copy the Redis 'Private URL' from above and run:"
echo ""
echo "fly secrets set \\"
echo "  REDIS_URL='<paste-private-url-here>' \\"
echo "  QUEUE_REDIS_URL='<paste-private-url-here>' \\"
echo "  --app ${APP_NAME}"
echo ""


echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set all required secrets (see above)"
echo "2. Deploy your app:"
echo "   cd /path/to/komi/test"
echo "   fly deploy -c bot/fly.toml"
echo ""
echo "3. Check status:"
echo "   fly status --app ${APP_NAME}"
echo "   fly logs --app ${APP_NAME}"

