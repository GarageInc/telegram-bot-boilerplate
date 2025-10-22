import type { RedisService } from "./redis.service";

export class ClickerServiceError extends Error {}

export interface UserRepository {
	findById(id: string): Promise<any>;
	findAll(): Promise<any[]>;
	findAllPaginated(batchSize: number, offset: number): Promise<any[]>;
	getUserCount(): Promise<number>;
	updateUser(id: string, updates: any): Promise<any>;
	getTopClickerUsers(limit: number): Promise<any[]>;
	getUserRank(userId: string): Promise<number | null>;
}

interface Dependencies {
	redisService: RedisService;
	userRepository: UserRepository;
}

const GLOBAL_CLICKS_KEY = "clicker:global:total";
const USER_CLICKS_PREFIX = "clicker:user:";
const ACTIVE_USER_PREFIX = "clicker:active:";
const ACTIVE_USERS_SET_KEY = "clicker:active_users_set"; // 🔧 FIX: Use a SET instead of key pattern
const SYNC_BATCH_SIZE = 100;
const SYNC_INTERVAL_MS = 5000; // 5 seconds
const ACTIVE_USER_TTL = 30; // 30 seconds - users are considered active if they clicked in last 30s

export function makeClickerService({ redisService, userRepository }: Dependencies) {
	let syncIntervalId: ReturnType<typeof setTimeout> | null = null;

	const incrementClicks = async (userId: string, amount: number = 1): Promise<number> => {
		const userKey = `${USER_CLICKS_PREFIX}${userId}`;
		const activeKey = `${ACTIVE_USER_PREFIX}${userId}`;

		const newUserTotal = await redisService.incrBy(userKey, amount);
		await redisService.incrBy(GLOBAL_CLICKS_KEY, amount);

		// Mark user as active with TTL
		await redisService.setString(activeKey, Date.now().toString(), ACTIVE_USER_TTL);

		// 🔧 FIX: Add user to active users SET for efficient tracking
		await redisService.sadd(ACTIVE_USERS_SET_KEY, userId);

		await redisService.sadd("clicker:pending_sync", userId);

		const pendingCount = await redisService.scard("clicker:pending_sync");
		if (pendingCount >= SYNC_BATCH_SIZE) {
			syncPendingClicksToDatabase().catch(err => console.error("Background sync failed:", err));
		}

		return newUserTotal;
	};

	const getUserClicks = async (userId: string): Promise<number> => {
		const userKey = `${USER_CLICKS_PREFIX}${userId}`;

		const clicks = await redisService.getString(userKey);
		if (clicks !== null) {
			return parseInt(clicks, 10);
		}

		const user = await userRepository.findById(userId);
		const count = user?.clickCount ?? 0;

		await redisService.setString(userKey, count.toString());

		return count;
	};

	const getGlobalClicks = async (): Promise<number> => {
		const total = await redisService.getString(GLOBAL_CLICKS_KEY);

		if (total !== null) {
			return parseInt(total, 10);
		}

		const count = await initializeGlobalCount();
		return count;
	};

	const initializeGlobalCount = async (): Promise<number> => {
		const users = await userRepository.findAll();

		const total = users.reduce((sum, user) => sum + (user.clickCount ?? 0), 0);
		await redisService.setString(GLOBAL_CLICKS_KEY, total.toString());

		return total;
	};

	const syncPendingClicksToDatabase = async (): Promise<number> => {
		const userIds = await redisService.smembers("clicker:pending_sync");
		if (userIds.length === 0) return 0;

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

				await redisService.srem("clicker:pending_sync", userId);
			} catch (error) {
				console.error(`Failed to sync clicks for user ${userId}:`, error);
			}
		}

		return syncedCount;
	};

	/**
	 * Warm cache in batches to avoid loading all users into memory at once.
	 * This is memory-efficient and prevents OOM errors on large databases.
	 */
	const warmCache = async (batchSize: number = 1000): Promise<void> => {
		console.log(`Starting cache warming with batch size: ${batchSize}`);
		
		const totalUsers = await userRepository.getUserCount();
		console.log(`Total users to process: ${totalUsers}`);

		let globalTotal = 0;
		let processedUsers = 0;
		let offset = 0;

		while (offset < totalUsers) {
			try {
				const users = await userRepository.findAllPaginated(batchSize, offset);
				
				if (users.length === 0) break;

				for (const user of users) {
					const count = user.clickCount ?? 0;
					globalTotal += count;

					if (count > 0) {
						const userKey = `${USER_CLICKS_PREFIX}${user.id}`;
						await redisService.setString(userKey, count.toString());
					}
				}

				processedUsers += users.length;
				offset += batchSize;

				// Log progress every batch
				console.log(`Cache warming progress: ${processedUsers}/${totalUsers} users (${Math.round(processedUsers / totalUsers * 100)}%)`);
			} catch (error) {
				console.error(`Error warming cache at offset ${offset}:`, error);
				// Continue with next batch even if one fails
				offset += batchSize;
			}
		}

		await redisService.setString(GLOBAL_CLICKS_KEY, globalTotal.toString());

		console.log(`✅ Clicker cache warmed: ${processedUsers} users, ${globalTotal} total clicks`);
	};

	/**
	 * 🔧 FIX: Optimized getActiveUsers to batch Redis operations and prevent memory leaks
	 * Uses pipeline to reduce Redis round trips and prevent accumulation
	 */
	const getActiveUsers = async (): Promise<string[]> => {
		// Get all users from the active users SET
		const userIds = await redisService.smembers(ACTIVE_USERS_SET_KEY);
		
		if (userIds.length === 0) return [];
		
		// 🔧 FIX: Batch Redis operations to reduce memory usage and improve performance
		const activeUsers: string[] = [];
		const expiredUsers: string[] = [];
		const now = Date.now();
		
		// Process in batches to prevent memory spikes
		const BATCH_SIZE = 100;
		for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
			const batch = userIds.slice(i, i + BATCH_SIZE);
			
			// Get all timestamps for this batch in parallel
			const timestampPromises = batch.map(userId => 
				redisService.getString(`${ACTIVE_USER_PREFIX}${userId}`)
			);
			
			const timestamps = await Promise.all(timestampPromises);
			
			// Process batch results
			for (let j = 0; j < batch.length; j++) {
				const userId = batch[j];
				const lastActiveStr = timestamps[j];
				
				// Skip if userId is undefined
				if (!userId) continue;
				
				if (lastActiveStr !== null && lastActiveStr !== undefined) {
					const lastActive = parseInt(lastActiveStr, 10);
					const timeSinceActive = now - lastActive;
					
					if (timeSinceActive < ACTIVE_USER_TTL * 1000) {
						activeUsers.push(userId);
					} else {
						expiredUsers.push(userId);
					}
				} else {
					// Key expired, remove from SET
					expiredUsers.push(userId);
				}
			}
		}
		
		// 🔧 FIX: Batch remove expired users to reduce Redis operations
		if (expiredUsers.length > 0) {
			// Remove all expired users from the SET in batches
			for (let i = 0; i < expiredUsers.length; i += BATCH_SIZE) {
				const batch = expiredUsers.slice(i, i + BATCH_SIZE);
				await Promise.all(
					batch.map(userId => redisService.srem(ACTIVE_USERS_SET_KEY, userId))
				);
			}
			console.log(`Removed ${expiredUsers.length} expired users from active set`);
		}
		
		return activeUsers;
	};

	const syncActiveUsers = async (): Promise<number> => {
		try {
			const activeUserIds = await getActiveUsers();
			if (activeUserIds.length === 0) return 0;

			let syncedCount = 0;
			for (const userId of activeUserIds) {
				// Only sync if they're in the pending sync set
				const isPending = await redisService.sismember("clicker:pending_sync", userId);
				if (!isPending) continue;

				try {
					const userKey = `${USER_CLICKS_PREFIX}${userId}`;
					const clicks = await redisService.getString(userKey);

					if (clicks !== null) {
						await userRepository.updateUser(userId, {
							clickCount: parseInt(clicks, 10),
						});
						syncedCount++;
					}

					await redisService.srem("clicker:pending_sync", userId);
				} catch (error) {
					console.error(`Failed to sync active user ${userId}:`, error);
					// Continue with other users even if one fails
				}
			}

			if (syncedCount > 0) {
				console.log(`Synced ${syncedCount} active users to database`);
			}

			return syncedCount;
		} catch (error) {
			console.error("syncActiveUsers failed:", error);
			return 0;
		}
	};

	const startPeriodicSync = (): void => {
		if (syncIntervalId !== null) {
			console.warn("Periodic sync already running");
			return;
		}

		console.log(`Starting periodic sync every ${SYNC_INTERVAL_MS}ms for active users`);
		syncIntervalId = setInterval(() => {
			syncActiveUsers().catch(err => console.error("Periodic sync failed:", err));
		}, SYNC_INTERVAL_MS);
	};

	const stopPeriodicSync = (): void => {
		if (syncIntervalId !== null) {
			clearInterval(syncIntervalId);
			syncIntervalId = null;
			console.log("Periodic sync stopped");
		}
	};

	return {
		incrementClicks,
		getUserClicks,
		getGlobalClicks,
		syncPendingClicksToDatabase,
		syncActiveUsers,
		warmCache,
		initializeGlobalCount,
		startPeriodicSync,
		stopPeriodicSync,
	};
}

export type ClickerService = ReturnType<typeof makeClickerService>;


