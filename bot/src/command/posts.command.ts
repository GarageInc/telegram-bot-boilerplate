import type { BotDependencies } from "../dependencies.ts";
import type { BotCommandSetup } from "./types.ts";
import { coerceFrom } from "../context.ts";

export const command: BotCommandSetup = {
	command: "posts",
	description: "View and manage posts",
	getHandler: (deps: BotDependencies) => async ctx => {
		const { id } = coerceFrom(ctx);
		
		await ctx.sendMenu("PostsMenu", { state: null });
	},
};

