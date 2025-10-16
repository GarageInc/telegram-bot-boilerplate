import * as S from "sury";

import { createMenu } from "../plugins/StatefulMenu.ts";
import type { BotContext } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { COMMON_BUTTONS, error } from "../messages/index.ts";
import { NO_ERROR_TRACE_ID } from "../env.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		ErrorState: {
			msg: string;
			/**
			 * ### ⚠️ You do not need to set this manually.
			 * ErrorState will automatically use the current traceId.
			 */
			traceId?: string;
			/**
			 * If true, the traceId will not be included in the error message.
			 * This is useful for error messages where we don't expect the user to contact us.
			 */
			noTraceId?: boolean;
		} | null;
	}
}

const schema = S.nullable(
	S.schema({
		msg: S.string,
		traceId: S.optional(S.string),
		noTraceId: S.optional(S.boolean),
	}),
);

export const ErrorState = (_deps: BotDependencies) =>
	createMenu("ErrorState")
		.init<BotContext>({
			validate: state => S.parseOrThrow(state, schema) ?? null,
		})
		.headerText(async ctx => {
			// Note that traceId has to be captured here in the same update where the error is being rendered
			// By the time the user presses the Help button, it will be a new update with its own traceId
			const traceId = NO_ERROR_TRACE_ID || ctx.menu.state?.noTraceId ? undefined : ctx.otel.traceId;
			ctx.menu.state = { msg: error.msg(ctx.menu.state?.msg, traceId), traceId };
			return ctx.menu.state.msg;
		})
		.url("Support", ctx => {
			let link = "https://t.me/rfihtengolts";
			const traceId = ctx.menu.state?.traceId;
			if (traceId) link += `=traceId=${traceId}`;
			return link;
		})
		.row()
		.text(COMMON_BUTTONS.backToStart, async ctx => {
			await ctx.sendMenu("ExistingUserStart", { state: null });
		});
