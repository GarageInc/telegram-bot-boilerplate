# Memory Profiling & Debugging Guide

This guide helps you profile and debug memory issues in your Telegram bot running on Bun/Node.js.

## 🔍 Quick Start: Monitor Memory in Production

### 1. Enable Memory Monitoring (Already Implemented)

Your bot now has built-in memory monitoring that:
- ✅ Tracks memory usage every minute
- ✅ Detects memory leaks automatically
- ✅ Sends Slack alerts when memory is high
- ✅ Logs statistics on shutdown

View logs on Fly.io:
```bash
fly logs -a ggclicker-bot
```

Look for messages like:
```
📊 Memory Usage:
   RSS:          245.23 MB
   Heap Used:    198.45 MB
⚠️ High memory usage detected: 410.23 MB
Memory growth rate: 15.34 MB/hour
```

### 2. Check Memory Remotely

SSH into your Fly.io instance:
```bash
fly ssh console -a ggclicker-bot

# Check memory usage
free -m

# Check process memory
ps aux | grep bun

# Check system logs
dmesg | grep -i "out of memory"
```

## 🐛 Potential Memory Leak Sources in Your Code

Based on code analysis, here are the most likely culprits:

### 1. **Bull Queue (Notification Service)** 🔴 HIGH RISK
**Location:** `bot/src/services/notification.service.ts`

**Problem:** Queue jobs might accumulate in Redis if not properly cleaned.

**Check:**
```bash
# SSH into production
fly ssh console -a ggclicker-bot

# Connect to Redis
redis-cli -h <your-redis-host> -p <port> -a <password>

# Check queue sizes
HLEN bull:notifications:id
ZCARD bull:notifications:wait
ZCARD bull:notifications:active
ZCARD bull:notifications:completed
ZCARD bull:notifications:failed
ZCARD bull:notifications:delayed
ZCARD bull:notifications:paused

# If any are > 10000, you have a problem
```

**Fix Options:**
- Set TTL on completed jobs: `removeOnComplete: { age: 3600 }` (1 hour)
- Limit max job age: `removeOnComplete: { count: 1000 }`
- Clean old jobs periodically

### 2. **Active Sessions in Broadcaster** 🟡 MEDIUM RISK
**Location:** `bot/src/services/broadcaster.service.ts`

**Problem:** Sessions might not be cleaned up if users don't properly disconnect.

**Check in Redis:**
```bash
redis-cli -h <host> -p <port> -a <password>

# Check how many active sessions
HLEN clicker:active_sessions

# If > 1000, investigate
HGETALL clicker:active_sessions
```

**Fix:** The code already has timeout cleanup (5 minutes), but you might want to:
- Add periodic cleanup job
- Reduce `SESSION_TIMEOUT_MS` from 5 minutes to 2 minutes

### 3. **Redis Connection Pooling** 🟡 MEDIUM RISK
**Location:** Multiple Redis clients created

**Problem:** Multiple Redis instances without connection limits.

**Check current connections:**
```bash
redis-cli -h <host> -p <port> -a <password>
CLIENT LIST | wc -l
```

**Fix:** Add connection pool limits to all Redis instances.

### 4. **Database Connection Pooling** 🟡 MEDIUM RISK
**Problem:** PostgreSQL/MongoDB connections might leak.

**Check:**
```bash
# PostgreSQL
fly pg connect -a <your-db-app>
SELECT count(*) FROM pg_stat_activity;

# MongoDB (if using)
mongosh <connection-string>
db.currentOp().inprog.length
```

### 5. **Session Storage (grammY)** 🟢 LOW RISK
Sessions are stored in Redis, so shouldn't leak memory, but check Redis memory usage.

## 🛠️ Profiling Tools

### For Bun:

```bash
# Run with memory profiling
bun --heap-snapshot-signal=SIGUSR2 run src/main.ts

# Later, trigger a heap snapshot
kill -SIGUSR2 <pid>
```

### For Node.js (if you switch):

```bash
# 1. Enable heap snapshots
node --expose-gc --inspect src/main.ts

# 2. Connect Chrome DevTools
# Open: chrome://inspect

# 3. Take heap snapshots over time and compare
```

### Using clinic.js for Node.js:

```bash
# Install
npm install -g clinic

# Profile memory
clinic heapprofiler -- node src/main.ts

# This will generate an HTML report
```

## 📊 Memory Debugging Commands

### In Your Application (Already Added):

The `memoryMonitor` utility provides these methods:

