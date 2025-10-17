import type { BotCommandSetup } from "./types.ts";

const ADMIN_TEAM_IDS = [process.env.ADMIN_RINAT].filter(Boolean); // Filter out undefined values

export const isTeamAccessGranted = (userId: string): boolean => {
	return ADMIN_TEAM_IDS.includes(userId);
};

export const command: BotCommandSetup = {
	command: "admin",
	getHandler: () => async (ctx, next) => {
		if (!ctx.from) return console.log("No user found in context, cannot proceed with /admin command.");

		if (!isTeamAccessGranted(String(ctx.from.id))) {
			return next();
		}

		// Send admin menu
		await ctx.sendMenu("AdminPanel", { state: null });
	},
};
