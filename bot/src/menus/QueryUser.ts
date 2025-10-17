import { createMenu } from "../plugins/StatefulMenu.ts";
import type { BotContext } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { admin, COMMON_BUTTONS } from "../messages/index.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		QueryUser: null;
	}
}

export const QueryUser = (deps: Pick<BotDependencies, "userService">) =>
	createMenu("QueryUser")
		.init<BotContext>()
		.headerText(admin.queryUser())
		.text(COMMON_BUTTONS.back, ctx => ctx.sendMenu("AdminPanel"))
		.otherwise(async (ctx, next) => {
			if (ctx.has("::bot_command")) return next();
			if (!ctx.has(":text")) return next();

			const text = ctx.message?.text.trim();
			if (!text) return next();

			try {
				const user = await deps.userService.getUserByIdOrUsername(text);

				if (!user) {
					return ctx.sendMenu("QueryUser", admin.userNotFound());
				}

				return ctx.sendMenu("AdminPanel", admin.userInfo(user));
			} catch (error) {
				console.error("Error querying user:", error);
				return ctx.sendMenu("ErrorState", { state: { msg: admin.queryUserError() } });
			}
		});
