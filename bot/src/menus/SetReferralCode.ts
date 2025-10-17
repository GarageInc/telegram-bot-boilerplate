import { createMenu } from "../plugins/StatefulMenu.ts";
import type { BotDependencies } from "../dependencies.ts";
import { type BotContext, coerceFrom } from "../context.ts";
import { COMMON_BUTTONS, setReferralCode } from "../messages/index.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		SetReferralCode: null;
	}
}

class SetReferralCodeError extends Error {}

export const SetReferralCode = (deps: Pick<BotDependencies, "userService">) =>
	createMenu("SetReferralCode")
		.init<BotContext>()
		.headerText(setReferralCode.header())
		.text(COMMON_BUTTONS.back, ctx => ctx.sendMenu("Referrals"))
		.otherwise(async (ctx, next) => {
			if (ctx.has("::bot_command")) return next();
			if (!ctx.has(":text")) return next();
			const { id } = coerceFrom(ctx);

			const text = ctx.message?.text.trim();
			if (!text) return next();

			const user = await deps.userService.getUserById(id);
			if (!user) return ctx.sendMenu("NewUserStart", { state: null });

			// Validate referral code format (alphanumeric, 3-20 characters)
			if (!/^[a-zA-Z0-9]{3,20}$/.test(text)) {
				return ctx.sendMenu("SetReferralCode", setReferralCode.invalidFormat(), { state: null });
			}

			// Update user's referral code
			const updated = await deps.userService.updateUser(user.id, { refCode: text });
			if (!updated) throw new SetReferralCodeError(`Could not set refCode ${text} for user ${id}`);

			return ctx.sendMenu("SetReferralCode", setReferralCode.success());
		});
