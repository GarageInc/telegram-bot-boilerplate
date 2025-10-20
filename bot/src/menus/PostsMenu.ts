import { createMenu } from "../plugins/StatefulMenu.ts";
import type { BotContext } from "../context.ts";
import type { BotDependencies } from "../dependencies.ts";
import { posts, COMMON_BUTTONS } from "../messages/index.ts";
import { MINI_APP_URL } from "../../../shared/env.ts";

declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		PostsMenu: null;
	}
}

export const PostsMenu = (_deps: BotDependencies) => {
	return createMenu("PostsMenu")
		.init<BotContext>()
		.headerText(posts.header())
		.webApp("💬 Open Comments", `${MINI_APP_URL}#posts`)
		.row()
		.text("📝 Create New Post", ctx => ctx.sendMenu("CreatePostMenu", { state: null }))
		.row()
		.text(COMMON_BUTTONS.backToStart, ctx => ctx.sendMenu("ExistingUserStart", { state: null }));
};

