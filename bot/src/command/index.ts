import * as start from "./start.command.ts";
import * as admin from "./admin.command.ts";

import type { BotCommandSetup } from "./types.ts";

// start command is special, so exported separately; see setup() in main.ts
export const startCommand = start.command;

// simple oneline commands don't need their own file
export const otherCommands: BotCommandSetup[] = [
	admin.command,
	{
		command: "ping",
		getHandler: () => async ctx => {
			const start = Date.now();
			const msg = await ctx.reply("Measuring latency...");
			const end = Date.now();
			const latency = end - start;
			await ctx.api.editMessageText(
				ctx.chat.id,
				msg.message_id,
				`Message delivered in: ${latency}ms.\n\nSend /start to continue.`,
			);
		},
	},
	{
		command: "changename",
		description: "Change your display name",
		getHandler: () => async ctx => ctx.sendMenu("ChangeDisplayName", { state: null }),
	},
	/**
	 * {
		command: "buy",
		description: "Buy a token",
		getHandler: () => async ctx => ctx.sendMenu("SwapToken", { state: { operation: "buy" } }),
	},
	{
		command: "sell",
		description: "Sell a token",
		getHandler: () => async ctx => ctx.sendMenu("SellTokensList", { state: { page: 0 } }),
	},
	{
		command: "wallets",
		description: "Manage your wallets",
		getHandler: () => async ctx => ctx.sendMenu("Wallets", { state: { page: 0 } }),
	},
	{
		command: "withdraw",
		description: "Withdraw tokens",
		getHandler: () => async ctx => ctx.sendMenu("WithdrawTokensList", { state: { page: 0 } }),
	},
	{
		command: "portfolio",
		description: "View your portfolio",
		getHandler: () => async ctx => {
			const cmd = ctx.entities()[0];
			const page = (cmd && parseInt(ctx.msg.text.slice(cmd.length).trim())) || 0;
			return ctx.sendMenu("Portfolio", { state: { page } });
		},
	},
	{
		command: "settings",
		description: "Adjust your settings",
		getHandler: () => async ctx => ctx.sendMenu("Settings", { state: null }),
	},
	 */
];
