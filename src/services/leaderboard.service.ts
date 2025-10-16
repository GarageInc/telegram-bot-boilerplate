import type { RedisService } from "./redis.service.ts";
import type { UserRepository } from "../repositories/user.repository.ts";

export class LeaderboardServiceError extends Error {}

interface Dependencies {
	redisService: RedisService;
	userRepository: UserRepository;
}

export interface LeaderboardEntry {
	userId: string;
	displayName: string;
	clickCount: number;
	rank: number;
}

const LEADERBOARD_KEY = "clicker:leaderboard:top20";
const LEADERBOARD_TTL = 5; // 5 seconds cache

/**
 * Leaderboard service with Redis caching for performance.
 * Maintains top 20 clickers with efficient updates.
 */
export const makeLeaderboardService = ({ redisService, userRepository }: Dependencies) => {
	/**
	 * Get top N users by click count.
	 * Uses Redis cache with short TTL for performance.
	 */
	const getTopClickers = async (limit: number = 20): Promise<LeaderboardEntry[]> => {
		// Try cache first
		const cached = await redisService.getString(LEADERBOARD_KEY);
		if (cached) {
			const entries: LeaderboardEntry[] = JSON.parse(cached);
			return entries.slice(0, limit);
		}
		
		// Fetch from database
		const entries = await fetchTopClickersFromDB(limit);
		
		// Cache the results
		await redisService.setString(LEADERBOARD_KEY, JSON.stringify(entries), LEADERBOARD_TTL);
		
		return entries;
	};
	
	/**
	 * Fetch top clickers directly from PostgreSQL.
	 */
	const fetchTopClickersFromDB = async (limit: number = 20): Promise<LeaderboardEntry[]> => {
		const users = await userRepository.getTopClickerUsers(limit);
		
		return users.map((user, index) => ({
			userId: user.id,
			displayName: user.displayName || user.username || `User ${user.id}`,
			clickCount: user.clickCount ?? 0,
			rank: index + 1,
		}));
	};
	
	/**
	 * Get user's rank in the leaderboard.
	 * Returns null if user has no clicks.
	 */
	const getUserRank = async (userId: string): Promise<number | null> => {
		const rank = await userRepository.getUserRank(userId);
		return rank;
	};
	
	/**
	 * Invalidate leaderboard cache.
	 * Called after significant updates.
	 */
	const invalidateCache = async (): Promise<void> => {
		await redisService.del(LEADERBOARD_KEY);
	};
	
	/**
	 * Format leaderboard for display in Telegram.
	 */
	const formatLeaderboard = (entries: LeaderboardEntry[], currentUserId?: string): string => {
		if (entries.length === 0) {
			return "🏆 <b>Leaderboard</b>\n\nNo clicks yet! Be the first to click!";
		}
		
		const lines = ["🏆 <b>Top 20 Clickers</b>\n"];
		
		for (const entry of entries) {
			const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : "  ";
			const highlight = entry.userId === currentUserId ? "👉 " : "";
			const name = escapeHtml(entry.displayName);
			
			lines.push(
				`${medal} ${highlight}<code>${entry.rank}.</code> ${name}: <b>${formatNumber(entry.clickCount)}</b>`
			);
		}
		
		return lines.join("\n");
	};
	
	return {
		getTopClickers,
		getUserRank,
		invalidateCache,
		fetchTopClickersFromDB,
		formatLeaderboard,
	};
};

export type LeaderboardService = ReturnType<typeof makeLeaderboardService>;

// Helper functions
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function formatNumber(num: number): string {
	return num.toLocaleString("en-US");
}

