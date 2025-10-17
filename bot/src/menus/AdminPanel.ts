import { createMenu } from "../plugins/StatefulMenu.ts";
import type { BotContext } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { admin, COMMON_BUTTONS } from "../messages/index.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		AdminPanel: null;
	}
}

export const AdminPanel = (_deps: BotDependencies) =>
	createMenu("AdminPanel")
		.init<BotContext>()
		.headerText(admin.header())
		.text("Query User", ctx => ctx.sendMenu("QueryUser"))
		.text("Remove User", ctx => ctx.sendMenu("RemoveUser"))
		.row()
		.text("Enable Referrals", ctx => ctx.sendMenu("EnableReferrals"))
		.text("Bulk Whitelist", ctx => ctx.sendMenu("BulkWhitelist"))
		.row()
		.text("Send Message", ctx => ctx.sendMenu("SendMessage", { state: { step: "input" } }))
		.row()
		.text(COMMON_BUTTONS.back, ctx => ctx.sendMenu("ExistingUserStart"));
