import { makeClickerService } from "../../../shared/services/clicker.service";
import { makeLeaderboardService } from "../../../shared/services/leaderboard.service";
import { makeRedisService } from "../../../shared/services/redis.service";
import { makePostService } from "../../../shared/services/post.service";
import { db } from "../database/client.ts";
import { makeUserRepository } from "./user.repository.ts";
import { makePostRepository } from "../../../shared/repositories/post.repository";
import { connectMongoDB } from "../../../shared/infra/database/mongo-client";
import { REDIS_URL } from "../../../shared/env";
import { MONGO_URL } from "../../../shared/env";

let clickerService: ReturnType<typeof makeClickerService>;
let leaderboardService: ReturnType<typeof makeLeaderboardService>;
let postService: ReturnType<typeof makePostService>;

export async function initServices() {
	const userRepository = makeUserRepository(db as any);
	const redisService = makeRedisService(REDIS_URL);
	
	// Connect to MongoDB for posts/comments
	await connectMongoDB(MONGO_URL);
	const postRepository = makePostRepository();

	clickerService = makeClickerService({ redisService, userRepository });
	leaderboardService = makeLeaderboardService({ redisService, userRepository });
	postService = makePostService(postRepository);

	// Warm cache
	await clickerService.warmCache();

	// Start periodic sync for active users
	clickerService.startPeriodicSync();

	console.log("Services initialized");
}

export { clickerService, leaderboardService, postService };
