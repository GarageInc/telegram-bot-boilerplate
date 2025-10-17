import type { Context, InputFile, Middleware } from "grammy";
import { w } from "w";
import { type OtelFlavour } from "./opentelemetry";
import type { LinkPreviewOptions, ReplyParameters } from "grammy/types";
import { getErrorMessage } from "../utils";

const wlog = w("bot:sendOrEditMethod");

const log = (type: "text" | "photo" | "child", msg: string, updateId: number, msgId: number) =>
	wlog(`(Sending ${type}) ${msg} (update_id: ${updateId}, message_id: ${msgId})`);

type ExtraEditMessageText = NonNullable<Parameters<Context["editMessageText"]>[1]>;

interface AdditionalParams {
	/**
	 * Force sending a new message. The last message will be deleted instead of edited.
	 * To prevent deletion, use along with `skipDelete`.
	 */
	skipEdit?: boolean;
	/** Send a new message without deleting the incoming user message or our last message */
	skipDelete?: boolean;
	/**
	 * Description of the message to reply to.
	 *
	 * Setting this property also implies `skipEdit` is true.
	 */
	reply_parameters?: ReplyParameters;
	/**
	 * Options used for link preview generation for the message, if it is a text message and link preview options were changed.
	 *
	 * Only is_disabled and show_above_text are supported by fastSend.
	 */
	link_preview_options?: Pick<LinkPreviewOptions, "is_disabled" | "show_above_text">;
}

export type ExtraSendOrEdit = Omit<ExtraEditMessageText, "link_preview_options"> & AdditionalParams;

export type ExtraSendOrEditPhoto = Parameters<Context["editMessageCaption"]>[0] & {
	/**
	 * Force sending a new message. The last message will be deleted instead of edited.
	 * To prevent deletion, use along with `skipDelete`.
	 */
	skipEdit?: boolean;
	/** Send a new message without deleting the incoming user message or our last message */
	skipDelete?: boolean;
	/**
	 * Description of the message to reply to.
	 *
	 * Setting this property also implies `skipEdit` is true.
	 */
	reply_parameters?: ReplyParameters;
};

interface SendOrEditState {
	lastMessageId?: number;
	lastMessageType?: "text" | "photo";
	wasReply?: boolean;
	childMessageId?: number;
}

export type MessageMethodFlavour<C extends Context> = C & {
	session: {
		__sendOrEdit?: SendOrEditState;
	};
	sendOrEdit: (text: string, extra?: ExtraSendOrEdit & { asChild?: boolean }) => Promise<{ message_id: number }>;
	/**
	 * #### ⚠️ WARNING!
	 * This method will always delete the last sent message and send a new photo.
	 */
	sendOrEditPhoto: (
		photo: string | InputFile,
		extra?: ExtraSendOrEditPhoto,
	) => Promise<{ message_id: number; file_id: string }>;
	sendChild: (text: string, extra?: ExtraSendOrEdit) => Promise<{ message_id: number }>;
};

const DELETED_SYMBOL = Symbol("sendOrEdit:deletedIncoming");

/**
 * 💡: We only ever want to deal with one message, so we delete
 * the incoming message and edit the last message we sent
 */
