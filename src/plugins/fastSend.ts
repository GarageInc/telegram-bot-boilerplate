import { TelegramClient, tl, Long } from "@mtcute/bun";
import type * as mt from "@mtcute/core";
import type * as tg from "grammy/types";
import { parse_html, parse_markdown } from "@telegraf/entity";

import type { Transformer } from "grammy";
import type { ExtraSendOrEdit } from "./sendOrEditMethod.ts";
import { notNull, Unsupported, Unreachable, getErrorMessage, stringifySafe } from "../utils/index.ts";
import { traceFunction } from "./opentelemetry.ts";

type Payload = Omit<ExtraSendOrEdit, "skipEdit" | "skipDelete"> & { chat_id: number; text: string };

const encode = (data: string) => new TextEncoder().encode(data);

const peers = {
	channel: { _: "inlineQueryPeerTypeBroadcast" },
	group: { _: "inlineQueryPeerTypeChat" },
	supergroup: { _: "inlineQueryPeerTypeMegagroup" },
	user: { _: "inlineQueryPeerTypePM" },
	bot: { _: "inlineQueryPeerTypeBotPM" },
} satisfies Record<string, tl.TypeInlineQueryPeerType>;

const chosenChatPeerTypes = (
	button: tg.InlineKeyboardButton.SwitchInlineChosenChatButton,
): tl.TypeInlineQueryPeerType[] => {
	const peerTypes: tl.TypeInlineQueryPeerType[] = [];

	const chosenChat = button.switch_inline_query_chosen_chat;
	if (chosenChat.allow_channel_chats) peerTypes.push(peers.channel);
	if (chosenChat.allow_group_chats) peerTypes.push(peers.group, peers.supergroup);
	if (chosenChat.allow_user_chats) peerTypes.push(peers.user);
	if (chosenChat.allow_bot_chats) peerTypes.push(peers.bot);

	return peerTypes;
};

const inlineButtonToMtproto = (button: tg.InlineKeyboardButton): tl.TypeKeyboardButton => {
	if ("web_app" in button) return { _: "keyboardButtonWebView", text: button.text, url: button.web_app.url };
	if ("copy_text" in button) return { _: "keyboardButtonCopy", text: button.text, copyText: button.copy_text.text };
	if ("callback_game" in button) return { _: "keyboardButtonGame", text: button.text };
	if ("pay" in button) return { _: "keyboardButtonBuy", text: button.text };
	if ("url" in button) return { _: "keyboardButtonUrl", text: button.text, url: button.url };

	if ("callback_data" in button) {
		return { _: "keyboardButtonCallback", text: button.text, data: encode(button.callback_data) };
	}

	if ("login_url" in button) {
		return {
			_: "inputKeyboardButtonUrlAuth",
			text: button.text,
			url: button.login_url.url,
			bot: { _: "inputUserSelf" },
		};
	}

	if ("switch_inline_query" in button) {
		return {
			_: "keyboardButtonSwitchInline",
			text: button.text,
			samePeer: true,
			query: button.switch_inline_query,
		};
	}

	if ("switch_inline_query_current_chat" in button) {
		return {
			_: "keyboardButtonSwitchInline",
			text: button.text,
			query: button.switch_inline_query_current_chat,
		};
	}

	if ("switch_inline_query_chosen_chat" in button) {
		return {
			_: "keyboardButtonSwitchInline",
			text: button.text,
			query: button.switch_inline_query_chosen_chat.query ?? "",
			peerTypes: chosenChatPeerTypes(button),
		};
	}

	throw new Unreachable(button);
};

