#!/bin/bash
# Fix DATABASE_URL SSL connection issue

set -e

BOT_APP="ggclicker-bot"
BACKEND_APP="ggclicker-backend"
DB_APP="ggclicker-bot-4764-db"

echo "🔧 Fixing DATABASE_URL SSL Configuration"
echo "========================================"
echo ""

# Check if fly is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Install it:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

echo "Getting current DATABASE_URL from bot..."
CURRENT_DB_URL=$(fly ssh console -a ${BOT_APP} -C "echo \$DATABASE_URL" 2>/dev/null || echo "")

if [ -z "$CURRENT_DB_URL" ]; then
    echo "❌ Could not retrieve DATABASE_URL"
    echo "Getting connection info from postgres app..."
    fly postgres db list -a ${DB_APP}
    exit 1
fi

echo "Current DATABASE_URL:"
echo "$CURRENT_DB_URL"
echo ""

# Parse the URL and remove sslmode=disable
if [[ "$CURRENT_DB_URL" == *"sslmode=disable"* ]]; then
    # Remove the sslmode=disable parameter
    FIXED_URL="${CURRENT_DB_URL%\?sslmode=disable}"
    echo "⚠️  Found sslmode=disable - will remove it"
else
    FIXED_URL="$CURRENT_DB_URL"
fi

# Ensure it doesn't have any SSL parameters and the URL is clean
FIXED_URL="${FIXED_URL%\?*}"

echo "Fixed DATABASE_URL (without SSL params):"
echo "$FIXED_URL"
echo ""

read -p "Update DATABASE_URL for bot? (y/n): " confirm
if [ "$confirm" = "y" ]; then
    echo "Updating bot DATABASE_URL..."
    fly secrets set DATABASE_URL="${FIXED_URL}" --app ${BOT_APP}
    echo "✅ Bot DATABASE_URL updated!"
fi

echo ""
read -p "Update DATABASE_URL for backend? (y/n): " confirm
if [ "$confirm" = "y" ]; then
    echo "Updating backend DATABASE_URL..."
    fly secrets set DATABASE_URL="${FIXED_URL}" --app ${BACKEND_APP}
    echo "✅ Backend DATABASE_URL updated!"
fi

echo ""
echo "✅ Done!"
echo ""
echo "The apps will restart automatically with the new DATABASE_URL."
echo ""
echo "Monitor the logs:"
echo "  fly logs --app ${BOT_APP}"
echo "  fly logs --app ${BACKEND_APP}"

