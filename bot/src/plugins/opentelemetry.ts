import type { Context, Middleware, RawApi, Transformer } from "grammy";

import * as otel from "@opentelemetry/api";
import { isError, stringifySafe } from "../utils/index.ts";
import { OTLP_ENDPOINT } from "../../../shared/env.ts";

import { w } from "w";

const log = w("bot:otel");

export const tracer = otel.trace.getTracer("rfihtengolts-bot");
export const metrics = otel.metrics.getMeter("rfihtengolts-bot");

/**
 * Enables telemetry for every API call made outside of a middleware or
 * by using `bot.api` directly.
 *
 * No need to mount this to `bot.api` because it's mounted to `ctx.api` in otelMiddleware.
 *
 * @example
 * bot.api.config.use(otelTransformer());
 *
 * // or
 *
 * bot.use((ctx, next) => {
 * 	ctx.api.config.use(otelTransformer());
 * 	return next();
 * })
 */
export const otelTransformer = (): Transformer<RawApi> => {
	return (prev, method, payload, signal) => {
		const name = `telegram.api.${method}`;
		return tracer.startActiveSpan(name, span => {
			span.setAttribute("telegram.api.method", method);
			span.addEvent("telegram.api.request", { body: stringifySafe(payload) });
			return prev(method, payload, signal)
				.then(response => {
					span.addEvent("telegram.api.response", { body: stringifySafe(response) });
					span.end();
					return response;
				})
				.catch(error => {
					if (isError(error)) span.recordException(error);
					else span.addEvent(name + ".error", { body: stringifySafe(error) });
					span.end();
					throw error;
				});
		});
	};
};

export const traced = <T>(name: string, fn: (span: otel.Span) => Promise<T>) => {
	return tracer.startActiveSpan(name, async span => {
		try {
			const result = await fn(span);
			span.end();
			return result;
		} catch (error) {
			if (isError(error)) span.recordException(error);
			else span.addEvent(name + ".error", { body: stringifySafe(error) });
			span.end();
			throw error;
		}
	});
};

export interface TraceFunctionOptions {
	attributes?: Record<string, string | number | boolean>;
}

export const traceFunction = <F extends (...args: any[]) => Promise<any>>(
	name: string,
	fn: F,
	options?: TraceFunctionOptions,
): F => {
	return ((...args: Parameters<F>) => {
		return tracer.startActiveSpan(name, span => {
			span.setAttribute(name + ".args", stringifySafe(args));

			if (options?.attributes) {
				for (const [key, value] of Object.entries(options.attributes)) {
					span.setAttribute(name + "." + key, stringifySafe(value));
				}
			}
			let result;

			try {
				result = fn(...args);
			} catch (error) {
				// synchronous error
				if (isError(error)) span.recordException(error);
				else span.addEvent(name + ".error", { body: stringifySafe(error) });
				span.end();
				throw error;
			}

			if (!(result instanceof Promise)) {
				// synchronous result
				span.setAttribute(name + ".result", stringifySafe(result));
				span.end();
				return result;
			}

			return result
				.then(result => {
					// asynchronous result
					span.setAttribute(name + ".result", stringifySafe(result));
					span.end();
					return result;
				})
				.catch(error => {
					// asynchronous error
					if (isError(error)) span.recordException(error);
					else span.addEvent(name + ".error", { body: stringifySafe(error) });
					span.end();
					throw error;
				});
		});
	}) as F;
};

/**
 * Recursively mutates the object to add OpenTelemetry tracing to all methods found.
 *
 * To skip tracing a method or object, add a `skipTracing` property to the method.
 *
 * @example
 * const obj = {
 * 	method1: () => {},
 * 	method2: () => {},
 * 	subObj: {
 * 		method3: () => {},
 * 		method4: () => {},
 * 	},
 * };
 *
 * // method2 will not be traced
 * Object.assign(obj.method2, { skipTracing: true });
 *
 * // subObj will not be traced
 * Object.assign(obj.subObj, { skipTracing: true });
 *
 * recursivelyTraceMethods("obj", obj);
 */
export const recursivelyTraceMethods = <R extends Record<string, any>>(obj: R, prefix?: string): R => {
	for (const key in obj) {
		const entry = obj[key];

		if (typeof entry === "function") {
			if ("skipTracing" in entry && entry.skipTracing) continue;
			const name = prefix ? prefix + "." + key : key;
			log(`adding tracing to ${name}`);

			obj[key] = traceFunction(name, entry.bind(obj)) as R[typeof key];
		} else if (typeof entry === "object" && entry !== null && !Array.isArray(entry)) {
			if ("skipTracing" in entry && entry.skipTracing) continue;
			recursivelyTraceMethods(entry, prefix ? prefix + "." + key : key);
		}
	}

	return obj;
};

export type OtelFlavour<C extends Context> = C & {
	traced: typeof traced;
	otel: { tracer: otel.Tracer; span: otel.Span; traceId?: string };
};

export const updateCounter = metrics.createCounter("telegram.updates.count", {
	description: "Total number of Telegram updates processed",
});

export const updateProcessingHistogram = metrics.createHistogram("telegram.update.processing", {
	description: "Time taken to process a Telegram update",
	unit: "ms",
});

/**
 * OpenTelemetry middleware that instruments every update.
 *
 * This also enables the `otelTransformer` to instrument every API call made inside a middleware.
 *
 * @example
 * bot.use(otelMiddleware());
 */
export const otelMiddleware = <C extends Context>(): Middleware<OtelFlavour<C>> => {
	const transformer = otelTransformer();

	return async (ctx, next) => {
		const start = Date.now();

		return tracer.startActiveSpan("telegram.update", span => {
			ctx.api.config.use(transformer);

			const type = Object.keys(ctx.update).filter(key => key !== "update_id")[0]!;

			span.setAttribute("telegram.update.id", ctx.update.update_id);
			span.setAttribute("telegram.update.type", type);

			updateCounter.add(1, { update_type: type });

			if (ctx.from) {
				span.setAttribute("telegram.update.from.id", ctx.from.id);
				span.setAttribute("telegram.update.from.username", ctx.from.username ?? "n/a");
			}

			// not using stringify_safe here because it's guaranteed to be valid JSON
			span.addEvent("telegram.update", { body: stringifySafe(ctx.update) });

			ctx.traced = traced;
			ctx.otel = {
				tracer,
				span,
				get traceId() {
					if (OTLP_ENDPOINT) return span.spanContext().traceId;
					return undefined;
				},
			};
			return next()
				.then(() => {
					updateProcessingHistogram.record(Date.now() - start, { update_type: type });
					span.end();
				})
				.catch(error => {
					span.recordException(error as Error);
					span.end();
					throw error;
				});
		});
	};
};
