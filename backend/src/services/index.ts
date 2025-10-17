import { makeClickerService } from "./clicker.service.ts";
import { makeLeaderboardService } from "./leaderboard.service.ts";
import { makeRedisService } from "./redis.service.ts";
import { db } from "../database/client.ts";
import { makeUserRepository } from "./user.repository.ts";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let clickerService: ReturnType<typeof makeClickerService>;
let leaderboardService: ReturnType<typeof makeLeaderboardService>;

export async function initServices() {
	const userRepository = makeUserRepository(db);
	const redisService = makeRedisService(REDIS_URL);

	clickerService = makeClickerService({ redisService, userRepository });
	leaderboardService = makeLeaderboardService({ redisService, userRepository });

	// Warm cache
	await clickerService.warmCache();

	console.log("Services initialized");
}

export { clickerService, leaderboardService };