function botEntityToMTProto(entity: tg.MessageEntity): tl.TypeMessageEntity {
	const map = {
		bold: "messageEntityBold",
		italic: "messageEntityItalic",
		underline: "messageEntityUnderline",
		strikethrough: "messageEntityStrike",
		spoiler: "messageEntitySpoiler",
		code: "messageEntityCode",
		pre: "messageEntityPre",
		text_link: "messageEntityTextUrl",
		text_mention: "messageEntityMentionName",
		mention: "messageEntityMention",
		hashtag: "messageEntityHashtag",
		cashtag: "messageEntityCashtag",
		bot_command: "messageEntityBotCommand",
		url: "messageEntityUrl",
		email: "messageEntityEmail",
		phone_number: "messageEntityPhone",
		custom_emoji: "messageEntityCustomEmoji",
		blockquote: "messageEntityBlockquote",
		expandable_blockquote: "messageEntityBlockquote",
	} as const;

	const long = (value: string) => Long.fromValue(value);

	const { offset, length } = entity;

	switch (entity.type) {
		case "bold":
		case "italic":
		case "underline":
		case "strikethrough":
		case "spoiler":
		case "code":
		case "mention":
		case "hashtag":
		case "cashtag":
		case "bot_command":
		case "url":
		case "email":
		case "phone_number":
			return { _: map[entity.type], offset, length };
		case "pre":
			return { _: map[entity.type], offset, length, language: entity.language ?? "" };
		case "text_link":
			return { _: map[entity.type], offset, length, url: entity.url ?? "" };
		case "text_mention":
			if (!entity.user) throw new TypeError(`text_mention entity has no user: ${stringifySafe(entity)}`);
			const userId = typeof entity.user === "number" ? entity.user : entity.user.id;
			return { _: map[entity.type], offset, length, userId };
		case "custom_emoji":
			if (!entity.custom_emoji_id)
				throw new TypeError(`custom_emoji entity has no custom_emoji_id: ${stringifySafe(entity)}`);
			return { _: map[entity.type], offset, length, documentId: long(entity.custom_emoji_id) };
		case "blockquote":
			return { _: map[entity.type], offset, length, collapsed: false };
		case "expandable_blockquote":
			return { _: map[entity.type], offset, length, collapsed: true };
		default:
			throw new Unreachable(entity);
	}
}

const getTypedChat = (peer: mt.Peer) => {
	if (peer.type === "user") return { type: "private" as const, peer: peer as mt.User };
	if (peer.type === "chat") {
		const _ = peer.raw._;
		if (_ === "chat") return { type: "group" as const, peer: peer as mt.Chat };
		if (_ === "channel") return { type: "channel" as const, peer: peer as mt.Chat };
		throw new Unsupported(_); // chatForbidden, channelForbidden are impossible cases
	}
	throw new Unreachable(peer);
};

const getChat = (message: mt.Message): tg.Chat => {
	const typed = getTypedChat(message.chat);

	if (typed.type === "private") {
		return {
			id: typed.peer.id,
			type: "private",
			first_name: typed.peer.displayName,
			username: typed.peer.username ?? undefined,
		};
	}

	if (typed.type === "group") {
		const type = typed.peer.chatType;
		if (type === "group") {
			return {
				id: typed.peer.id,
				type: "group",
				title: typed.peer.title,
			};
		}
		if (type === "supergroup") {
			return {
				id: typed.peer.id,
				type: "supergroup",
				title: typed.peer.title,
				username: typed.peer.username ?? undefined,
				is_forum: typed.peer.isForum ? true : undefined,
			};
		}
		if (type === "channel") {
			return {
				id: typed.peer.id,
				type: "channel",
				title: typed.peer.title,
				username: typed.peer.username ?? undefined,
			};
		}

		if (type === "gigagroup" || type === "monoforum") throw new Unsupported(type);
		throw new Unreachable(type);
	}

	if (typed.type === "channel") {
		return {
			id: typed.peer.id,
			type: "channel",
			title: typed.peer.title,
			username: typed.peer.username ?? undefined,
		};
	}

	throw new Unreachable(typed);
};

