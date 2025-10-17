import IORedis from "ioredis";

export interface RedisService {
	getString(key: string): Promise<string | null>;
	setString(key: string, value: string, ttlSeconds?: number): Promise<void>;
	del(key: string): Promise<void>;
	incrBy(key: string, amount: number): Promise<number>;
	sadd(key: string, ...members: string[]): Promise<number>;
	srem(key: string, ...members: string[]): Promise<number>;
	smembers(key: string): Promise<string[]>;
	scard(key: string): Promise<number>;
	close(): Promise<void>;
}

export function makeRedisService(redisUrl: string): RedisService {
	const redis = new IORedis(redisUrl);

	redis.on("connect", () => {
		console.log("✅ Redis connected");
	});

	redis.on("error", err => {
		console.error("❌ Redis error:", err);
	});

	const getString = async (key: string): Promise<string | null> => {
		try {
			return await redis.get(key);
		} catch (error) {
			console.error(`Error getting key ${key}:`, error);
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
			console.error(`Error setting key ${key}:`, error);
			throw error;
		}
	};

	const del = async (key: string): Promise<void> => {
		try {
			await redis.del(key);
		} catch (error) {
			console.error(`Error deleting key ${key}:`, error);
			throw error;
		}
	};

	const incrBy = async (key: string, amount: number): Promise<number> => {
		try {
			return await redis.incrby(key, amount);
		} catch (error) {
			console.error(`Error incrementing key ${key}:`, error);
			throw error;
		}
	};

	const sadd = async (key: string, ...members: string[]): Promise<number> => {
		try {
			return await redis.sadd(key, ...members);
		} catch (error) {
			console.error(`Error adding to set ${key}:`, error);
			throw error;
		}
	};

	const srem = async (key: string, ...members: string[]): Promise<number> => {
		try {
			return await redis.srem(key, ...members);
		} catch (error) {
			console.error(`Error removing from set ${key}:`, error);
			throw error;
		}
	};

	const smembers = async (key: string): Promise<string[]> => {
		try {
			return await redis.smembers(key);
		} catch (error) {
			console.error(`Error getting members of set ${key}:`, error);
			return [];
		}
	};

	const scard = async (key: string): Promise<number> => {
		try {
			return await redis.scard(key);
		} catch (error) {
			console.error(`Error getting cardinality of set ${key}:`, error);
			return 0;
		}
	};

	const close = async (): Promise<void> => {
		try {
			await redis.quit();
		} catch (error) {
			console.error("Error closing Redis:", error);
		}
	};

	return {
		getString,
		setString,
		del,
		incrBy,
		sadd,
		srem,
		smembers,
		scard,
		close,
	};
}
