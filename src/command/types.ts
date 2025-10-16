import type { BotCommandScope } from "grammy/types";
import type { BotContext } from "../context.ts";
import type { CommandContext, Middleware } from "grammy";
import type { BotDependencies } from "../dependencies.ts";

/**
 * This interface allows us to colocate the command definition with its handler.
 *
 * If a command needs to be shown in the bot's menu, it must have a description.
 */
export interface BotCommandSetup {
	/** The command to listen for (e.g. "start") */
	command: string;
	/** Decides whether the command is shown in the bot's menu */
	description?: string;
	/** The function to call when the command is received */
	getHandler: (deps: BotDependencies) => Middleware<CommandContext<BotContext>>;
	scope?: BotCommandScope;
}
