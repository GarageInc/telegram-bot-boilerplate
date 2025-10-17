import IORedis from "ioredis";
import { RedisAdapter } from "@grammyjs/storage-redis";
import { REDIS_URL } from "../../shared/env.ts";
import type { SessionData } from "./context.ts";
import type { StorageAdapter } from "grammy";

/**
 * 💡: If reusing same Redis Instance for multiple storages in the future
 * (for eg., for conversation storage),  ensure each usage is prefixed,
 * so as to not conflict with each other */
export async function makeRedisStorage(): Promise<SessionStorage> {
	console.log("🔌 Connecting to Redis:");
	console.log(`   URL: ${REDIS_URL}`);

	const redisInstance = new IORedis(REDIS_URL);

	await new Promise(resolve => redisInstance.on("connect", resolve)).then(() =>
		console.log("✅ Redis connection established successfully"),
	);

	redisInstance.on("error", err => console.error("❌ Redis connection error:", err));

	const adapter = new RedisAdapter<SessionData>({ instance: redisInstance });

	return {
		adapter: {
			// redeclaration allows tracing the adapter methods
			// but skipping internal Redis methods
			read: adapter.read.bind(adapter),
			write: adapter.write.bind(adapter),
			delete: adapter.delete.bind(adapter),
		},
		destroy: () => redisInstance.quit(),
	};
}

export interface SessionStorage {
	adapter: StorageAdapter<SessionData>;
	destroy: () => Promise<unknown>;
}
