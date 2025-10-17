import type { RedisService } from "./redis.service";

export class LeaderboardServiceError extends Error {}

export interface UserRepository {
	getTopClickerUsers(limit: number): Promise<any[]>;
	getUserRank(userId: string): Promise<number | null>;
}

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

export function makeLeaderboardService({ redisService, userRepository }: Dependencies) {
	const getTopClickers = async (limit: number = 20): Promise<LeaderboardEntry[]> => {
		const cached = await redisService.getString(LEADERBOARD_KEY);
		if (cached) {
			const entries: LeaderboardEntry[] = JSON.parse(cached);
			return entries.slice(0, limit);
		}

		const entries = await fetchTopClickersFromDB(limit);

		await redisService.setString(LEADERBOARD_KEY, JSON.stringify(entries), LEADERBOARD_TTL);

		return entries;
	};

	const fetchTopClickersFromDB = async (limit: number = 20): Promise<LeaderboardEntry[]> => {
		const users = await userRepository.getTopClickerUsers(limit);

		return users.map((user, index) => ({
			userId: user.id,
			displayName: user.displayName || user.username || `User ${user.id}`,
			clickCount: user.clickCount ?? 0,
			rank: index + 1,
		}));
	};

	const getUserRank = async (userId: string): Promise<number | null> => {
		const rank = await userRepository.getUserRank(userId);
		return rank;
	};

	const invalidateCache = async (): Promise<void> => {
		await redisService.del(LEADERBOARD_KEY);
	};

	return {
		getTopClickers,
		getUserRank,
		invalidateCache,
		fetchTopClickersFromDB,
	};
}

export type LeaderboardService = ReturnType<typeof makeLeaderboardService>;


