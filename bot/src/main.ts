// ⚠️: Keep this at the top for instrumentation to work
import { sdk } from "./instrumentation.ts";

import {
	BOT_TOKEN,
	BOT_WEBHOOK_HOST,
	ENABLE_WEBHOOKS,
	EXTRA_TRACING,
	PORT,
	SHUTDOWN_TIMEOUT_MS,
	SLACK_WEBHOOK,
	WEBHOOK_SECRET_TOKEN,
	BOT_API_ROOT,
	TELEGRAM_API_ID,
	TELEGRAM_API_HASH,
	REDIS_URL,
} from "../../shared/env.ts";
import { makeClient } from "../../shared/infra/database/client.ts";

import { hash } from "node:crypto";
import { Bot, BotError, Context, session, webhookCallback } from "grammy";
import type { Update } from "grammy/types";
import { TelegramClient } from "@mtcute/bun";

//#region PLUGINS AND SETUP
import { getDefaultSession, type BotContext } from "./context.ts";
import { fastSend } from "./plugins/fastSend.ts";
import { otelMiddleware, recursivelyTraceMethods } from "./plugins/opentelemetry.ts";
import { ensureConsistentWidth } from "./plugins/ensureConsistentWidth.ts";
import { installSendOrEditMethod } from "./plugins/sendOrEditMethod.ts";
import { menus } from "./plugins/StatefulMenu.ts";
import { makeRedisStorage } from "./storage.ts";
import type { BotDependencies } from "./dependencies.ts";
import { ignoreErrors } from "./plugins/ignoreErrors.ts";
//#endregion

//#region CONTENT IMPORTS
import * as Menus from "./menus/index.ts";
import { makeUserRepository } from "./repositories/index.ts";
import {
	makeNotificationService,
	makeRedisService,
	makeSlackService,
	makeUserService,
	makeBroadcasterService,
	makeClickerService,
	makeLeaderboardService,
} from "./services/index.ts";
import { otherCommands, startCommand } from "./command/index.ts";
import { error } from "./messages/index.ts";
import type { BotCommandSetup } from "./command/types.ts";
import { formatError, getErrorMessage } from "./utils/index.ts";
//#endregion

if (EXTRA_TRACING.size > 0) {
	console.log("Extra tracing enabled for services: %s", Array.from(EXTRA_TRACING).join(", "));
}

const noop = () => void 0;

async function errorHandler(err: BotError<BotContext>, useMenu: boolean) {
	const ctx = err.ctx;

	const traceId = ctx.otel.traceId;

	console.error(formatError(err.error, ctx, traceId, false));

	// Note: we intentionally don't send err.message to the user in the below messages
	//       since it may contain sensitive information

	if (useMenu) {
		await ctx.sendMenu("ErrorState", { state: null }).catch(error => {
			console.error("Error sending ErrorState menu to Telegram:", error);
		});
	} else {
		// fallback to plain text reply if the error is happening outside the scope where we can use menus
		const msg = error.msg(undefined, traceId);
		await ctx.reply(msg, { parse_mode: "HTML" }).catch(error => {
			console.error("Error sending error message to Telegram:", error);
		});
	}

	deps.slackService.sendMessage(formatError(err.error, ctx, traceId, true)).catch(noop);
}

