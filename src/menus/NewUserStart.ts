import { ok } from "node:assert";
import { createMenu } from "../plugins/StatefulMenu.ts";
import type { BotContext } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { clicker } from "../messages/index.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		NewUserStart: null;
	}
}

export const NewUserStart = (deps: BotDependencies) =>
	createMenu("NewUserStart")
		.init<BotContext>()
		.headerText(async () => {
			return clicker.welcome();
		})
		.text("Use Telegram Username", async ctx => {
			ok(ctx.from);
			const username = ctx.from.username || `User${ctx.from.id}`;
			
			// Check if display name is taken
			const existing = await deps.userService.findUserByDisplayName(username);
			if (existing && existing.id !== String(ctx.from.id)) {
				await ctx.answerCallbackQuery({ text: "This name is taken! Please choose a different one.", show_alert: true });
				return;
			}
			
			await deps.userService.updateUser(String(ctx.from.id), {
				displayName: username,
			});
			
			await ctx.answerCallbackQuery({ text: clicker.displayNameSuccess(username) });
			await ctx.sendMenu("ExistingUserStart", { state: null });
		})
		.row()
		.text("Enter Custom Name", async ctx => {
			await ctx.reply(clicker.setDisplayName() + "\n\nType your name and send it as a message.", { parse_mode: "HTML" });
		});
