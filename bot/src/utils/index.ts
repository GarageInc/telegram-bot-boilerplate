// Create new files only if they have multiple exports with a clear domain.

import { format } from "node:util";

import { MenuRange } from "@grammyjs/menu";
import type { Context } from "grammy";
import type { Database } from "../infra/database/index.ts";
/** T[K] but non-nullable. Useful when having to traverse a deeply nullable object. */
export type Unwrap<T, K extends keyof T> = T[K] & {};

/** Creates a nominal type */
export type Brand<T, Marker extends string> = T & { readonly [Mark in Marker]: symbol };

export const isPositive = (value: number) => Number.isFinite(value) && value > 0;
export const isPercentage = (value: number) => Number.isFinite(value) && value > 0 && value <= 100;
export type PageMeta = {
	page: number;
	perPage: number;
	totalItems: number;
	totalPages: number;
	start: number;
	end: number;
	hasPrev: boolean;
	hasNext: boolean;
	prevPage: number | null;
	nextPage: number | null;
};

export const unique = <T>(array: readonly T[]): T[] => [...new Set(array)];

export type FlattenedWallet = Omit<Database.Wallet, "userId" | "createdAt" | "updatedAt">;
export const chunkedRange = <C extends Context, T>(
	array: readonly T[],
	rowSize: number,
	eachBuilder: (range: MenuRange<C>, item: T, index: number) => void,
): MenuRange<C> => {
	const range = new MenuRange<C>();
	for (let i = 0; i < array.length; i++) {
		if (i !== 0 && i % rowSize === 0) range.row();
		eachBuilder(range, array[i]!, i);
	}
	return range;
};

export type MaybePromise<T> = T | Promise<T>;
export type DeepFreeze<T> = T extends object ? { readonly [K in keyof T]: DeepFreeze<T[K]> } : T;

export const notNull = <T>(value: T): value is NonNullable<T> => value != null;

export const isStale = (date: number | Date, maxAgeMs: number) =>
	(date instanceof Date ? date.getTime() : date) < new Date().getTime() - maxAgeMs;

export const ZWSP = "\u200C";

export const debugTextStrip = (text: string) => {
	return text
		.replace(/<[^>]*>/g, "")
		.replaceAll(ZWSP, "")
		.replace(/\n/g, "␤")
		.replace(/\s+/g, " ")
		.trim();
};

export const truncate = (text: string, maxLength: number) => {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength - 3) + "...";
};

export const REDACTED_INFORMATION = "[Redacted]";
const TypedArray = Object.getPrototypeOf(Uint8Array);

export function stringifySafe(obj: unknown) {
	const seen = new WeakSet();
	return JSON.stringify(
		obj,
		function (key, value) {
			if (typeof value === "object" && value !== null) {
				if (seen.has(value)) return "[Circular]";
				seen.add(value);
			}
			if (typeof value === "bigint") {
				return value.toString() + "n";
			}
			if (value instanceof TypedArray || value instanceof ArrayBuffer || value instanceof SharedArrayBuffer) {
				return "<Buffer>";
			}
			if (typeof value === "string") {
				// Avoid tracing or logging of private keys that happen to be in the middle of a string.
				value = value
					.replace(/[0-9A-z]{88}/gi, REDACTED_INFORMATION)
					.replace(/(0x|)[0-9A-F]{32,64}/gi, REDACTED_INFORMATION)
					.replace(/[0-9A-z]{64,88}/gi, REDACTED_INFORMATION);
			}
			return value;
		},
		"\t",
	);
}

/**
 * Stringifies the most important parts of the update object.
 * Used for error reporting, instead of one huge JSON string.
 */
