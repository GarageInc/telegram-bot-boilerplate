#!/bin/bash
# Setup all required secrets for Fly.io apps

set -e

BOT_APP="ggclicker-bot-4764"
BACKEND_APP="ggclicker-backend-4764"

echo "🔐 Fly.io Secrets Setup"
echo "======================"
echo ""

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

echo "Select app to configure:"
echo ""
echo "1) Bot (${BOT_APP})"
echo "2) Backend (${BACKEND_APP})"
echo "3) Both"
echo ""
read -p "Enter choice [1-3]: " choice

setup_bot_secrets() {
    echo ""
    echo "🤖 Setting up Bot secrets..."
    echo "============================"
    echo ""
    
    # Check current secrets
    echo "Current secrets:"
    fly secrets list --app ${BOT_APP}
    echo ""
    
    # Prompt for each secret
    read -p "Enter BOT_TOKEN (Telegram bot token): " BOT_TOKEN
    read -p "Enter MINI_APP_URL (webapp URL): " MINI_APP_URL
    read -p "Enter REDIS_URL (from fly redis status): " REDIS_URL
    
    echo ""
    echo "Generating crypto keys..."
    REFERRAL_CRYPTO_KEY=$(openssl rand -hex 16)
    REFERRAL_CRYPTO_IV=$(openssl rand -hex 8)
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    
    echo "Generated REFERRAL_CRYPTO_KEY: ${REFERRAL_CRYPTO_KEY}"
    echo "Generated REFERRAL_CRYPTO_IV: ${REFERRAL_CRYPTO_IV}"
    echo "Generated WEBHOOK_SECRET_TOKEN: ${WEBHOOK_SECRET}"
    echo ""
    
    read -p "Enter SLACK_WEBHOOK (optional, press Enter to skip): " SLACK_WEBHOOK
    read -p "Enter TELEGRAM_API_ID (optional, press Enter to skip): " TELEGRAM_API_ID
    read -p "Enter TELEGRAM_API_HASH (optional, press Enter to skip): " TELEGRAM_API_HASH
    
    echo ""
    echo "Setting secrets..."
    
    fly secrets set \
      BOT_TOKEN="${BOT_TOKEN}" \
      BOT_WEBHOOK_HOST="https://${BOT_APP}.fly.dev" \
      ENABLE_WEBHOOKS="true" \
      MINI_APP_URL="${MINI_APP_URL}" \
      REDIS_URL="${REDIS_URL}" \
      QUEUE_REDIS_URL="${REDIS_URL}" \
      REFERRAL_CRYPTO_KEY="${REFERRAL_CRYPTO_KEY}" \
      REFERRAL_CRYPTO_IV="${REFERRAL_CRYPTO_IV}" \
      WEBHOOK_SECRET_TOKEN="${WEBHOOK_SECRET}" \
      --app ${BOT_APP}
    
    # Optional secrets
    if [ -n "$SLACK_WEBHOOK" ]; then
        fly secrets set SLACK_WEBHOOK="${SLACK_WEBHOOK}" --app ${BOT_APP}
    fi
    
    if [ -n "$TELEGRAM_API_ID" ]; then
        fly secrets set TELEGRAM_API_ID="${TELEGRAM_API_ID}" --app ${BOT_APP}
    fi
    
    if [ -n "$TELEGRAM_API_HASH" ]; then
        fly secrets set TELEGRAM_API_HASH="${TELEGRAM_API_HASH}" --app ${BOT_APP}
    fi
    
    echo "✅ Bot secrets configured!"
}

setup_backend_secrets() {
    echo ""
    echo "🔧 Setting up Backend secrets..."
    echo "================================"
    echo ""
    
    # Check current secrets
    echo "Current secrets:"
    fly secrets list --app ${BACKEND_APP}
    echo ""
    
    # Prompt for each secret
    read -p "Enter BOT_TOKEN (same as bot, for Telegram validation): " BOT_TOKEN
    read -p "Enter REDIS_URL (from fly redis status): " REDIS_URL
    
    echo ""
    echo "Setting secrets..."
    
    fly secrets set \
      BOT_TOKEN="${BOT_TOKEN}" \
      REDIS_URL="${REDIS_URL}" \
      --app ${BACKEND_APP}
    
    echo "✅ Backend secrets configured!"
}

case $choice in
    1)
        setup_bot_secrets
        ;;
    2)
        setup_backend_secrets
        ;;
    3)
        setup_bot_secrets
        setup_backend_secrets
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 All secrets configured!"
echo ""
echo "Verify secrets:"
echo "  fly secrets list --app ${BOT_APP}"
echo "  fly secrets list --app ${BACKEND_APP}"
echo ""
echo "Note: DATABASE_URL should be auto-set when you attached postgres"

