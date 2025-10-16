import IORedis from "ioredis";
import { REDIS_URL } from "../env.ts";

export interface RedisService {
	/**
	 * Get a value from Redis
	 */
	get<T>(key: string): Promise<T | null>;

	/**
	 * Set a value in Redis with optional expiration
	 */
	set(key: string, value: object, ttlSeconds?: number): Promise<void>;

	/**
	 * Delete a key from Redis
	 */
	del(key: string): Promise<void>;

	/**
	 * Get the TTL (time to live) of a key in seconds
	 */
	getTtl(key: string): Promise<number>;

	/**
	 * Close the Redis connection
	 */
	close(): Promise<void>;
}

export function makeRedisService(): RedisService {
	const redis = new IORedis(REDIS_URL);

	// Handle connection events
	redis.on("connect", () => {
		console.log("✅ Redis service connected");
	});

	redis.on("error", err => {
		console.error("❌ Redis service error:", err);
	});

	const get = async <T>(key: string): Promise<T | null> => {
		try {
			const value = await redis.get(key);
			if (!value) return null;
			return JSON.parse(value) as T;
		} catch (error) {
			console.error(`Error getting key ${key} from Redis:`, error);
			return null;
		}
	};

	const set = async (key: string, value: object, ttlSeconds?: number): Promise<void> => {
		try {
			const serializedValue = JSON.stringify(value);
			if (ttlSeconds) {
				await redis.setex(key, ttlSeconds, serializedValue);
			} else {
				await redis.set(key, serializedValue);
			}
		} catch (error) {
			console.error(`Error setting key ${key} in Redis:`, error);
			throw error;
		}
	};

	const del = async (key: string): Promise<void> => {
		try {
			await redis.del(key);
		} catch (error) {
			console.error(`Error deleting key ${key} from Redis:`, error);
			throw error;
		}
	};

	const getTtl = async (key: string): Promise<number> => {
		try {
			const ttl = await redis.ttl(key);
			return ttl;
		} catch (error) {
			console.error(`Error getting TTL for key ${key} from Redis:`, error);
			return -1;
		}
	};

	const close = async (): Promise<void> => {
		try {
			await redis.quit();
		} catch (error) {
			console.error("Error closing Redis connection:", error);
		}
	};

	return {
		get,
		set,
		del,
		getTtl,
		close,
	};
}