export const installSendOrEditMethod = <C extends MessageMethodFlavour<OtelFlavour<Context>>>(): Middleware<C> => {
	const toIgnore = (e: unknown, type: "text" | "photo" | "child", updateId: number, msgId: number) => {
		if (e instanceof Error) {
			const desc = e.message.toLowerCase();
			const unchanged =
				// Bot API error
				desc.includes("message is not modified") ||
				// MTProto error (fastSend)
				desc.includes("message_not_modified");

			if (unchanged) {
				log(type, `Message is not modified`, updateId, msgId);
				return true;
			}
		}
		return false;
	};

	return (ctx, next) => {
		const updateId = ctx.update.update_id;

		let state: SendOrEditState | undefined;

		if ("session" in ctx) {
			ctx.session ??= {}; // be tolerant of empty session
			// this object will be reference-shared across all sendOrEdit methods, but it lives inside session
			state = ctx.session.__sendOrEdit ??= {};
		}

		const deleteMsg = (msgId: number, type: "text" | "photo" | "child", deleting: string) => {
			if (!ctx.chat) return;
			// No await because we don't care about the result, and we don't want to block the next step
			ctx.api
				.deleteMessage(ctx.chat.id, msgId)
				.then(() => log(type, `Deleted ${deleting}`, updateId, msgId))
				.catch(() => log(type, `Failed to delete ${deleting}`, updateId, msgId));
		};

		const deleteIncoming = (type: "text" | "photo" | "child", skipDelete: boolean | undefined) => {
			if (ctx.message) {
				// prevent double-deletion of incoming message
				// when sendOrEdit is called multiple times on the same update
				if (ctx[DELETED_SYMBOL as keyof typeof ctx]) return;
				if (skipDelete) log(type, `Skipping delete of incoming message`, updateId, ctx.message.message_id);
				else {
					Object.assign(ctx, { [DELETED_SYMBOL]: true });
					deleteMsg(ctx.message.message_id, type, "incoming message");
				}
			}
		};

		ctx.sendOrEdit = async (text, extra) => {
			return ctx.traced("telegram.sendOrEdit", async () => {
				if (!ctx.chat) throw new Error("Cannot call sendOrEdit on a non-chat update");
				if (!state) throw new Error("session is not available. Did you install session before the plugin?");

				const { skipEdit: _skipEdit, skipDelete, ...other } = extra ?? {};
				const skipEdit = _skipEdit || !!extra?.reply_parameters || state.wasReply;
				if (!other.parse_mode && !other.entities) other.parse_mode = "HTML";
				state.wasReply = !!extra?.reply_parameters;

				let lastMessageId: number | undefined;

				// Only overwrite if incoming update is a message or callbackQuery
				// In case of unexpected update, we simply send a new message
				if (ctx.message || ctx.callbackQuery) {
					if (extra?.asChild) lastMessageId = state.childMessageId;
					else lastMessageId = state.lastMessageId;
				}

				const type = extra?.asChild ? "child" : "text";
				let lastMessageType = extra?.asChild ? "text" : state.lastMessageType;

				// new parent message, delete previous child message
				if (!extra?.asChild && state.childMessageId) {
					deleteMsg(state.childMessageId, "text", "child message");
					state.childMessageId = undefined;
				}

				if (lastMessageId) {
					try {
						if (!skipEdit && lastMessageType === "text") {
							deleteIncoming(type, skipDelete);
							await ctx.api.editMessageText(ctx.chat.id, lastMessageId, text, other);
							log(type, "Edited a previous text message", updateId, lastMessageId);
							return { message_id: lastMessageId }; // lastMessageId unchanged
						} else {
							// delete previous message first
							if (skipEdit) log(type, "Skipping edit", updateId, lastMessageId);
							if (!skipDelete) deleteMsg(lastMessageId, type, "message");
							lastMessageId = undefined;
							// passthrough to outside the if block where we send a new message
						}
					} catch (e) {
						if (toIgnore(e, type, updateId, lastMessageId!)) return { message_id: lastMessageId! };
						// In case of any other error fall back to sending a new message below
						log(type, "Failed to edit message: " + getErrorMessage(e), updateId, lastMessageId!);
					}
				}

				const msg = await ctx.reply(text, other);
				log(type, "Sent a new text message", updateId, msg.message_id);
				lastMessageId = msg.message_id;
				if (extra?.asChild) state.childMessageId = lastMessageId;
				else {
					state.lastMessageId = lastMessageId;
					state.lastMessageType = "text";
				}

				// Delete incoming AFTER sending a message to avoid the [Start] when all messages are briefly deleted
				deleteIncoming(type, skipDelete);

				return { message_id: lastMessageId };
			});
		};

		ctx.sendOrEditPhoto = async (photo, extra) => {
			return ctx.traced("telegram.sendOrEditPhoto", async () => {
				if (!ctx.chat) throw new Error("Cannot call sendOrEditPhoto on a non-chat update");
				if (!state) throw new Error("session is not available. Did you install session before the plugin?");

				// skipEdit is not used here. Photos are always deleted unless skipDelete is true
				const { skipEdit: _skipEdit, skipDelete, ...other } = extra ?? {};
				if (!ctx.session.__sendOrEdit) ctx.session.__sendOrEdit = {};
				const skipEdit = _skipEdit || !!extra?.reply_parameters || state.wasReply;
				const _ = skipEdit; // currently always true
				if (!other.parse_mode && !other.caption_entities) other.parse_mode = "HTML";
				state.wasReply = !!extra?.reply_parameters;

				let lastMessageId = ctx.message || ctx.callbackQuery ? state.lastMessageId : undefined;

				if (lastMessageId) {
					// always delete the previous message and send new photo unless skipDelete is true
					// this is the only way to consistently edit photo, caption, and markup at once
					// otherwise we'd have to call editMessageMedia, editMessageCaption and handle errors between them
					if (!skipDelete) deleteMsg(lastMessageId, "photo", "previous message");
				}

				if (state.childMessageId) {
					deleteMsg(state.childMessageId, "photo", "child message");
					state.childMessageId = undefined;
				}

				const msg = await ctx.replyWithPhoto(photo, other);
				log("photo", `Sent a new photo message`, updateId, msg.message_id);
				lastMessageId = msg.message_id;
				state.lastMessageId = lastMessageId;
				state.lastMessageType = "photo";

				// Delete incoming AFTER sending a message to avoid the [Start] when all messages are briefly deleted
				deleteIncoming("photo", skipDelete);

				const file_id = msg.photo.reduce((a, b) => (a.width > b.width ? a : b)).file_id;

				return { message_id: lastMessageId, file_id };
			});
		};

		ctx.sendChild = async (text, extra) => {
			if (!ctx.chat) throw new Error("Cannot call sendChild on a non-chat update");
			return ctx.sendOrEdit(text, { ...extra, asChild: true });
		};

		return next();
	};
};
