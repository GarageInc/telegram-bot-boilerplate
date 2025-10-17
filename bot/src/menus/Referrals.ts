import { createMenu } from "../plugins/StatefulMenu.ts";
import { type BotContext, coerceFrom } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { COMMON_BUTTONS, referrals } from "../messages/index.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		Referrals: null;
	}
}

class ReferralMenuError extends Error {}

export const Referrals = (deps: Pick<BotDependencies, "userService">) =>
	createMenu("Referrals")
		.init<BotContext>()
		.headerText(async ctx => {
			const { id } = coerceFrom(ctx);
			const user = await deps.userService.getUserById(id);
			if (!user) throw new ReferralMenuError(`User ${id} not found`);

			return referrals.initial(ctx.me.username, user.id, user.referralsEnabled, user.refCode ?? undefined);
		})
		.dynamic(async (ctx, range) => {
			const { id } = coerceFrom(ctx);
			const user = await deps.userService.getUserById(id);
			if (!user) throw new ReferralMenuError(`User ${id} not found`);
			// Only show "Set Referral Code" button if user doesn't have a refCode
			if (!user.refCode) {
				range.text("Set Referral Code", ctx => ctx.sendMenu("SetReferralCode"));
			}
		})
		.row()
		.text(COMMON_BUTTONS.back, ctx => ctx.sendMenu("ExistingUserStart"));
