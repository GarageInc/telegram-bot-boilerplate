import type { Transformer } from "grammy";
import * as messages from "../messages/index.ts";

export const WRAP_LENGTH = 120;

export const ensureConsistentWidth = (): Transformer => (prev, method, payload, signal) => {
	if (method === "sendMessage" || method === "editMessageText") {
		let text = (payload as { text: string }).text.trim();
		const [first, ...rest] = text.split("\n");
		const len = first?.replace(/<[^>]*>/g, "").length ?? 0;
		if (len < WRAP_LENGTH) text = first + messages.pad(WRAP_LENGTH - len) + rest.join("\n");
		return prev(method, { ...payload, text }, signal);
	}

	return prev(method, payload, signal);
};