export function setup(bot: Bot<BotContext>, deps: BotDependencies, sender?: { client: TelegramClient | undefined }) {
	bot.api.config.use(ignoreErrors());

	bot.use((ctx, next) => {
		// immediately leave chats if they are not private
		// we can revisit this when we want to support groups
		if (ctx.chat && ctx.chat.type !== "private") return ctx.leaveChat().catch(noop);
		return next();
	});

	// Unconditionally enable otel middleware first, so use of ctx.traced() is available everywhere, even in tests
	// if OTLP_ENDPOINT is not set, the implementations are NOOP
	bot.use(otelMiddleware());

	if (TELEGRAM_API_ID && TELEGRAM_API_HASH) bot.api.config.use(fastSend(sender));

	bot.api.config.use(ensureConsistentWidth());

	const getSessionKey = (ctx: Context) => (ctx.chat && ctx.from ? `${ctx.chat.id}/${ctx.from.id}` : undefined);

	bot.use(
		session({
			storage: deps.sessionStorage.adapter,
			initial: () => getDefaultSession(),
			getSessionKey,
		}),
	);

	bot.use((ctx, next) => {
		if (!ctx.from || !ctx.chat) return next();
		// TODO: perhaps attempt to fetch wallets from the database here
		// and move this middleware to an appropriate location?
		if (!ctx.session.userData) ctx.session.userData = getDefaultSession().userData;
		return next();
	});

	// will only be called if the error is not handled by the errorBoundary below
	bot.catch(err => errorHandler(err, false));

	// This errorBoundary allows us to call sendMenu while session is still active,
	// So ErrorState can store its traceId correctly, and traces will look correct
	const composer = bot.errorBoundary(err => errorHandler(err, true));

	// needs session before
	composer.use(installSendOrEditMethod());

	// Commands
	composer.use(
		menus({
			NewUserStart: Menus.NewUserStart(deps),
			ExistingUserStart: Menus.ExistingUserStart(deps),
			ErrorState: Menus.ErrorState(deps),
			Referrals: Menus.Referrals(deps),
			SetReferralCode: Menus.SetReferralCode(deps),
			AdminPanel: Menus.AdminPanel(deps),
			QueryUser: Menus.QueryUser(deps),
			EnableReferrals: Menus.EnableReferrals(deps),
			BulkWhitelist: Menus.BulkWhitelist(deps),
			SendMessage: Menus.SendMessage(deps),
			RemoveUser: Menus.RemoveUser(deps),
			ChangeDisplayName: Menus.ChangeDisplayName(deps),
		}),
	);

	composer.command("start", startCommand.getHandler(deps));

	composer.on("::bot_command", (ctx, next) =>
		// cannot use any other commands if the user has no wallets
		// force them to go through onboarding
		next(),
	);

	for (const command of otherCommands) {
		composer.command(command.command, command.getHandler(deps));
	}

	composer.on("callback_query", async ctx => {
		// this happened because a Menu was renamed or deleted while a user was still on it
		await ctx.answerCallbackQuery({ text: "The bot has been updated; please start over.", show_alert: true });

		await ctx.sendMenu("ExistingUserStart", { state: null });
	});

	composer.on("message:text", async ctx => {
		// Handle display name input
		const text = ctx.message.text.trim();

		// Validate display name
		const validateDisplayName = (name: string): boolean => {
			return /^[a-zA-Z0-9\s]{3,20}$/.test(name);
		};

		if (!validateDisplayName(text)) {
			await ctx.reply("❌ Invalid display name. Please use 3-20 characters (letters, numbers, spaces allowed).", {
				parse_mode: "HTML",
			});
			return;
		}

		// Check if display name is already taken
		const existing = await deps.userService.findUserByDisplayName(text);
		if (existing && existing.id !== String(ctx.from.id)) {
			await ctx.reply("❌ This display name is already taken. Please choose another one.", { parse_mode: "HTML" });
			return;
		}

		// Update display name
		await deps.userService.updateUser(String(ctx.from.id), {
			displayName: text,
		});

		await ctx.sendMenu("ExistingUserStart", { state: null });
	});

	composer.on("message", async ctx => {
		// this is an unexpected message not handled by any menu
		await ctx.sendMenu("ErrorState", {
			state: { msg: "Unexpected message. Would you like to start over?", noTraceId: true },
		});
	});
}

export const bot = new Bot<BotContext>(BOT_TOKEN, { client: { apiRoot: BOT_API_ROOT } });

const db = await makeClient();
const sessionStorage = await makeRedisStorage();
const deps: BotDependencies = (() => {
	// initialisation of dependencies goes here
	const userRepository = makeUserRepository(db as any);

	const redisService = makeRedisService(REDIS_URL);

	const clickerService = makeClickerService({ redisService, userRepository });
	const leaderboardService = makeLeaderboardService({ redisService, userRepository });

	const deps: BotDependencies = {
		sessionStorage,
		notificationService: makeNotificationService(),
		redisService,
		userService: makeUserService({ userRepository }),
		slackService: makeSlackService(SLACK_WEBHOOK),
		clickerService,
		leaderboardService,
		broadcasterService: null as any, // Will be initialized after bot is created
	};

	if (EXTRA_TRACING.has("services")) recursivelyTraceMethods(deps);

	return deps;
})();

// Initialize broadcaster service (needs bot instance)
const broadcasterService = makeBroadcasterService({
	bot,
	redisService: deps.redisService,
	clickerService: deps.clickerService,
	leaderboardService: deps.leaderboardService,
});
deps.broadcasterService = broadcasterService;

// Warm up the clicker cache on startup
deps.clickerService.warmCache().catch((err: Error) => console.error("Failed to warm clicker cache:", err));

// Start periodic sync for active users
deps.clickerService.startPeriodicSync();

const sender: { client: TelegramClient | undefined } = { client: undefined };

