import { createMenu } from "../plugins/StatefulMenu.ts";
import { type BotContext, coerceFrom } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { posts, COMMON_BUTTONS } from "../messages/index.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		CreatePostMenu: null;
	}
}

class CreatePostMenuError extends Error {}

export const CreatePostMenu = (deps: Pick<BotDependencies, "postService">) =>
	createMenu("CreatePostMenu")
		.init<BotContext>()
		.headerText(posts.createPostHeader())
		.text(COMMON_BUTTONS.back, ctx => ctx.sendMenu("PostsMenu", { state: null }))
		.otherwise(async (ctx, next) => {
			if (ctx.has("::bot_command")) return next();
			if (!ctx.has(":text")) return next();
			
			const { id } = coerceFrom(ctx);
			const text = ctx.message?.text.trim();
			if (!text) return next();

			try {
				// Create post using the post service
				await deps.postService.createPost(String(id), text);
				
				// Show success message and return to posts menu
				await ctx.reply(posts.postCreated(), { parse_mode: "HTML" });
				return ctx.sendMenu("PostsMenu", { state: null });
			} catch (error: any) {
				// Show error message and stay on create post menu
				await ctx.reply(posts.postError(error.message), { parse_mode: "HTML" });
				return ctx.sendMenu("CreatePostMenu", { state: null });
			}
		});

