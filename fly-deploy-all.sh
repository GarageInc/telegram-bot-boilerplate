#!/bin/bash
# Deploy all services to Fly.io

set -e

PROJECT_ROOT="/private/var/www/komi/test"
BOT_APP="ggclicker-bot"
BACKEND_APP="ggclicker-backend"
DB_APP="${BOT_APP}-4764-db"
REDIS_APP="${BOT_APP}-4764-redis"

echo "🚀 Fly.io Deployment Script"
echo "============================"
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

echo "Select deployment option:"
echo ""
echo "1) Deploy Bot only"
echo "2) Deploy Backend only"
echo "3) Deploy Both (Bot + Backend)"
echo "4) Setup Infrastructure (Database + Redis)"
echo "5) Deploy Everything (Infrastructure + All Apps)"
echo ""
read -p "Enter choice [1-5]: " choice

deploy_bot() {
    echo ""
    echo "🤖 Deploying Bot..."
    echo "=================="
    cd "$PROJECT_ROOT"
    
    # Check if app exists
    if ! fly apps list | grep -q "${BOT_APP}"; then
        echo "Creating bot app..."
        fly apps create ${BOT_APP} --org personal
    fi
    
    fly deploy -c fly-bot.toml --app ${BOT_APP}
    echo "✅ Bot deployed!"
    echo "URL: https://${BOT_APP}.fly.dev"
}

deploy_backend() {
    echo ""
    echo "🔧 Deploying Backend..."
    echo "======================"
    cd "$PROJECT_ROOT"
    
    # Check if app exists
    if ! fly apps list | grep -q "${BACKEND_APP}"; then
        echo "Creating backend app..."
        fly apps create ${BACKEND_APP} --org personal
    fi
    
    fly deploy -c fly-backend.toml --app ${BACKEND_APP}
    echo "✅ Backend deployed!"
    echo "URL: https://${BACKEND_APP}.fly.dev"
}

setup_infrastructure() {
    echo ""
    echo "🏗️  Setting up Infrastructure..."
    echo "==============================="
    
    # Check if database exists
    if fly postgres list | grep -q "${DB_APP}"; then
        echo "✅ PostgreSQL ${DB_APP} already exists"
    else
        echo "Creating PostgreSQL..."
        fly postgres create \
          --name ${DB_APP} \
          --region ams \
          --initial-cluster-size 1 \
          --vm-size shared-cpu-1x \
          --volume-size 1
        echo "✅ PostgreSQL created"
    fi
    
    # Check if Redis exists
    if fly redis list | grep -q "${REDIS_APP}"; then
        echo "✅ Redis ${REDIS_APP} already exists"
    else
        echo "Creating Redis..."
        fly redis create \
          --name ${REDIS_APP} \
          --region ams
        echo "✅ Redis created"
    fi
    
    echo ""
    echo "📋 Attaching databases to apps..."
    
    # Attach to bot
    if fly apps list | grep -q "${BOT_APP}"; then
        fly postgres attach ${DB_APP} --app ${BOT_APP} 2>/dev/null || echo "Already attached to bot"
    fi
    
    # Attach to backend
    if fly apps list | grep -q "${BACKEND_APP}"; then
        fly postgres attach ${DB_APP} --app ${BACKEND_APP} 2>/dev/null || echo "Already attached to backend"
    fi
    
    echo ""
    echo "✅ Infrastructure setup complete!"
    echo ""
    echo "📝 Next: Set Redis URLs for both apps:"
    echo ""
    fly redis status ${REDIS_APP}
    echo ""
    echo "Run these commands with the Redis URL from above:"
    echo ""
    echo "# For Bot:"
    echo "fly secrets set REDIS_URL='<redis-url>' QUEUE_REDIS_URL='<redis-url>' --app ${BOT_APP}"
    echo ""
    echo "# For Backend:"
    echo "fly secrets set REDIS_URL='<redis-url>' --app ${BACKEND_APP}"
}

case $choice in
    1)
        deploy_bot
        ;;
    2)
        deploy_backend
        ;;
    3)
        deploy_bot
        deploy_backend
        ;;
    4)
        setup_infrastructure
        ;;
    5)
        setup_infrastructure
        echo ""
        read -p "Press Enter to continue with deployments..."
        deploy_bot
        deploy_backend
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Check status:"
echo "   fly status --app ${BOT_APP}"
echo "   fly status --app ${BACKEND_APP}"
echo ""
echo "📊 View logs:"
echo "   fly logs --app ${BOT_APP}"
echo "   fly logs --app ${BACKEND_APP}"
echo ""
echo "🌐 URLs:"
echo "   Bot: https://${BOT_APP}.fly.dev"
echo "   Backend: https://${BACKEND_APP}.fly.dev"
echo "   Health checks:"
echo "     curl https://${BOT_APP}.fly.dev/health"
echo "     curl https://${BACKEND_APP}.fly.dev/health"

