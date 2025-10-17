import { opt, reqd, checks } from "./env_vars.ts";

export const BOT_TOKEN = reqd("BOT_TOKEN");
export const BOT_API_ROOT = opt("BOT_API_ROOT");
export const TELEGRAM_API_ID = opt("TELEGRAM_API_ID", id => (id != undefined ? parseInt(id, 10) : undefined));
export const TELEGRAM_API_HASH = opt("TELEGRAM_API_HASH");

export const REDIS_URL = reqd("REDIS_URL");
export const QUEUE_REDIS_URL = reqd("QUEUE_REDIS_URL", url => new URL(url));

console.log("REDIS_URL ===> ", REDIS_URL);
console.log("QUEUE_REDIS_URL ===> ", QUEUE_REDIS_URL);

if (!REDIS_URL) {
	throw new Error("REDIS_URL is required");
}

if (!QUEUE_REDIS_URL) {
	throw new Error("QUEUE_REDIS_URL is required");
}

export const MINI_APP_URL = reqd("MINI_APP_URL");

export const OTLP_ENDPOINT = opt("OTLP_ENDPOINT");
export const OTEL_SERVICE_NAME = OTLP_ENDPOINT ? reqd("OTEL_SERVICE_NAME") : undefined;
export const OTEL_AUTH_TOKEN = opt("OTEL_AUTH_TOKEN");
export const EXTRA_TRACING = opt("EXTRA_TRACING", value => new Set(value?.split(",").map(s => s.trim()) ?? []));
// Set to suppress traceId reporting in error messages (traceIds are useful for debugging when we receive an error report)
export const NO_ERROR_TRACE_ID = opt("NO_ERROR_TRACE_ID", value => value === "true");

export const SHUTDOWN_TIMEOUT_MS = opt("SHUTDOWN_TIMEOUT_MS", ms => (ms != null && parseInt(ms, 10)) || 5_000);

// Database connection details
export const DATABASE_URL = reqd("DATABASE_URL");

console.log("DATABASE_URL ===> ", DATABASE_URL);

// Webhook configuration
export const ENABLE_WEBHOOKS = opt("ENABLE_WEBHOOKS") === "true";

console.log("ENABLE_WEBHOOKS", ENABLE_WEBHOOKS);

export const PORT = ENABLE_WEBHOOKS ? reqd("PORT", port => parseInt(port, 10)) : 3000;
export const BOT_WEBHOOK_HOST = ENABLE_WEBHOOKS ? reqd("BOT_WEBHOOK_HOST") : undefined;
export const WEBHOOK_SECRET_TOKEN = ENABLE_WEBHOOKS ? reqd("WEBHOOK_SECRET_TOKEN") : undefined;

export const SLACK_WEBHOOK = opt("SLACK_WEBHOOK");

// Referral encryption constants
export const REFERRAL_CRYPTO_KEY = reqd("REFERRAL_CRYPTO_KEY");
export const REFERRAL_CRYPTO_IV = reqd("REFERRAL_CRYPTO_IV");

// -------------------------------------------------------------------------------------------------
// ⚠️: This HAS to be at the end of the file! DO NOT MOVE!
// -------------------------------------------------------------------------------------------------
checks();
