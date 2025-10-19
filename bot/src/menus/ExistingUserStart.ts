import { ok } from "assert";
import { createMenu } from "../plugins/StatefulMenu.ts";
import { type BotContext, coerceFrom } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { clicker } from "../messages/index.ts";
import { w } from "w";
import { MINI_APP_URL } from "../../../shared/env.ts";

const log = w("bot:start-menu");
const err = w("bot:start-menu:error");
err.enabled = true;

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		ExistingUserStart: null;
	}
}

class ExistingUserStartError extends Error {}

export const ExistingUserStart = ({
	userService,
	clickerService,
	leaderboardService,
	broadcasterService,
}: Pick<BotDependencies, "userService" | "clickerService" | "leaderboardService" | "broadcasterService">) => {
	return createMenu("ExistingUserStart")
		.init<BotContext>()
		.headerText(async ctx => {
			ok(ctx.from);
			const userId = String(ctx.from.id);

			// Get stats
			const [userClicks, globalClicks, leaderboard, userRank] = await Promise.all([
				clickerService.getUserClicks(userId),
				clickerService.getGlobalClicks(),
				leaderboardService.getTopClickers(20),
				leaderboardService.getUserRank(userId),
			]);

			return clicker.formatWelcomeMessage(userClicks, globalClicks, leaderboard, userId, userRank);
		})
		.webApp("🎮 Play Game", MINI_APP_URL)
		.row()
		.text("💬 Posts & Comments", ctx => ctx.sendMenu("PostsMenu", { state: null }))
		.row()
		.text("Change Display Name", ctx => ctx.sendMenu("ChangeDisplayName", { state: null }))
		.row()
		.dynamic(async (ctx, range) => {
			// Handle Referrals button only if user has referrals enabled
			const { id } = coerceFrom(ctx);
			const user = await userService.getUserById(id);
			if (!user) throw new ExistingUserStartError(`User ${id} not found`);
			if (user.referralsEnabled) {
				range.text("Referrals", ctx => ctx.sendMenu("Referrals"));
			}
		})
		.row()
		.url("Support", "https://t.me/rfihtengolts");
};
