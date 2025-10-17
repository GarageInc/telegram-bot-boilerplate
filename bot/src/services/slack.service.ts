import { IncomingWebhook } from "@slack/webhook";
import { getErrorMessage } from "../utils";

export const LOGS_IGNORING_MESSAGES = ["message is not modified"];

export const isLogIgnoringMessage = (text?: string) => text && LOGS_IGNORING_MESSAGES.some(x => text.includes(x));

export const makeSlackService = (SLACK_WEBHOOK: string | undefined) => {
	const webhook = new IncomingWebhook("https://hooks.slack.com/services/" + `${SLACK_WEBHOOK}`);

	const sendMessage = async (text: string) => {
		if (!SLACK_WEBHOOK) return;
		if (isLogIgnoringMessage(text)) return;
		await webhook
			.send({ text })
			.catch(error => console.error("Error sending message to Slack:", getErrorMessage(error)));
	};

	return { sendMessage };
};

export type SlackService = ReturnType<typeof makeSlackService>;
