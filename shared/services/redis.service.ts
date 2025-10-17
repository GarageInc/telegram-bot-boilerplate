import IORedis from "ioredis";

export interface RedisService {
	getString(key: string): Promise<string | null>;
	setString(key: string, value: string, ttlSeconds?: number): Promise<void>;
	/**
	 * Get a value from Redis
	 */
	get<T>(key: string): Promise<T | null>;

	/**
	 * Set a value in Redis with optional expiration
	 */
	set(key: string, value: object, ttlSeconds?: number): Promise<void>;

	/**
	 * Get the TTL (time to live) of a key in seconds
	 */
	getTtl(key: string): Promise<number>;

	/**
	 * Increment a numeric value in Redis
	 */
	incr(key: string): Promise<number>;
	incrBy(key: string, amount: number): Promise<number>;	
	sadd(key: string, ...members: string[]): Promise<number>;
	srem(key: string, ...members: string[]): Promise<number>;
	smembers(key: string): Promise<string[]>;
	scard(key: string): Promise<number>;
	sismember(key: string, member: string): Promise<boolean>;
	keys(pattern: string): Promise<string[]>;
	close(): Promise<void>;

	/**
	 * Delete a key
	 */
	del(key: string): Promise<void>;
	/**
	 * Get a hash field value
	 */
	hget(key: string, field: string): Promise<string | null>;

	/**
	 * Set a hash field value
	 */
	hset(key: string, field: string, value: string): Promise<number>;

	/**
	 * Delete hash fields
	 */
	hdel(key: string, ...fields: string[]): Promise<number>;

	/**
	 * Get all hash fields and values
	 */
	hgetall(key: string): Promise<Record<string, string>>;
}

export function makeRedisService(redisUrl: string): RedisService {
	const redis = new IORedis(redisUrl);

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

	const getString = async (key: string): Promise<string | null> => {
		try {
			return await redis.get(key);
		} catch (error) {
			console.error(`Error getting string key ${key} from Redis:`, error);
			return null;
		}
	};

	const setString = async (key: string, value: string, ttlSeconds?: number): Promise<void> => {
		try {
			if (ttlSeconds) {
				await redis.setex(key, ttlSeconds, value);
			} else {
				await redis.set(key, value);
			}
		} catch (error) {
			console.error(`Error setting string key ${key} in Redis:`, error);
			throw error;
		}
	};

	const incr = async (key: string): Promise<number> => {
		try {
			return await redis.incr(key);
		} catch (error) {
			console.error(`Error incrementing key ${key} in Redis:`, error);
			throw error;
		}
	};

	const incrBy = async (key: string, amount: number): Promise<number> => {
		try {
			return await redis.incrby(key, amount);
		} catch (error) {
			console.error(`Error incrementing key ${key} by ${amount} in Redis:`, error);
			throw error;
		}
	};

	const sadd = async (key: string, ...members: string[]): Promise<number> => {
		try {
			return await redis.sadd(key, ...members);
		} catch (error) {
			console.error(`Error adding to set ${key} in Redis:`, error);
			throw error;
		}
	};

	const srem = async (key: string, ...members: string[]): Promise<number> => {
		try {
			return await redis.srem(key, ...members);
		} catch (error) {
			console.error(`Error removing from set ${key} in Redis:`, error);
			throw error;
		}
	};

	const smembers = async (key: string): Promise<string[]> => {
		try {
			return await redis.smembers(key);
		} catch (error) {
			console.error(`Error getting members of set ${key} from Redis:`, error);
			return [];
		}
	};

	const scard = async (key: string): Promise<number> => {
		try {
			return await redis.scard(key);
		} catch (error) {
			console.error(`Error getting cardinality of set ${key} from Redis:`, error);
			return 0;
		}
	};

	const sismember = async (key: string, member: string): Promise<boolean> => {
		try {
			const result = await redis.sismember(key, member);
			return result === 1;
		} catch (error) {
			console.error(`Error checking if ${member} is in set ${key} in Redis:`, error);
			return false;
		}
	};

	const keys = async (pattern: string): Promise<string[]> => {
		try {
			return await redis.keys(pattern);
		} catch (error) {
			console.error(`Error getting keys for pattern ${pattern} from Redis:`, error);
			return [];
		}
	};

	const hget = async (key: string, field: string): Promise<string | null> => {
		try {
			return await redis.hget(key, field);
		} catch (error) {
			console.error(`Error getting hash field ${field} from ${key} in Redis:`, error);
			return null;
		}
	};

	const hset = async (key: string, field: string, value: string): Promise<number> => {
		try {
			return await redis.hset(key, field, value);
		} catch (error) {
			console.error(`Error setting hash field ${field} in ${key} in Redis:`, error);
			throw error;
		}
	};

	const hdel = async (key: string, ...fields: string[]): Promise<number> => {
		try {
			return await redis.hdel(key, ...fields);
		} catch (error) {
			console.error(`Error deleting hash fields from ${key} in Redis:`, error);
			throw error;
		}
	};

	const hgetall = async (key: string): Promise<Record<string, string>> => {
		try {
			return await redis.hgetall(key);
		} catch (error) {
			console.error(`Error getting all hash fields from ${key} in Redis:`, error);
			return {};
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
		getTtl,
		incr,
		hget,
		hset,
		hdel,
		hgetall,
		getString,
		setString,
		del,
		incrBy,
		sadd,
		srem,
		smembers,
		scard,
		sismember,
		keys,
		close,
	};
}


