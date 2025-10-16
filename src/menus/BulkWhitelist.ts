import { createMenu } from "../plugins/StatefulMenu.ts";
import type { BotContext } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { admin, COMMON_BUTTONS } from "../messages/index.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		BulkWhitelist: null;
	}
}

export const BulkWhitelist = (deps: Pick<BotDependencies, "userService" | "notificationService">) =>
	createMenu("BulkWhitelist")
		.init<BotContext>()
		.headerText(admin.bulkWhitelistHeader())
		.text(COMMON_BUTTONS.back, ctx => ctx.sendMenu("AdminPanel"))
		.otherwise(async (ctx, next) => {
			if (ctx.has("::bot_command")) return next();
			if (!ctx.has(":text")) return next();

			const text = ctx.message?.text.trim();
			if (!text) return next();

			try {
				const userIds = text
					.split(",")
					.map(id => parseInt(id.trim()))
					.filter(id => !isNaN(id));

				if (userIds.length === 0) {
					return ctx.sendMenu("BulkWhitelist", admin.bulkWhitelistInvalidIds());
				}

				if (userIds.length > 100) {
					return ctx.sendMenu("BulkWhitelist", admin.bulkWhitelistTooMany());
				}

				// Compute detailed reporting via two-phase batch operations
				const requestedIds = userIds.map(String);
				const alreadyWhitelistedIds = await deps.userService.getWhitelisted(requestedIds);
				const alreadyWhitelistedSet = new Set(alreadyWhitelistedIds);
				const idsToUpdate = requestedIds.filter(id => !alreadyWhitelistedSet.has(id));
				const updatedIds = await deps.userService.batchUpdateUserWhitelisted(idsToUpdate, true);
				const updatedSet = new Set(updatedIds);
				const notFoundIds = requestedIds.filter(id => !alreadyWhitelistedSet.has(id) && !updatedSet.has(id));
				const nowWhitelistedCount = alreadyWhitelistedIds.length + updatedIds.length;

				// Send welcome messages to newly whitelisted users using notification service
				if (updatedIds.length > 0) {
					const newlyWhitelistedUsers = await deps.userService.getUsersByIds(updatedIds);

					const welcomeMessages = newlyWhitelistedUsers.map(user => ({
						userId: user.id,
						message: admin.welcomeWhitelistedUser(user.username || "User"),
					}));

					// Queue the welcome messages for bulk sending
					await deps.notificationService.queueMessages(welcomeMessages);
				}

				const report = admin.bulkWhitelistReport(updatedIds.length, alreadyWhitelistedIds.length, notFoundIds.length);
				const message = report
					? `${admin.bulkWhitelistSuccess(nowWhitelistedCount)}\n\n${report}`
					: admin.bulkWhitelistSuccess(nowWhitelistedCount);
				return ctx.sendMenu("AdminPanel", message);
			} catch (error) {
				console.error("Error bulk whitelisting users:", error);
				return ctx.sendMenu("ErrorState", { state: { msg: admin.bulkWhitelistError() } });
			}
		});
