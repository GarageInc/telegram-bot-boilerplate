import { Context, type SessionFlavor } from "grammy";

import type { OtelFlavour } from "./plugins/opentelemetry.ts";
import type { MessageMethodFlavour } from "./plugins/sendOrEditMethod.ts";
import type { StatefulMenuFlavour } from "./plugins/StatefulMenu.ts";
export interface UserData {
	userId?: string;
}

export interface CustomSessionData {
	userData: UserData;
}

export type BotContext = StatefulMenuFlavour<
	MessageMethodFlavour<OtelFlavour<Context & SessionFlavor<CustomSessionData>>>
>;

export type SessionData = BotContext["session"];

export const getDefaultSession = (): SessionData => {
	return {
		userData: {},
	};
};

export const coerceFrom = (ctx: BotContext) => {
	if (!ctx.from) throw new Error("Context object does not contain user");
	return ctx.from;
};
