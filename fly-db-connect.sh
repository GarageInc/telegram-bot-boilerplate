#!/bin/bash
# Quick script to connect to Fly.io PostgreSQL

APP_NAME="ggclicker-bot-4764"
DB_NAME="${APP_NAME}-db"

echo "🗄️  Connecting to PostgreSQL: ${DB_NAME}"
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

# Show available options
echo "Choose connection method:"
echo ""
echo "1) Direct psql connection (easiest)"
echo "2) SSH into Postgres VM"
echo "3) Create proxy tunnel on port 5432"
echo "4) Show connection info"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo "Connecting to PostgreSQL..."
        fly postgres connect -a ${DB_NAME}
        ;;
    2)
        echo "SSHing into Postgres VM..."
        echo "Once inside, run: psql -U postgres"
        fly ssh console -a ${DB_NAME}
        ;;
    3)
        echo "Creating proxy tunnel on localhost:5432..."
        echo "Keep this terminal open and connect with:"
        echo "  psql postgres://localhost:5432/clicker_db"
        echo ""
        fly proxy 5432 -a ${DB_NAME}
        ;;
    4)
        echo "Database information:"
        echo ""
        fly postgres db list -a ${DB_NAME}
        echo ""
        echo "To connect manually, use the connection string from above"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