if (TELEGRAM_API_ID && TELEGRAM_API_HASH) {
	const client = new TelegramClient({ apiId: TELEGRAM_API_ID, apiHash: TELEGRAM_API_HASH, disableUpdates: true });
	client
		.start({ botToken: BOT_TOKEN })
		.then(() => {
			sender.client = client; // ready
			console.log("⚡️ MTProto client started, will be used to speed up sendMessage");

			// mtcute wants to control the shutdown process
			client._client.platform.beforeExit(() => shutdown("mtcute"));
		})
		.catch(e => {
			console.error("Failed to start MTProto client, falling back to Bot API");
			console.error(e);
		});
} else {
	console.log("TELEGRAM_API_ID / TELEGRAM_API_HASH are not set, disabling fastSend and falling back to Bot API");
}

setup(bot, deps, sender);

// We do this early to avoid grammY calling init on the first request to set bot.botInfo
await bot.init();
const botInfo = bot.botInfo;

bot.api
	.setMyCommands(
		[startCommand, ...otherCommands].filter((c): c is BotCommandSetup & { description: string } =>
			Boolean(c.description),
		),
	)
	.then(() => console.log("Commands set"))
	.catch(error => console.error("Error setting commands:", error));

const DEFAULT_TIMEOUT_MS = 10000;

if (ENABLE_WEBHOOKS) {
	// use the bot token as the secret path, but hash it to avoid exposing it in error logs
	const secretPath = `/bot/webhook/${hash("sha256", BOT_TOKEN).slice(0, 20)}`;
	const callback = webhookCallback(bot, "bun", {
		secretToken: WEBHOOK_SECRET_TOKEN,
		timeoutMilliseconds: DEFAULT_TIMEOUT_MS,
		onTimeout: async () => {
			// cannot use req here because req.json would already have been consumed while processing the update
			try {
				const error = "Webhook timeout after " + DEFAULT_TIMEOUT_MS + "ms";
				console.log(error);
				await deps.slackService.sendMessage(error);
			} catch (error) {
				console.error("Error sending Slack message", getErrorMessage(error));
			}
		},
	});

	await bot.api.setWebhook(`${BOT_WEBHOOK_HOST}${secretPath}`, { secret_token: WEBHOOK_SECRET_TOKEN });

	console.log("Webhook set to", `${BOT_WEBHOOK_HOST}${secretPath}`);

	// Start HTTP server for webhooks
	const server = Bun.serve({
		port: PORT,
		async fetch(req) {
			const url = new URL(req.url);

			// Health check endpoint
			if (url.pathname === "/health") {
				return new Response("OK", { status: 200 });
			}

			// Webhook endpoint
			if (url.pathname === secretPath && req.method === "POST") {
				return await callback(req as any);
			}

			// 404 for all other routes
			return new Response("Not Found", { status: 404 });
		},
	});

	console.log(`HTTP server listening on port ${PORT}`);
	console.log(`Bot ${botInfo.first_name} (@${botInfo.username}) started in webhook mode`);

	// Start broadcaster service
	await deps.broadcasterService.start();
	console.log("Broadcaster service started in webhook mode");

	// Store server reference for shutdown
	(globalThis as any).__bunServer = server;
} else if (process.env.NODE_ENV !== "test") {
	bot.start({
		onStart: async botInfo => {
			console.log(`Bot ${botInfo.first_name} (@${botInfo.username}) started in long-polling mode`);
			// Start broadcaster service
			await deps.broadcasterService.start();
			console.log("Broadcaster service started in long-polling mode");
		},
	});
}

let ending = false;

async function shutdown(signal: string) {
	if (ending) return;
	ending = true;

	console.log(`${signal} received`);

	const promises: (Promise<unknown> | undefined)[] = [];

	console.log("Stopping bot...");
	promises.push(bot.stop());

	console.log("Stopping database...");
	promises.push(db.$client.end().catch(noop));

	console.log("Stopping Redis...");
	promises.push(deps.sessionStorage.destroy().catch(noop));

	console.log("Stopping notification queue...");
	promises.push(deps.notificationService.close().catch(noop));

	console.log("Stopping broadcaster service...");
	promises.push(deps.broadcasterService.stop().catch(noop));

	console.log("Stopping periodic sync...");
	deps.clickerService.stopPeriodicSync();

	// Stop HTTP server if running
	const server = (globalThis as any).__bunServer;
	if (server) {
		console.log("Stopping HTTP server...");
		promises.push(Promise.resolve(server.stop()));
	}

	if (sdk) {
		console.log("Stopping OpenTelemetry...");
		promises.push(sdk.shutdown().catch(noop));
	}

	const timeout = SHUTDOWN_TIMEOUT_MS;

	const timer = setTimeout(() => {
		console.log("Timeout reached, forcefully stopping!");
		process.exit(1);
	}, timeout);

	try {
		await Promise.all(promises.filter(Boolean)).then(() => clearTimeout(timer));
		console.log("All services stopped");
		process.exit(0);
	} catch (error) {
		console.error("Error during shutdown:", error);
		process.exit(1);
	}
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