const getMessage = (message: mt.Message): tg.Message.TextMessage => ({
	from: {
		id: message.sender.id,
		first_name: message.sender.displayName,
		username: message.sender.username ?? undefined,
		is_bot: true,
	},
	chat: getChat(message),
	text: message.text,
	message_id: message.id,
	date: message.date.getTime() / 1000,
});

const getTextAndEntities = (opts: { text: string; parse_mode?: tg.ParseMode; entities?: tg.MessageEntity[] }) => {
	if (opts.parse_mode === "HTML") {
		const parsed = parse_html(opts.text);
		return { text: parsed.text, entities: parsed.entities as tg.MessageEntity[] };
	} else if (opts.parse_mode === "Markdown") {
		const parsed = parse_markdown(opts.text);
		return { text: parsed.text, entities: parsed.entities as tg.MessageEntity[] };
	} else if (opts.parse_mode) {
		throw new Unsupported(opts.parse_mode);
	} else {
		return { text: opts.text, entities: opts.entities };
	}
};

const getKeyboard = (markup?: tg.InlineKeyboardMarkup): mt.InlineKeyboardMarkup | undefined => {
	const kb = markup?.inline_keyboard ?? [];

	const buttons = kb.filter(row => row.length).map(row => row.map(inlineButtonToMtproto).filter(notNull));
	if (!buttons.length) return undefined;

	return { type: "inline", buttons };
};

const mapError = (e: unknown) => {
	if (e instanceof tl.RpcError) {
		const retry_after = tl.RpcError.is(e, "FLOOD_WAIT_%d") ? e.seconds : undefined;

		return {
			ok: false as false,
			error_code: e.code,
			description: "(fastSend.send) " + e.text + ": " + e.message,
			parameters: { retry_after },
		} satisfies tg.ApiError;
	}

	return {
		ok: false as false,
		error_code: 500,
		description: "(fastSend.send) " + getErrorMessage(e),
	} satisfies tg.ApiError;
};

export const fastSend = (sender?: { client: TelegramClient | undefined }): Transformer => {
	return async (prev, method, payload, signal) => {
		const client = sender?.client;
		if (!client) return prev(method, payload, signal);

		if (method === "sendMessage") {
			return traceFunction("fastSend.send", async () => {
				try {
					const { chat_id, reply_markup, business_connection_id, link_preview_options, reply_parameters, ...rest } =
						payload as Payload;

					const { text, entities } = getTextAndEntities(rest);

					const message = await client.sendText(
						chat_id,
						{ text, entities: entities?.map(botEntityToMTProto) },
						{
							abortSignal: signal as AbortSignal, // conflict between node and dom types
							disableWebPreview: link_preview_options?.is_disabled,
							invertMedia: link_preview_options?.show_above_text,
							replyTo: reply_parameters?.message_id,
							businessConnectionId: business_connection_id,
							replyMarkup: getKeyboard(reply_markup),
						},
					);

					const result: tg.ApiSuccess<any> = { ok: true as true, result: getMessage(message) };
					return result;
				} catch (e) {
					return mapError(e);
				}
			})();
		}

		if (method === "editMessageText") {
			return traceFunction("fastSend.edit", async () => {
				try {
					const { chat_id, message_id, reply_markup, business_connection_id, link_preview_options, ...rest } =
						payload as Payload & { message_id: number };

					const { text, entities } = getTextAndEntities(rest);

					const message = await client.editMessage({
						// abortSignal: signal as AbortSignal, // doesn't take abortSignal!?
						chatId: chat_id,
						message: message_id,
						text: { text, entities: entities?.map(botEntityToMTProto) },
						disableWebPreview: link_preview_options?.is_disabled,
						invertMedia: link_preview_options?.show_above_text,
						businessConnectionId: business_connection_id,
						replyMarkup: getKeyboard(reply_markup),
					});

					const result: tg.ApiSuccess<any> = { ok: true as true, result: getMessage(message) };
					return result;
				} catch (e) {
					return mapError(e);
				}
			})();
		}

		return prev(method, payload, signal);
	};
};
