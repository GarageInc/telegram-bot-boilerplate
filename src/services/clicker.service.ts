import type { RedisService } from "./redis.service.ts";
import type { UserRepository } from "../repositories/user.repository.ts";

export class ClickerServiceError extends Error {}

interface Dependencies {
	redisService: RedisService;
	userRepository: UserRepository;
}

const GLOBAL_CLICKS_KEY = "clicker:global:total";
const USER_CLICKS_PREFIX = "clicker:user:";
const SYNC_BATCH_SIZE = 100;

/**
 * Clicker service with Redis-backed counters for high performance.
 * Uses Redis for real-time click tracking and periodically syncs to PostgreSQL.
 */
export const makeClickerService = ({ redisService, userRepository }: Dependencies) => {
	/**
	 * Increment user's click count by the specified amount.
	 * Updates both Redis (immediate) and PostgreSQL (batched).
	 */
	const incrementClicks = async (userId: string, amount: number = 1): Promise<number> => {
		// Increment in Redis for immediate feedback
		const userKey = `${USER_CLICKS_PREFIX}${userId}`;
		
		// Increment both user and global counters
		const newUserTotal = await redisService.incrBy(userKey, amount);
		await redisService.incrBy(GLOBAL_CLICKS_KEY, amount);
		
		// Mark for sync (add to a set of users that need syncing)
		await redisService.sadd("clicker:pending_sync", userId);
		
		// Trigger background sync if batch size reached
		const pendingCount = await redisService.scard("clicker:pending_sync");
		if (pendingCount >= SYNC_BATCH_SIZE) {
			syncPendingClicksToDatabase().catch(err => 
				console.error("Background sync failed:", err)
			);
		}
		
		return newUserTotal;
	};
	
	/**
	 * Get user's current click count from Redis (with DB fallback).
	 */
	const getUserClicks = async (userId: string): Promise<number> => {
		const userKey = `${USER_CLICKS_PREFIX}${userId}`;
		
		const clicks = await redisService.getString(userKey);
		if (clicks !== null) {
			return parseInt(clicks, 10);
		}
		
		// Fallback to DB if not in Redis
		const user = await userRepository.findById(userId);
		const count = user?.clickCount ?? 0;
		
		// Warm cache
		await redisService.setString(userKey, count.toString());
		
		return count;
	};
	
	/**
	 * Get global total clicks across all users.
	 */
	const getGlobalClicks = async (): Promise<number> => {
		const total = await redisService.getString(GLOBAL_CLICKS_KEY);
		
		if (total !== null) {
			return parseInt(total, 10);
		}
		
		// Initialize from DB if not cached
		const count = await initializeGlobalCount();
		return count;
	};
	
	/**
	 * Initialize global count from database.
	 * Called on startup or when cache is empty.
	 */
	const initializeGlobalCount = async (): Promise<number> => {
		const users = await userRepository.findAll();
		
		const total = users.reduce((sum, user) => sum + (user.clickCount ?? 0), 0);
		await redisService.setString(GLOBAL_CLICKS_KEY, total.toString());
		
		return total;
	};
	
	/**
	 * Sync pending clicks from Redis to PostgreSQL.
	 * This is called periodically or when batch size is reached.
	 */
	const syncPendingClicksToDatabase = async (): Promise<number> => {
		// Get all pending user IDs
		const userIds = await redisService.smembers("clicker:pending_sync");
		if (userIds.length === 0) return 0;
		
		// Sync each user's clicks to DB
		let syncedCount = 0;
		for (const userId of userIds) {
			try {
				const userKey = `${USER_CLICKS_PREFIX}${userId}`;
				const clicks = await redisService.getString(userKey);
				
				if (clicks !== null) {
					await userRepository.updateUser(userId, {
						clickCount: parseInt(clicks, 10),
					});
					syncedCount++;
				}
				
				// Remove from pending set
				await redisService.srem("clicker:pending_sync", userId);
			} catch (error) {
				console.error(`Failed to sync clicks for user ${userId}:`, error);
				// Continue with other users
			}
		}
		
		return syncedCount;
	};
	
	/**
	 * Warm Redis cache with data from PostgreSQL.
	 * Called on service startup.
	 */
	const warmCache = async (): Promise<void> => {
		const users = await userRepository.findAll();
		
		let globalTotal = 0;
		
		for (const user of users) {
			const count = user.clickCount ?? 0;
			globalTotal += count;
			
			if (count > 0) {
				const userKey = `${USER_CLICKS_PREFIX}${user.id}`;
				await redisService.setString(userKey, count.toString());
			}
		}
		
		await redisService.setString(GLOBAL_CLICKS_KEY, globalTotal.toString());
		
		console.log(`Clicker cache warmed: ${users.length} users, ${globalTotal} total clicks`);
	};
	
	return {
		incrementClicks,
		getUserClicks,
		getGlobalClicks,
		syncPendingClicksToDatabase,
		warmCache,
		initializeGlobalCount,
	};
};

export type ClickerService = ReturnType<typeof makeClickerService>;