export const stringify_update = (ctx: Context) => {
	let text = "[\n";

	const type = Object.keys(ctx.update).filter(key => key !== "update_id")[0]!;

	const txt = (text: string) => truncate(debugTextStrip(text).trim().replaceAll('"', '\\"'), 100);
	const username = ctx.chat?.username ? `@${ctx.chat.username}` : undefined;

	text += "  update_id: " + ctx.update.update_id + "\n";
	text += "  type: " + type;
	if (ctx.from) text += ` (from: ${ctx.from.id}, ${ctx.from.first_name})\n`;
	if (ctx.chat) {
		text += `  chat: ${ctx.chat.id}`;
		text += ` (type: ${ctx.chat.type}`;
		if (username) text += `, username: ${username}`;
		text += ")\n";
	}
	if (ctx.callbackQuery) {
		const cb = ctx.callbackQuery;
		text += "  callback_query.id: " + cb.id;
		text += ", data: " + cb.data + "\n";
		if (cb.message?.text) text += '  message: "' + txt(cb.message.text) + '"\n';
	}
	if (ctx.message) {
		const msg = ctx.message;
		text += "  date: " + msg.date + "\n";
		text += "  message_id: " + msg.message_id + "\n";
		if (msg.text) text += '  message: "' + txt(msg.text) + '"\n';
	}

	return text + "]";
};

export const capitalise = <S extends string>(str: S): Capitalize<S> => {
	return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<S>;
};

/**
 * Generates a simple skeleton loader represented by a block of characters.
 * The block is repeated horizontally and vertically to create a loading effect.
 *
 * @param width - The width of the block (number of "█" characters per row).
 * @returns A string representing the skeleton loader, where each line is a block of the specified width.
 */
export const skeletonLoader = (width: number, height: number = 1): string =>
	Array(height).fill("░".repeat(width)).join("\n");

//TODO: enough error related functions for a separate file
export function tryCatch<T, E extends Error>(fn: () => T, errorHandler: (error: unknown) => E): T | E {
	try {
		return fn();
	} catch (err) {
		return errorHandler(err);
	}
}

export function attempt<T>(fn: () => T): T | Error {
	return tryCatch(fn, err => {
		if (err instanceof Error) return err;
		if (typeof err === "string") return new Error(err);
		return new Error("Unknown error occurred", { cause: err });
	});
}

export const isError = (value: unknown): value is Error => value instanceof Error;

export const getErrorMessage = (error: unknown): string => {
	if (isError(error)) return error.message;
	if (typeof error === "string") return error;
	return "Unknown error";
};

export const getErrorStack = (error: unknown): string => {
	if (isError(error) && error.stack) return error.stack;
	return "<no stack trace available>";
};

export const recursiveErrorCause = (error: unknown, depth = 0): string[] => {
	if (!isError(error) || !error.cause) return [];
	let msg = "└─" + "─".repeat(depth) + " " + getErrorMessage(error.cause);
	const next = recursiveErrorCause(error.cause, depth + 1);
	return [msg, ...next];
};

export const codeblock = (text: string) => "```\n" + text + "\n```";

export const formatError = (error: unknown, ctx: Context, traceId?: string, slack?: boolean) => {
	const parts: string[] = [];

	// Header with essential context
	let header = `\n🔴 Error: ${getErrorMessage(error)}`;
	if (traceId) header += ` (trace: ${traceId})`;
	parts.push(header);

	// Error cause (if exists)
	const cause = recursiveErrorCause(error);
	if (cause) parts.push(...cause);

	// Stack trace
	const stack = getErrorStack(error);
	if (stack !== "<no stack trace available>") {
		parts.push(slack ? codeblock(stack) : stack);
	}

	// Update details
	if (slack) parts.push(codeblock("Update " + stringify_update(ctx)));
	else parts.push("While handling update " + stringify_update(ctx));

	return parts.join("\n\n") + "\n";
};

export const chunk = <T>(array: T[], chunkSize: number): T[][] => {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
};

