import { InputFile } from "grammy";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import * as S from "sury";

import type { BotContext } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { createMenu } from "../plugins/StatefulMenu.ts";

import { onboarding } from "../messages/index.ts";
import { ok } from "node:assert";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		NewUserStart: null;
	}
}

const schema = S.nullable(
	S.schema({
		creatingWallets: S.optional(S.boolean),
		isPairingWallets: S.optional(S.boolean),
	}),
);

export const NewUserStart = (deps: BotDependencies) =>
	createMenu("NewUserStart")
		.init<BotContext>()

		.headerText(async ctx => {
			return onboarding.initial();
		})

		.dynamic(async (ctx, range) => {
			ok(ctx.from);

			await ctx.sendMenu("NewUserStart", onboarding.success(), { state: null });

			await ctx.answerCallbackQuery();
		});
