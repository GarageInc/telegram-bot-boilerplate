import type { BotDependencies } from "../dependencies.ts";
import type { Database } from "../infra/database/index.ts";
import type { BotCommandSetup } from "./types.ts";
import { decrypt } from "../utils/referral.ts";
import { type BotContext, coerceFrom } from "../context.ts";

export const command: BotCommandSetup = {
	command: "start",
	description: "Restart the bot",
	getHandler: (deps: BotDependencies) => async ctx => {
		const { id, username } = coerceFrom(ctx);

		// Check if this is a referral link
		if (ctx.match?.startsWith("r-")) {
			await handleReferral(ctx, deps.userService);
			return;
		}

	// this method finds or creates the user
	const user = await deps.userService.getOrCreateUser(id, username);
	if (!user) return ctx.sendMenu("NewUserStart", { state: null });

	// Check if user has a display name set
	if (!user.displayName) {
		return ctx.sendMenu("NewUserStart", { state: null });
	}

	await ctx.sendMenu("ExistingUserStart", { state: null });
	},
};

async function handleReferral(ctx: BotContext, userService: BotDependencies["userService"]) {
	try {
		if (!ctx.match) return;
		const { id } = coerceFrom(ctx);

		const rawReferralCode = (ctx.match as string).split("r-")[1];

		if (!rawReferralCode) return;

		// Try to find referrer
		const referrer = await findReferrer(rawReferralCode, userService);

		if (!referrer) {
			await ctx.sendMenu("ErrorState", { state: { msg: "❌ Invalid referral code", noTraceId: true } });
			return;
		}

		const existingUser = await userService.getUserById(id);

		// New user signing up with referral code
		if (!existingUser) {
			await handleNewReferralUser(ctx, referrer, userService);
			return;
		}

		// Validate referral rules
		const validationError = validateReferralRules(existingUser, referrer);
		if (validationError) {
			await ctx.sendMenu("ErrorState", { state: { msg: `❌ ${validationError}`, noTraceId: true } });
			return;
		}

		// Handle existing user referral
		await handleExistingUserReferral(ctx, existingUser, referrer, userService);
	} catch (error) {
		console.error("Error handling referral:", error);
		await ctx.sendMenu("ErrorState", { state: { msg: "❌ Error processing referral. Please try again." } });
	}
}

async function findReferrer(rawReferralCode: string, userService: BotDependencies["userService"]) {
	// Try to decrypt first (for default referral links)
	try {
		const referrerId = decrypt(rawReferralCode);
		return await userService.getUserById(parseInt(referrerId));
	} catch (error) {
		console.error("Error decrypting referral code:", error);
		console.error("Falling back to findUserByRefCode");
		// If decryption fails, use the raw code to look up user by ref_code
		return await userService.findUserByRefCode(rawReferralCode);
	}
}

async function handleNewReferralUser(
	ctx: BotContext,
	referrer: Database.User,
	userService: BotDependencies["userService"],
) {
	const { username, id } = coerceFrom(ctx);
	const user = await userService.createUser(id, username || "", referrer.id);

	if (!user) return;

	// Check if user has a display name set
	if (!user.displayName) {
		return ctx.sendMenu("NewUserStart", { state: null });
	}

	await ctx.sendMenu("ExistingUserStart", { state: null });
}

function validateReferralRules(referral: Database.User, referrer: Database.User): string | null {
	if (referral.id === referrer.id) {
		return "You can't refer yourself";
	}
	if (referral.id === referrer.referrerId) {
		return "You can't be referral of your referral";
	}
	return null;
}

async function handleExistingUserReferral(
	ctx: BotContext,
	referral: Database.User,
	referrer: Database.User,
	userService: BotDependencies["userService"],
) {
	// If user already has a referrer, just show the menu
	if (referral.referrerId) {
		// Check if user has a display name set
		if (!referral.displayName) {
			return ctx.sendMenu("NewUserStart", { state: null });
		}
		await ctx.sendMenu("ExistingUserStart", { state: null });
		return;
	}

	// Update user's referrer
	await userService.updateUser(referral.id, { referrerId: referrer.id });

	// Check if user has a display name set
	if (!referral.displayName) {
		return ctx.sendMenu("NewUserStart", { state: null });
	}

	await ctx.sendMenu("ExistingUserStart", { state: null });
}
