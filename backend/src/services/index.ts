import { makeClickerService } from "../../../shared/services/clicker.service";
import { makeLeaderboardService } from "../../../shared/services/leaderboard.service";
import { makeRedisService } from "../../../shared/services/redis.service";
import { db } from "../database/client.ts";
import { makeUserRepository } from "./user.repository.ts";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let clickerService: ReturnType<typeof makeClickerService>;
let leaderboardService: ReturnType<typeof makeLeaderboardService>;

export async function initServices() {
	const userRepository = makeUserRepository(db as any);
	const redisService = makeRedisService(REDIS_URL);

	clickerService = makeClickerService({ redisService, userRepository });
	leaderboardService = makeLeaderboardService({ redisService, userRepository });

	// Warm cache
	await clickerService.warmCache();

	// Start periodic sync for active users
	clickerService.startPeriodicSync();

	console.log("Services initialized");
}

export { clickerService, leaderboardService };
