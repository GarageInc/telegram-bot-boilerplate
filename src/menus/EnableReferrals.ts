import { createMenu } from "../plugins/StatefulMenu.ts";
import type { BotContext } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { admin, COMMON_BUTTONS } from "../messages/index.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		EnableReferrals: null;
	}
}

export const EnableReferrals = (deps: Pick<BotDependencies, "userService">) =>
	createMenu("EnableReferrals")
		.init<BotContext>()
		.headerText(admin.enableReferralsHeader())
		.text(COMMON_BUTTONS.back, ctx => ctx.sendMenu("AdminPanel"))
		.otherwise(async (ctx, next) => {
			if (ctx.has("::bot_command")) return next();
			if (!ctx.has(":text")) return next();

			const text = ctx.message?.text.trim();
			if (!text) return next();

			try {
				const user = await deps.userService.getUserByIdOrUsername(text);

				if (!user) {
					return ctx.sendMenu("EnableReferrals", admin.userNotFound());
				}

				await deps.userService.updateUser(user.id, { referralsEnabled: true });

				return ctx.sendMenu("AdminPanel", admin.referralsEnabled());
			} catch (error) {
				console.error("Error enabling referrals:", error);
				return ctx.sendMenu("ErrorState", { state: { msg: admin.referralsDisabled() } });
			}
		});
