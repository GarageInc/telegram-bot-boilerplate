// This is a types-only file! Do not add an implementation here
// See main.ts for initialisation of dependencies

/**
 * 💡: database, redis cache and friends should go here
 * all modules will get a copy of this in their factory
 */

import type {
	SlackService,
	UserService,
	NotificationService,
	RedisService,
	ClickerService,
	LeaderboardService,
	BroadcasterService,
	PostService,
} from "./services/index.ts";
import type { SessionStorage } from "./storage.ts";

export interface BotDependencies {
	userService: UserService;
	slackService: SlackService;
	notificationService: NotificationService;
	redisService: RedisService;
	clickerService: ClickerService;
	leaderboardService: LeaderboardService;
	broadcasterService: BroadcasterService;
	postService: PostService;
	/**
	 * ## ⚠️: Do not access directly in a service or module.
	 * Access or assign to `ctx.session` instead.
	 */
	sessionStorage: SessionStorage;
}
