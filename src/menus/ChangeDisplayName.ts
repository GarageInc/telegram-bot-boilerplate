import { ok } from "node:assert";
import type { BotContext } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { createMenu } from "../plugins/StatefulMenu.ts";
import { clicker } from "../messages/index.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		ChangeDisplayName: null;
	}
}

export const ChangeDisplayName = (deps: BotDependencies) =>
	createMenu("ChangeDisplayName")
		.init<BotContext>()
		.headerText(async ctx => {
			ok(ctx.from);
			const user = await deps.userService.getUserById(ctx.from.id);
			const currentName = user?.displayName || "Not set";

			return `${clicker.changeDisplayName()}\n\nCurrent: <b>${currentName}</b>\n\nType your new name and send it as a message.`;
		})
		.text("← Back", ctx => ctx.sendMenu("ExistingUserStart", { state: null }));