// Utility function to shorten address
export const shortenAddress = (address: string): string => {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

//TODO: should be in wallet.service
export const getWalletLabel = (wallet: Database.Wallet | undefined, labels: Record<string, string>) => {
	//TODO: wallet cannot be null if it's not optional
	if (!wallet) return "Unlabeled";
	return labels[wallet.address.toLowerCase()] || wallet.address.slice(0, 6);
};

/** Case-insensitive string equality check */
export const compareI = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

/**
 * Enforces a compile-time check that the value is `never`, aka this line must be unreachable.
 *
 * @example
 * function foo(x: "bar" | "baz"): "bar" | "baz" {
 *   if (x === "bar") return "bar";
 *   if (x === "baz") return "baz";
 *   // makes the function type exhaustive, since it's impossible to reach this line
 *   // if we somehow do reach this line, the function was likely called with invalid inputs
 *   throw new Unreachable(x);
 * }
 */
export class Unreachable extends Error {
	constructor(value: never) {
		super(`Unreachable code reached: ${value}`);
		super.name = "Unreachable";
	}
}

/**
 * Like {@link Unreachable}, but for values that are not supported,
 * and this line should not be reachable under normal circumstances.
 */
export class Unsupported extends Error {
	constructor(value: unknown) {
		super(`Unsupported value: ${format(value)}`);
		super.name = "Unsupported";
	}
}

/*
 Factory function to create error constructors with a consistent message format
 Input: a constructor for the error type and a message or an error
 Output: a function that has a message or another error as input, which then returns a Result with the error type

 Usage:
 class MyServiceError extends Error {}
 const makeServiceError = makeErrorsWith(MyServiceError);

 // note: type hint not needed, included in example for clarity
 const result: Result.Error<MyServiceError> = makeServiceError("An error occurred");
*/
export const makeErrorsWith =
	<E extends Error>(errorCtor: new (msg: string) => E) =>
	(msgOrE: string | Error) => {
		const message = typeof msgOrE === "string" ? msgOrE : `${msgOrE.name}: ${msgOrE.message}`;
		return new errorCtor(message);
	};

/*
 Coerces a value that can be either a valid type or an Error.
 If the value is an Error, it throws that error.
 If the value is of the expected type, it returns that value.
 This is useful for cases where you want to ensure that the value is valid
 and throw an error if it's not, without having to check the type manually.
 Usage:
 const value = getValue(); // could be T or Error
 // if value is an Error, it will throw that error, otherwise it's the value
 const coercedValue: T = coerce(value);
*/
export const coerce = <T>(value: T | Error): T => {
	if (value instanceof Error) {
		throw value;
	}
	return value;
};

export const mkUuid = () =>
	globalThis.crypto?.randomUUID?.() ??
	require("crypto").randomUUID?.() ??
	Math.random().toString(36).slice(2) + Date.now();

export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, baseDelayMs = 200): Promise<T> {
	let lastErr: unknown;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (err) {
			lastErr = err;
			if (attempt === maxAttempts) break;
			const wait = baseDelayMs * attempt; // linear backoff: 200ms, 400ms
			await new Promise(r => setTimeout(r, wait));
		}
	}
	throw lastErr;
}

export function paginate<T>(
	items: readonly T[] = [],
	page: number | undefined = 0,
	perPage: number = 10,
): { items: T[]; meta: PageMeta } {
	const totalItems = Math.max(0, items.length);
	const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
	const normalized = Number.isFinite(page as number) ? Math.max(0, Math.floor(page as number)) : 0;
	const safePage = Math.min(normalized, totalPages - 1);

	const start = safePage * perPage;
	const end = Math.min(totalItems, start + perPage);
	const slice = items.slice(start, end);

	const hasPrev = safePage > 0;
	const hasNext = safePage < totalPages - 1;

	return {
		items: slice,
		meta: {
			page: safePage,
			perPage,
			totalItems,
			totalPages,
			start,
			end,
			hasPrev,
			hasNext,
			prevPage: hasPrev ? safePage - 1 : null,
			nextPage: hasNext ? safePage + 1 : null,
		},
	};
}