```typescript
// Force garbage collection (run with --expose-gc for Bun)
memoryMonitor.forceGC();

// Take heap snapshot
await memoryMonitor.takeHeapSnapshot('./heap-snapshot.heapsnapshot');

// Get summary
const summary = memoryMonitor.getSummary();
console.log(summary);
```

### Remote Debugging on Fly.io:

```bash
# Check current memory limit
fly scale show -a ggclicker-bot

# Upgrade memory if needed
fly scale memory 512 -a ggclicker-bot  # or 1024

# View real-time metrics
fly status -a ggclicker-bot

# Get detailed VM info
fly vm status -a ggclicker-bot
```

## 🔧 Fixes to Implement

### 1. Limit Bull Queue Job Retention

Update `bot/src/services/notification.service.ts`:

```typescript
defaultJobOptions: {
    attempts: 3,
    removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
        count: 100,
    },
    // ... rest
}
```

### 2. Add Connection Pool Limits

For Redis clients, add:

```typescript
const redisInstance = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    // Connection pool
    lazyConnect: false,
    keepAlive: 30000,
});
```

### 3. Add Periodic Cleanup Job

Add to `bot/src/main.ts`:

```typescript
// Clean up old sessions every hour
setInterval(async () => {
    console.log("Running periodic cleanup...");
    
    // Clean expired sessions
    const sessions = await deps.broadcasterService.getActiveSessions();
    console.log(`Active sessions after cleanup: ${sessions.length}`);
    
    // Force GC if memory is high
    const summary = memoryMonitor.getSummary();
    if (summary.currentMemoryMB > 400) {
        memoryMonitor.forceGC();
    }
}, 3600000); // Every hour
```

### 4. Set Memory Limit for Bun

Add to your Dockerfile or start command:

```bash
# Limit max heap size to 450MB (leaving room for RSS)
bun --max-old-space-size=450 run src/main.ts
```

## 📈 Monitoring Best Practices

### 1. Set Up Alerts

Configure Slack webhook and monitor these metrics:
- Heap usage > 80% of available RAM
- Memory growth rate > 10 MB/hour
- Active Redis connections > 50
- Queue job count > 10,000

### 2. Regular Health Checks

Add a `/metrics` endpoint:

```typescript
// In your HTTP server
if (url.pathname === "/metrics") {
    const summary = memoryMonitor.getSummary();
    const queueStatus = await deps.notificationService.getQueueStatus();
    const activeSessions = await deps.broadcasterService.getActiveSessions();
    
    return new Response(JSON.stringify({
        memory: summary,
        queue: queueStatus,
        activeSessions: activeSessions.length,
        uptime: process.uptime(),
    }), {
        headers: { "Content-Type": "application/json" },
    });
}
```

### 3. Log Rotation

Ensure logs don't accumulate:
```bash
# On Fly.io, logs are automatically managed
# But if running locally, use:
fly logs -a ggclicker-bot > logs.txt &
```

## 🚨 Emergency: Server Running Out of Memory

If your bot is actively crashing:

### Immediate Fix:
```bash
# Disable cache warming
fly secrets set ENABLE_CACHE_WARMING=false -a ggclicker-bot

# Restart
fly apps restart ggclicker-bot

# Increase memory temporarily
fly scale memory 1024 -a ggclicker-bot
```

### Investigation:
```bash
# Check what's consuming memory
fly ssh console -a ggclicker-bot
top -o %MEM
ps aux --sort=-%mem | head -10
```

### Clean Redis if needed:
```bash
redis-cli -h <host> -p <port> -a <password>

# Clean old queue jobs
EVAL "return redis.call('del', unpack(redis.call('keys', 'bull:notifications:*')))" 0

# Clean old sessions
DEL clicker:active_sessions
```

## 📚 Additional Resources

- [Bun Memory Management](https://bun.sh/docs/runtime/debugger)
- [Node.js Memory Profiling](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Chrome DevTools Memory Profiler](https://developer.chrome.com/docs/devtools/memory-problems/)
- [Clinic.js](https://clinicjs.org/)
- [Bull Queue Best Practices](https://docs.bullmq.io/guide/jobs/job-options)

## 🎯 Next Steps

1. ✅ Deploy with memory monitoring enabled (already done)
2. ⏳ Monitor for 24 hours and check logs
3. ⏳ Implement Bull Queue job retention limits
4. ⏳ Add Redis connection pooling
5. ⏳ Set up `/metrics` endpoint for external monitoring
6. ⏳ Configure proper alerting via Slack

---

**Need help?** Check logs with `fly logs -a ggclicker-bot` and look for memory-related warnings.

