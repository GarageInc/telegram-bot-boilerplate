import { ok } from "node:assert";
import { type BotContext, coerceFrom } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { createMenu } from "../plugins/StatefulMenu.ts";
import { clicker, COMMON_BUTTONS } from "../messages/index.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		ChangeDisplayName: null;
	}
}

class ChangeDisplayNameError extends Error {}

export const ChangeDisplayName = (deps: Pick<BotDependencies, "userService">) =>
	createMenu("ChangeDisplayName")
		.init<BotContext>()
		.headerText(async ctx => {
			ok(ctx.from);
			const user = await deps.userService.getUserById(ctx.from.id);
			const currentName = user?.displayName || "Not set";

			return `${clicker.changeDisplayName()}\n\nCurrent: <b>${currentName}</b>\n\nType your new name and send it as a message.`;
		})
		.text(COMMON_BUTTONS.back, ctx => ctx.sendMenu("ExistingUserStart", { state: null }))
		.otherwise(async (ctx, next) => {
			if (ctx.has("::bot_command")) return next();
			if (!ctx.has(":text")) return next();
			
			const { id } = coerceFrom(ctx);
			const text = ctx.message?.text.trim();
			if (!text) return next();

			// Validate display name
			const validateDisplayName = (name: string): boolean => {
				return /^[a-zA-Z0-9\s]{3,20}$/.test(name);
			};

			if (!validateDisplayName(text)) {
				await ctx.sendMenu("ErrorState", { state: { msg: clicker.invalidDisplayName(), noTraceId: true } });
			}

			// Check if display name is already taken
			const existing = await deps.userService.findUserByDisplayName(text);
			if (existing && existing.id !== String(id)) {
				await ctx.sendMenu("ErrorState", { state: { msg: clicker.displayNameTaken(), noTraceId: true } });
			}

			try {
				// Update display name
				await deps.userService.updateUser(String(id), { displayName: text });
				
				// Show success message and return to main menu
				return ctx.sendMenu("ExistingUserStart", { state: null });
			} catch (error: any) {
				throw new ChangeDisplayNameError(`Failed to update display name for user ${id}: ${error.message}`);
			}
		});
