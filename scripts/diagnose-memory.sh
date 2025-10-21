#!/bin/bash

# Memory Diagnostic Script for Telegram Bot
# Run this script to diagnose memory issues on Fly.io

set -e

APP_NAME="${1:-ggclicker-bot}"

echo "🔍 Memory Diagnostic Tool for: $APP_NAME"
echo "========================================"
echo ""

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# 1. Check current app status
echo "📊 1. App Status"
echo "----------------"
fly status -a "$APP_NAME"
echo ""

# 2. Check memory configuration
echo "📊 2. Memory Configuration"
echo "--------------------------"
fly scale show -a "$APP_NAME"
echo ""

# 3. Get recent logs with memory warnings
echo "📊 3. Recent Memory Logs (last 200 lines)"
echo "------------------------------------------"
fly logs -a "$APP_NAME" --lines=200 | grep -i -E "(memory|oom|heap|MB|killed)" || echo "No memory-related logs found"
echo ""

# 4. Check for OOM kills
echo "📊 4. Out-of-Memory Events"
echo "--------------------------"
fly logs -a "$APP_NAME" --lines=500 | grep -i "out of memory" || echo "No OOM events found"
echo ""

# 5. SSH into machine and check memory usage (if machine is running)
echo "📊 5. Live Memory Usage (requires SSH)"
echo "---------------------------------------"
echo "Attempting to connect via SSH..."
fly ssh console -a "$APP_NAME" -C "free -m; echo ''; ps aux --sort=-%mem | head -10" 2>/dev/null || echo "⚠️ Could not connect via SSH (machine may be down)"
echo ""

# 6. Check Redis memory usage
echo "📊 6. Redis Memory Check"
echo "------------------------"
echo "Connect to Redis manually with:"
echo "  fly redis connect"
echo "Then run: INFO memory"
echo ""

# 7. Check environment variables
echo "📊 7. Memory-Related Environment Variables"
echo "-------------------------------------------"
fly secrets list -a "$APP_NAME" 2>/dev/null | grep -i -E "(CACHE|MEMORY)" || echo "No memory-related secrets found"
echo ""

# 8. Suggest next steps
echo "📋 8. Recommended Actions"
echo "-------------------------"
echo ""
echo "If experiencing OOM errors:"
echo ""
echo "  Option 1: Disable cache warming"
echo "    fly secrets set ENABLE_CACHE_WARMING=false -a $APP_NAME"
echo ""
echo "  Option 2: Reduce batch size"
echo "    fly secrets set CACHE_WARMING_BATCH_SIZE=500 -a $APP_NAME"
echo ""
echo "  Option 3: Increase memory"
echo "    fly scale memory 512 -a $APP_NAME  # or 1024"
echo ""
echo "  Option 4: View detailed logs"
echo "    fly logs -a $APP_NAME --lines=1000 > memory-logs.txt"
echo ""
echo "  Option 5: Take heap snapshot (requires SSH)"
echo "    fly ssh console -a $APP_NAME"
echo "    kill -SIGUSR2 \$(pidof bun)  # Trigger heap snapshot"
echo ""

echo "✅ Diagnostic complete!"

