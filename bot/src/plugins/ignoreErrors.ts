import type { Transformer } from "grammy";

export const ignoreErrors = (): Transformer => (prev, method, payload, signal) => {
	if (["deleteMessage", "answerCallbackQuery", "editMessageReplyMarkup"].includes(method)) {
		// don't await these API calls, just return a good result

		prev(method, payload, signal)
			.then(res => !res.ok && console.log("Ignoring error for %s: %s", method, res.description))
			.catch(e => console.error("Ignoring error for %s: %o", method, e));

		return Promise.resolve({ ok: true as true, result: true as any });
	}

	return prev(method, payload, signal);
};
