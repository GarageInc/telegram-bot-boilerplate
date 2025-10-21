import { makeClickerService } from "../../../shared/services/clicker.service";
import { makeLeaderboardService } from "../../../shared/services/leaderboard.service";
import { makeRedisService } from "../../../shared/services/redis.service";
import { makePostService } from "../../../shared/services/post.service";
import { db } from "../database/client.ts";
import { makeUserRepository } from "./user.repository.ts";
import { makePostRepository } from "../../../shared/repositories/post.repository";
import { connectMongoDB } from "../../../shared/infra/database/mongo-client";
import { REDIS_URL, MONGO_URL, ENABLE_CACHE_WARMING, CACHE_WARMING_BATCH_SIZE } from "../../../shared/env";

export interface Services {
	clickerService: ReturnType<typeof makeClickerService>;
	leaderboardService: ReturnType<typeof makeLeaderboardService>;
	postService: ReturnType<typeof makePostService>;
}

export async function createServices(): Promise<Services> {
	const userRepository = makeUserRepository(db as any);
	const redisService = makeRedisService(REDIS_URL);
	
	// Connect to MongoDB for posts/comments
	await connectMongoDB(MONGO_URL);
	const postRepository = makePostRepository();

	const clickerService = makeClickerService({ redisService, userRepository });
	const leaderboardService = makeLeaderboardService({ redisService, userRepository });
	const postService = makePostService(postRepository);

	// Start periodic sync for active users
	clickerService.startPeriodicSync();

	console.log("Services initialized");

	// Warm cache asynchronously (non-blocking)
	if (ENABLE_CACHE_WARMING) {
		console.log("Starting cache warming in background...");
		clickerService.warmCache(CACHE_WARMING_BATCH_SIZE).catch((err: Error) => {
			console.error("Failed to warm clicker cache:", err);
		});
	} else {
		console.log("Cache warming disabled (ENABLE_CACHE_WARMING=false)");
	}

	return { clickerService, leaderboardService, postService };
}
