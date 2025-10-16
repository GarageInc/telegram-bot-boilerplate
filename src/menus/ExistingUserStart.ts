import { ok } from "assert";
import { createMenu } from "../plugins/StatefulMenu.ts";
import { type BotContext, coerceFrom } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { start } from "../messages/index.ts";
import { w } from "w";

const log = w("bot:start-menu");
const err = w("bot:start-menu:error");
err.enabled = true;

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		ExistingUserStart: null;
	}
}

class ExistingUserStartError extends Error {}

export const ExistingUserStart = ({ userService }: Pick<BotDependencies, "userService">) => {
	return createMenu("ExistingUserStart")
		.init<BotContext>()
		.headerText(async ctx => {
			ok(ctx.from);

			return start.initial();
		})
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
		.row()
		.url("Support", "https://t.me/rfihtengolts");
};
