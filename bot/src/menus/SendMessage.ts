import { ok } from "node:assert";
import * as S from "sury";
import { createMenu } from "../plugins/StatefulMenu.ts";
import type { BotContext } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { COMMON_BUTTONS } from "../messages/index.ts";

// Extend the menu registry for stateful steps

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		SendMessage:
			| { step: "input" }
			| { step: "preview"; message: string }
			| { step: "confirm"; message: string; userCount: number }
			| { step: "sending"; message: string; userCount: number }
			| { step: "done"; sent: number; failed: number; userCount: number };
	}
}

export const SendMessage = (deps: Pick<BotDependencies, "userService" | "notificationService">) => {
	const schema = S.union([
		S.schema({
			step: "input" as const,
		}),
		S.schema({
			step: "preview" as const,
			message: S.string,
		}),
		S.schema({
			step: "confirm" as const,
			message: S.string,
			userCount: S.number,
		}),
		S.schema({
			step: "sending" as const,
			message: S.string,
			userCount: S.number,
		}),
		S.schema({
			step: "done" as const,
			sent: S.number,
			failed: S.number,
			userCount: S.number,
		}),
	]);

	return createMenu("SendMessage")
		.init<BotContext>({
			validate: state => S.parseOrThrow(state, schema),
		})
		.headerText(ctx => {
			const state = ctx.menu.state;
			if (!state || state.step === "input") {
				return "Enter message to send to all users:";
			}
			if (state.step === "preview") {
				return `Preview of your message:\n\n${state.message}\n\nWhat would you like to do?`;
			}
			if (state.step === "confirm") {
				return `Are you sure you want to send this message to ${state.userCount} users?\n\n${state.message}`;
			}
			if (state.step === "sending") {
				return `Sending message to ${state.userCount} users...`;
			}
			if (state.step === "done") {
				return `✅ Message queued!\n\nUsers: ${state.userCount}\n\nMessages have been queued for delivery. Check queue status for progress.`;
			}
			return "Unknown state";
		})
		.otherwise(async (ctx, next) => {
			const state = ctx.menu.state;
			if (!state || state.step === "input") {
				if (ctx.has("::bot_command")) return next();
				if (!ctx.has(":text")) return next();
				const text = ctx.message?.text?.trim();
				if (!text) return next();
				return ctx.sendMenu("SendMessage", {
					state: { step: "preview", message: text },
				});
			}
			return next();
		})
		.dynamic(async (ctx, range) => {
			const state = ctx.menu.state;
			if (!state || state.step === "input") {
				range.text(COMMON_BUTTONS.back, async () => ctx.sendMenu("AdminPanel"));
				return;
			}
			if (state.step === "preview") {
				range.text("Test to myself", async () => {
					ok(ctx.from);
					try {
						const preview = await ctx.api.sendMessage(ctx.from.id, state.message);
						await ctx.sendMenu("SendMessage", "What would you like to do?", {
							state: { step: "preview", message: state.message },
							reply_parameters: { message_id: preview.message_id },
						});
					} catch {
						await ctx.sendMenu("ErrorState", { state: { msg: "❌ Failed to send test message." } });
					}
				});
				range.row().text("Send to All Users", async () => {
					const users = await deps.userService.findAllUsers();
					const userCount = users.length;
					return ctx.sendMenu("SendMessage", {
						state: { step: "confirm", message: state.message, userCount },
					});
				});
				range.row().text("Cancel", async () => ctx.sendMenu("AdminPanel"));
				return;
			}
			if (state.step === "confirm") {
				range.text("❌ Decline", async () =>
					ctx.sendMenu("SendMessage", { state: { step: "preview", message: state.message } }),
				);
				range.text("✅ Send", async () => {
					await ctx.sendMenu("SendMessage", {
						state: { step: "sending", message: state.message, userCount: state.userCount },
					});

					try {
						const users = await deps.userService.findAllUsers();
						const messages = users.map(user => ({ userId: user.id, message: state.message }));

						// Queue messages using the notification service
						await deps.notificationService.queueMessages(messages);

						return ctx.sendMenu("SendMessage", {
							state: { step: "done", sent: state.userCount, failed: 0, userCount: state.userCount },
						});
					} catch (error) {
						console.error("Error queuing messages:", error);
						await ctx.sendMenu("ErrorState", {
							state: { msg: "❌ Failed to queue messages. Please try again." },
						});
					}
				});
				range.text("Cancel", async () => ctx.sendMenu("AdminPanel"));
				return;
			}
			if (state.step === "done") {
				range.text(COMMON_BUTTONS.back, async () => ctx.sendMenu("AdminPanel"));
				return;
			}
		});
};
