import { createMenu } from "../plugins/StatefulMenu.ts";
import type { BotContext } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { admin, COMMON_BUTTONS } from "../messages/index.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		RemoveUser: null;
	}
}

export const RemoveUser = (deps: Pick<BotDependencies, "userService">) =>
	createMenu("RemoveUser")
		.init<BotContext>()
		.headerText(admin.removeUserHeader())
		.text(COMMON_BUTTONS.back, ctx => ctx.sendMenu("AdminPanel"))
		.otherwise(async (ctx, next) => {
			if (ctx.has("::bot_command")) return next();
			if (!ctx.has(":text")) return next();

			const text = ctx.message?.text.trim();
			if (!text) return next();

			try {
				const user = await deps.userService.getUserByIdOrUsername(text);

				if (!user) {
					return ctx.sendMenu("RemoveUser", admin.userNotFound());
				}

				// Delete the user
				await deps.userService.deleteUser(user.id);

				return ctx.sendMenu("RemoveUser", admin.removeUserSuccess(user.username || "", user.id));
			} catch (error) {
				console.error("Error removing user:", error);
				return ctx.sendMenu("RemoveUser", admin.removeUserError());
			}
		});
