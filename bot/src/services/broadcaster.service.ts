import type { Bot } from "grammy";
import type { BotContext } from "../context.ts";
import type { RedisService } from "../../../shared/services/redis.service";
import { clicker } from "../messages/index.ts";
import type { ClickerService } from "../../../shared/services/clicker.service";
import type { LeaderboardService } from "../../../shared/services/leaderboard.service";

export class BroadcasterServiceError extends Error {}

interface Dependencies {
	bot: Bot<BotContext>;
	redisService: RedisService;
	clickerService: ClickerService;
	leaderboardService: LeaderboardService;
}

interface ActiveSession {
	userId: string;
	chatId: number;
	messageId: number;
	lastUpdate: number;
}

const ACTIVE_SESSIONS_KEY = "clicker:active_sessions";
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes of inactivity
const BASE_UPDATE_INTERVAL_MS = 2000; // 2 seconds base interval
const MAX_UPDATE_INTERVAL_MS = 30000; // 30 seconds max interval

/**
 * Session broadcaster service that manages live updates to active users.
 * Implements adaptive rate limiting based on concurrent session count.
 */
export const makeBroadcasterService = ({ bot, redisService, clickerService, leaderboardService }: Dependencies) => {
	let updateInterval: ReturnType<typeof setTimeout> | null = null;
	let isRunning = false;
	let consecutiveErrors = 0;
	const MAX_CONSECUTIVE_ERRORS = 5; // Circuit breaker threshold

	/**
	 * Register an active session for live updates.
	 */
	const registerSession = async (userId: string, chatId: number, messageId: number): Promise<void> => {
		const session: ActiveSession = {
			userId,
			chatId,
			messageId,
			lastUpdate: Date.now(),
		};

		await redisService.hset(ACTIVE_SESSIONS_KEY, userId, JSON.stringify(session));
		console.log(`Session registered: user=${userId}, chat=${chatId}, msg=${messageId}`);
	};

	/**
	 * Unregister a session (user became inactive or left).
	 */
	const unregisterSession = async (userId: string): Promise<void> => {
		await redisService.hdel(ACTIVE_SESSIONS_KEY, userId);
		console.log(`Session unregistered: user=${userId}`);
	};

	/**
	 * Get all active sessions.
	 */
	const getActiveSessions = async (): Promise<ActiveSession[]> => {
		const sessionsData = await redisService.hgetall(ACTIVE_SESSIONS_KEY);

		const sessions: ActiveSession[] = [];
		const now = Date.now();

		for (const [userId, data] of Object.entries(sessionsData)) {
			try {
				const session: ActiveSession = JSON.parse(data as string);

				// Check if session is still active
				if (now - session.lastUpdate < SESSION_TIMEOUT_MS) {
					sessions.push(session);
				} else {
					// Clean up expired session
					await unregisterSession(userId);
				}
			} catch (error) {
				console.error(`Failed to parse session for user ${userId}:`, error);
			}
		}

		return sessions;
	};

	/**
	 * Calculate adaptive update interval based on active session count.
	 * More sessions = longer interval to stay within rate limits.
	 */
	const calculateUpdateInterval = (sessionCount: number): number => {
		if (sessionCount === 0) return BASE_UPDATE_INTERVAL_MS;

		// Telegram rate limit: 30 messages/second across all chats
		// We want to stay well below that, so let's target 20 msg/s max
		const messagesPerSecond = 20;
		const minIntervalMs = (sessionCount / messagesPerSecond) * 1000;

		// Apply safety margin and bounds
		const interval = Math.max(BASE_UPDATE_INTERVAL_MS, Math.min(MAX_UPDATE_INTERVAL_MS, minIntervalMs * 1.5));

		return Math.floor(interval);
	};

	/**
	 * Broadcast stats update to all active sessions.
	 */
	const broadcastUpdate = async (): Promise<void> => {
		const sessions = await getActiveSessions();
		if (sessions.length === 0) return;

		try {
			// Fetch current stats
			const [globalClicks, leaderboard] = await Promise.all([
				clickerService.getGlobalClicks(),
				leaderboardService.getTopClickers(20),
			]);

			// Update each session
			const updatePromises = sessions.map(async session => {
				try {
					const userClicks = await clickerService.getUserClicks(session.userId);
					const userRank = await leaderboardService.getUserRank(session.userId);

					const text = clicker.formatWelcomeMessage(userClicks, globalClicks, leaderboard, session.userId, userRank);

					await bot.api.editMessageText(session.chatId, session.messageId, text, {
						parse_mode: "HTML",
						reply_markup: undefined, // Keep existing buttons
					});

					// Update last update time
					session.lastUpdate = Date.now();
					await redisService.hset(ACTIVE_SESSIONS_KEY, session.userId, JSON.stringify(session));
				} catch (error: any) {
					// Handle common errors
					if (error?.error_code === 400 && error?.description?.includes("message is not modified")) {
						// Message content hasn't changed, ignore
						return;
					}
					if (error?.error_code === 403 || error?.error_code === 400) {
						// User blocked bot or chat not found, unregister
						await unregisterSession(session.userId);
						return;
					}
					console.error(`Failed to update session for user ${session.userId}:`, error);
				}
			});

			await Promise.allSettled(updatePromises);
		} catch (error) {
			console.error("Broadcast update failed:", error);
		}
	};

	/**
	 * Start the broadcaster service.
	 * 🔧 FIX: Fixed recursive setTimeout pattern to prevent memory leaks
	 */
	const start = async (): Promise<void> => {
		// 🔧 DISABLED: Broadcaster service for memory leak testing
		// if (isRunning) {
		// 	console.warn("Broadcaster service already running");
		// 	return;
		// }

		// isRunning = true;
		// consecutiveErrors = 0;
		// console.log("Broadcaster service started via 'start' method");

		// // 🔧 FIX: Use setInterval instead of recursive setTimeout to prevent memory leaks
		// const scheduleNextUpdate = (interval: number) => {
		// 	if (updateInterval) {
		// 		clearTimeout(updateInterval);
		// 	}
		// 	updateInterval = setTimeout(async () => {
		// 		if (!isRunning) {
		// 			console.log("Broadcaster service stopping, loop exiting");
		// 			return;
		// 		}

		// 		// Circuit breaker: Stop if too many consecutive errors
		// 		if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
		// 			console.error(`🚨 Broadcaster circuit breaker triggered after ${consecutiveErrors} consecutive errors. Stopping service.`);
		// 			isRunning = false;
		// 			return;
		// 		}

		// 		try {
		// 			const sessions = await getActiveSessions();
		// 			const nextInterval = calculateUpdateInterval(sessions.length);

		// 			if (sessions.length > 0) {
		// 				console.log(`Broadcasting update to ${sessions.length} sessions (interval: ${nextInterval}ms)`);
		// 				await broadcastUpdate();
		// 				consecutiveErrors = 0; // Reset error counter on success
		// 			}

		// 			// Schedule next update
		// 			if (isRunning) {
		// 				scheduleNextUpdate(nextInterval);
		// 			}
		// 		} catch (error) {
		// 			consecutiveErrors++;
		// 			console.error(`Broadcaster updateLoop error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, error);
					
		// 			// Still schedule next update but with backoff
		// 			if (isRunning && consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
		// 				const backoffInterval = BASE_UPDATE_INTERVAL_MS * Math.pow(2, consecutiveErrors);
		// 				console.log(`Retrying in ${backoffInterval}ms with exponential backoff`);
		// 				scheduleNextUpdate(Math.min(backoffInterval, MAX_UPDATE_INTERVAL_MS));
		// 			}
		// 		}
		// 	}, interval);
		// };

		// // Start with base interval
		// scheduleNextUpdate(BASE_UPDATE_INTERVAL_MS);
		
		console.log("🚫 Broadcaster service disabled for memory leak testing");
	};

	/**
	 * Stop the broadcaster service.
	 */
	const stop = async (): Promise<void> => {
		// 🔧 DISABLED: Broadcaster service for memory leak testing
		// isRunning = false;
		// if (updateInterval) {
		// 	clearTimeout(updateInterval);
		// 	updateInterval = null;
		// }
		console.log("🚫 Broadcaster service already disabled");
	};

	/**
	 * 🔧 FIX: Add periodic cleanup for orphaned sessions
	 */
	const cleanupOrphanedSessions = async (): Promise<number> => {
		// 🔧 DISABLED: Cleanup for memory leak testing
		// try {
		// 	const sessionsData = await redisService.hgetall(ACTIVE_SESSIONS_KEY);
		// 	const now = Date.now();
		// 	let cleanedCount = 0;

		// 	for (const [userId, data] of Object.entries(sessionsData)) {
		// 		try {
		// 			const session: ActiveSession = JSON.parse(data as string);
					
		// 			// Remove sessions older than timeout
		// 			if (now - session.lastUpdate > SESSION_TIMEOUT_MS) {
		// 				await redisService.hdel(ACTIVE_SESSIONS_KEY, userId);
		// 				cleanedCount++;
		// 			}
		// 		} catch (error) {
		// 			// Remove corrupted session data
		// 			await redisService.hdel(ACTIVE_SESSIONS_KEY, userId);
		// 			cleanedCount++;
		// 		}
		// 	}

		// 	if (cleanedCount > 0) {
		// 		console.log(`Cleaned up ${cleanedCount} orphaned sessions`);
		// 	}

		// 	return cleanedCount;
		// } catch (error) {
		// 	console.error("Failed to cleanup orphaned sessions:", error);
		// 	return 0;
		// }
		
		console.log("🚫 Session cleanup disabled for memory leak testing");
		return 0;
	};

	/**
	 * Force an immediate update for a specific user.
	 */
	const updateSession = async (userId: string): Promise<void> => {
		const sessionData = await redisService.hget(ACTIVE_SESSIONS_KEY, userId);

		if (!sessionData) return;

		const session: ActiveSession = JSON.parse(sessionData);

		try {
			session.lastUpdate = Date.now();
			await redisService.hset(ACTIVE_SESSIONS_KEY, userId, JSON.stringify(session));
		} catch (error: any) {
			if (error?.error_code === 400 && error?.description?.includes("message is not modified")) {
				return; // Ignore
			}
			throw error;
		}
	};

	return {
		registerSession,
		unregisterSession,
		getActiveSessions,
		broadcastUpdate,
		start,
		stop,
		updateSession,
		cleanupOrphanedSessions,
	};
};

export type BroadcasterService = ReturnType<typeof makeBroadcasterService>;
