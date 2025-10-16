import { Menu } from "@grammyjs/menu";
import type { MenuFlavor, MenuOptions } from "@grammyjs/menu";
import { Composer, InputFile, type Context, type Middleware, type MiddlewareFn } from "grammy";
import type { ExtraSendOrEdit, ExtraSendOrEditPhoto, MessageMethodFlavour } from "./sendOrEditMethod.ts";
import { type OtelFlavour } from "./opentelemetry.ts";
import { stringifySafe, Unreachable, Unsupported, type MaybePromise } from "../utils/index.ts";
import type { InlineKeyboardButton } from "grammy/types";

/**
 * Use declaration merging to declare menu state types here.
 * If a Menu does not have a state, it should be declared as null.
 *
 * This can be done from anywhere in the project, as long as `declare module` is used.
 * Use this before creating a Menu instance.
 *
 * @example
 * declare module "../plugins/StatefulMenu.ts" {
 * 	interface MenuRegistry {
 * 		MyMenu: { token: string };
 * 	}
 * }
 */
export interface MenuRegistry {}

export type MenuIds = keyof MenuRegistry;

export type ExtraSendMenu<Id extends MenuIds> = Omit<ExtraSendOrEdit, "reply_markup"> & {
	asChild?: boolean;
} & (MenuRegistry[Id] extends null ? { state?: null } : { state: MenuRegistry[Id] });
export interface sendMenu {
	<Id extends MenuIds>(
		...args: MenuRegistry[Id] extends null
			? [name: Id, text?: string | undefined, extra?: ExtraSendMenu<Id>]
			: [name: Id, text: string | undefined, extra: ExtraSendMenu<Id>]
	): Promise<{ message_id: number }>;
	<Id extends MenuIds>(
		...args: MenuRegistry[Id] extends null
			? [name: Id, extra?: ExtraSendMenu<Id>]
			: [name: Id, extra: ExtraSendMenu<Id>]
	): Promise<{ message_id: number }>;
}

export interface MenuSession {
	active: string;
	state: MenuRegistry[MenuIds];
	child?: {
		active: string;
		state: MenuRegistry[MenuIds];
	};
}

export type StatefulMenuFlavour<C extends Context> = MessageMethodFlavour<OtelFlavour<C>> & {
	session: { __menu?: MenuSession };
	/**
	 * Send a Menu to the user.
	 * The text of the menu can be optionally overridden by passing a string as the second argument.
	 * The extra argument can be used to override the default extra options for the menu, and can be passed second or third.
	 *
	 * @example
	 * ctx.sendMenu("menuName")
	 * ctx.sendMenu("menuName", "text", { link_preview_options: { is_disabled: true } })
	 * ctx.sendMenu("menuName", { link_preview_options: { is_disabled: true } })
	 */
	sendMenu: sendMenu;
};

//#region Helpers

const passthru = <C extends Context>(ctx: C, next: () => Promise<void>) => next();

export type StateValidator<C, Id extends MenuIds> = (state: unknown, ctx: C) => MaybePromise<MenuRegistry[Id]>;

const defaultStateValidator: StateValidator<Context, MenuIds> = state => {
	if (state === null) return null;
	throw new Error("State is not null");
};

export type MenuStateFlavour<C extends Context, Id extends MenuIds, Data> = MessageMethodFlavour<OtelFlavour<C>> & {
	menu: {
		state: MenuRegistry[Id];
		data: Data;
	};
};

type DataLoader<C extends Context, Id extends MenuIds, Data> = (ctx: C, state: MenuRegistry[Id]) => MaybePromise<Data>;

/** `load` is only required if Data is not null */
type MenuLoaderOptions<C extends Context, Id extends MenuIds, Data> = Data extends null
	? { load?: undefined }
	: { load: DataLoader<C, Id, Data> };

type ConstructorParams<C extends Context, Id extends MenuIds, Data> = MenuRegistry[Id] extends null
	? [options?: MenuOptions<C> & MenuLoaderOptions<C, Id, Data>]
	: [options: MenuOptions<C> & MenuLoaderOptions<C, Id, Data> & { validate: StateValidator<C, Id> }];

//#endregion

export class StatefulMenu<C extends StatefulMenuFlavour<Context>, Id extends MenuIds, Data = null> extends Menu<
	MenuStateFlavour<C, Id, Data>
> {
	public readonly menuId: Id;

	private dataLoader: DataLoader<C, Id, Data> = () => null as Data;
	// type safety provided by ConstructorParams; defaultStateValidator is the null validator
	private stateValidator: StateValidator<C, Id> = defaultStateValidator as unknown as StateValidator<C, Id>;

	protected messageType: "text" | "photo" = "text";
	protected headerTextBuilder: string | ((ctx: MenuStateFlavour<C, Id, Data>) => MaybePromise<string>) | undefined;
	protected headerPhotoBuilder:
		| string
		| InputFile
		| ((ctx: MenuStateFlavour<C, Id, Data>) => MaybePromise<string | InputFile>)
		| undefined;
	protected headerTextExtra: ExtraSendOrEdit | undefined;
	protected headerPhotoExtra: ExtraSendOrEditPhoto | undefined;
	protected otherwiseMiddleware: MiddlewareFn<OtelFlavour<C>> | undefined;

	constructor(id: Id, ...args: ConstructorParams<C, Id, Data>) {
		const [options] = args;
		super(id, options);
		this.menuId = id;
		if (options && "load" in options) this.dataLoader = options.load as DataLoader<C, Id, Data>;
		if (options && "validate" in options) this.stateValidator = options.validate as StateValidator<C, Id>;
	}

	/**
	 * Set the text to be sent as the menu header.
	 * If headerPhoto was also called on the Menu, this text will be used as the caption.
	 */
	headerText(
		builder: string | ((ctx: MenuStateFlavour<C, Id, Data>) => MaybePromise<string>),
		other?: ExtraSendOrEdit,
	): StatefulMenu<C, Id, Data> {
		this.headerTextBuilder = builder;
		this.headerTextExtra = other;
		return this;
	}

	/**
	 * Set the photo to be sent as the menu header.
	 * If headerText was also called on the Menu, it will be used as the caption.
	 *
	 * If an InputFile is passed, it will be cached after the first send,
	 * so we only ever send a new photo when the bot restarts.
	 */
	headerPhoto(
		photo: string | InputFile | ((ctx: MenuStateFlavour<C, Id, Data>) => MaybePromise<string | InputFile>),
		other?: ExtraSendOrEditPhoto,
	): StatefulMenu<C, Id, Data> {
		this.messageType = "photo";
		this.headerPhotoBuilder = photo;
		this.headerPhotoExtra = other;
		return this;
	}

	otherwise(middleware: Middleware<MenuStateFlavour<C, Id, Data>>): StatefulMenu<C, Id, Data> {
		this.otherwiseMiddleware = (ctx, next) => {
			return ctx.traced("menu.otherwise", async span => {
				const data = await this.dataLoader(ctx, this.getState(ctx));
				// make menu state available to otherwise middleware
				const c = this.installMenuState(ctx, data);
				span.setAttribute("menu.id", this.menuId);
				span.setAttribute("menu.type", this.isChild(ctx) ? "child" : "parent");
				span.setAttribute("menu.state", stringifySafe(c.menu.state));
				const mw = typeof middleware === "function" ? middleware : middleware.middleware();
				return mw(c, next);
			});
		};

		return this;
	}

	/**
	 * This must be correctly called in three places:
	 * * In sendMenu(), so it's available to headerText, headerPhoto, and label constructors
	 * * In render(), so it's available to callback handlers
	 * * Before passing the context to the otherwise middleware
	 *
	 * Failure to do so will result in the `ctx.menu.state` not being available where it should be.
	 */
	protected installMenuState<T extends C>(ctx: T, data: Data): MenuStateFlavour<C, Id, Data> {
		// There's no other way to maintain access to the menu `this` instance in the getter/setter functions
		// oxlint-disable-next-line typescript-eslint/no-this-alias
		const menu = this;
		return Object.assign(ctx, {
			// merge with existing menu if it exists in this context
			menu: Object.assign((ctx as unknown as { menu?: object | undefined }).menu ?? {}, {
				// ctx.session.__menu cannot be undefined while calling installMenuState
				// chose the correct state based on whether the active menu is a child or parent
				get state() {
					return menu.getState(ctx);
				},
				set state(state: MenuRegistry[Id]) {
					menu.setState(ctx, state);
				},
				data,
			}),
		});
	}

	override async render(ctx: MenuStateFlavour<C, Id, Data>): Promise<InlineKeyboardButton[][]> {
		let data;

		// sanity check, probably unnecessary
		if (typeof ctx.menu === "object") {
			// if the render is happening in sendMenu context, data will already have been loaded by sendMenu
			if (ctx.menu.data) data = ctx.menu.data;
			// if the render is happening from a callback update, data will have to be fetched for the render
			else data = await this.dataLoader?.(ctx, ctx.menu.state);
		}

		return super.render(this.installMenuState(ctx, data as Data));
	}

	// @ts-expect-error type mismatches between Menu and StatefulMenu -- not an issue
	override makeNavInstaller(
		menu: Menu<C>,
	): MiddlewareFn<StatefulMenuFlavour<C & MenuFlavor & { menu: { data: Data } }>> {
		const navInstaller = super.makeNavInstaller(menu) as MiddlewareFn<C>;

		return (ctx, next) => {
			// capture our menu
			const menu = ctx.menu;

			// call upstream navInstaller with our additional installer as next()
			// navInstaller will install ctx.menu, overwriting our menu
			return navInstaller(ctx, () => {
				const unimplemented = () => {
					throw new Unsupported("Use ctx.sendMenu to navigate between menus");
				};

				// overwrite their menu
				ctx.menu = Object.assign(menu, {
					back: unimplemented,
					nav: unimplemented,
					update: unimplemented,
					close: unimplemented,
				});

				return next();
			});
		};
	}

	// @ts-expect-error this method only overridden to fix StatefulMenu type
	override register(menu: StatefulMenu<C, Id, Data> | StatefulMenu<C, Id, Data>[], parent?: string): void {
		return super.register(menu as unknown as Menu<MenuStateFlavour<C, Id, Data>>[], parent);
	}

	protected isParent(ctx: C): ctx is C & { session: { __menu: { active: Id } } } {
		return ctx.session.__menu?.active === this.menuId;
	}

	protected isChild(ctx: C): ctx is C & { session: { __menu: { child: { active: Id } } } } {
		return ctx.session.__menu?.child?.active === this.menuId;
	}

	protected getState(ctx: C): MenuRegistry[Id] {
		// choose the correct state based on the active menu (parent or child)

		if (this.isChild(ctx)) return ctx.session.__menu.child.state as MenuRegistry[Id];
		else if (this.isParent(ctx)) return ctx.session.__menu.state as MenuRegistry[Id];
		else throw new Unreachable("Could not choose a menu state!" as never);
	}

	protected setState(ctx: C, state: MenuRegistry[Id]) {
		// set the state for the correct active menu (parent or child)

		if (this.isChild(ctx)) ctx.session.__menu.child.state = state;
		else if (this.isParent(ctx)) ctx.session.__menu.state = state;
		else throw new Unreachable("Could not choose a menu state!" as never);
	}

	protected async getMessageText(ctx: MenuStateFlavour<C, Id, Data>) {
		if (typeof this.headerTextBuilder !== "function") return this.headerTextBuilder;
		return this.headerTextBuilder(ctx);
	}

	protected async getMessagePhoto(ctx: MenuStateFlavour<C, Id, Data>) {
		if (typeof this.headerPhotoBuilder !== "function") return this.headerPhotoBuilder;
		return this.headerPhotoBuilder(ctx);
	}

	protected getExtra({ state: _, ...extra }: ExtraSendMenu<any> = {}) {
		// Priority: extra > headerPhotoExtra > headerTextExtra
		return { ...this.headerTextExtra, ...this.headerPhotoExtra, ...extra };
	}

	protected getParent() {
		return this.parent;
	}

	// static methods can access private and protected members, but this is re-exported below as a plain function
	static registerMenus<C extends StatefulMenuFlavour<MessageMethodFlavour<OtelFlavour<Context>>>>(
		// enforce registering all menus at runtime!
		menus: { [Id in MenuIds]: StatefulMenu<C, Id, any> },
	): Middleware<C> {
		const menusArray = Object.values(menus) as StatefulMenu<C, MenuIds, unknown>[];

		const composer = new Composer<C>();

		composer.use(async (ctx, next) => {
			let menuSentThisUpdate = false;
			ctx.sendMenu = async (name, text?: string | ExtraSendMenu<any>, extra?: ExtraSendMenu<any>) => {
				return ctx.traced("telegram.sendMenu", async span => {
					if (typeof text === "object" && text != null) {
						extra = text;
						text = undefined;
					}

					let state = extra?.state ?? null;
					// if sendMenu is called by a child while it's active,
					// it's a refresh of the same child menu. Implicitly assume asChild = true
					const asChild = extra?.asChild ?? ctx.session?.__menu?.child?.active === name;
					span.setAttribute("menu.id", name);
					span.setAttribute("menu.type", asChild ? "child" : "parent");
					span.setAttribute("menu.state", stringifySafe(state));

					const chosen = menusArray.find(menu => menu.menuId === name);
					if (!chosen) throw new Error(`Requested menu '${name}' was not passed to menus() middleware.`);

					state = await chosen.stateValidator(state, ctx);

					if (asChild) {
						if (!ctx.session?.__menu?.active) {
							throw new Error("No active menu! Cannot send child menu without a parent menu");
						}

						ctx.session.__menu.child = { active: name, state };
					} else {
						const menuSession: MenuSession = (ctx.session.__menu ??= { active: name, state });
						menuSession.active = name;
						menuSession.state = state;
						delete menuSession.child;
					}

					const data = await chosen.dataLoader(ctx, state);
					const headerCtx = chosen.installMenuState(ctx, data);

					text = text ?? (await chosen.getMessageText(headerCtx));
					if (!text) throw new TypeError(`Missing \`menu.headerText()\` call in menu '${name}'`);

					const incomingStart = ctx.message?.text === "/start" && !menuSentThisUpdate;

					const other = {
						link_preview_options: { is_disabled: true },
						skipEdit: incomingStart,
						...chosen.getExtra(extra),
					};

					if (asChild) {
						return ctx.sendChild(text, { ...other, reply_markup: chosen });
					}

					const photo = chosen.messageType === "photo" ? await chosen.getMessagePhoto(headerCtx) : undefined;

					menuSentThisUpdate = true;

					if (photo) {
						const msg = await ctx.sendOrEditPhoto(photo, { caption: text, ...other, reply_markup: chosen });
						if (chosen.headerPhotoBuilder instanceof InputFile) {
							// cache the photo file_id to be used as the header text
							// so we only ever send a new photo when the bot restarts
							chosen.headerPhotoBuilder = msg.file_id;
						}
						return msg;
					} else {
						return ctx.sendOrEdit(text, { ...other, reply_markup: chosen });
					}
				});
			};

			if (!ctx.from) return next();

			const callback = ctx.callbackQuery?.data;

			if (callback) {
				const menuId = callback?.split("/")[0]; // extract menu id from callback
				const isParent = menuId === ctx.session.__menu?.active;
				const isChild = menuId === ctx.session.__menu?.child?.active;

				if (!isParent && !isChild) {
					// user has already navigated to a different menu
					// ignore the callback silently
					return ctx.answerCallbackQuery();
				}

				const chosen = menusArray.find(menu => menu.menuId === menuId);

				if (!chosen) {
					console.error(
						`A non-existent or unknown menu, "${menuId}" was in menu state.`,
						`Resetting menu session to prevent infinite loop.`,
						`This is either because the menu was not passed to menus() middleware, or because the menu no longer exists.`,
					);
					delete ctx.session.__menu;
					return ctx.answerCallbackQuery("Outdated menu, please try again, or send /start");
				}

				const data = await chosen.dataLoader(ctx, chosen.getState(ctx));
				const c = chosen.installMenuState(ctx, data);

				return ctx.traced("menu.callback", async span => {
					span.setAttribute("menu.id", chosen.menuId);
					// TODO: this callback has the format MenuId/row/column/hash
					// this is useful for identifying the button that was pressed
					// but it's not the most readable
					// Maybe we should translate it to the button text if possible
					span.setAttribute("menu.callback", callback);
					span.setAttribute("menu.state", stringifySafe(c.menu.state));
					span.setAttribute("menu.data", stringifySafe(data));
					return next();
				});
			}

			return next();
		});

		const [main, ...rest] = menusArray;
		if (main) {
			// register to main all other menus
			// that don't have a parent yet
			main.register(rest.filter(each => !each.getParent()));
			composer.use(main);
		}

		composer.use(async (ctx, next) => {
			if (!ctx.from) return next();

			const activeMenu = ctx.session.__menu?.active;
			const childMenu = ctx.session.__menu?.child?.active;
			if (!activeMenu) return next();

			const chosen = menusArray.find(menu => menu.menuId === activeMenu);
			const childChosen = menusArray.find(menu => menu.menuId === childMenu);
			if (!chosen) {
				console.warn(
					`Tried to navigate to a non-existent or unknown menu, ${activeMenu}.`,
					`Resetting menu session and skipping menu() middleware.`,
					`This is either because the menu was not passed to menus() middleware, or because the menu no longer exists.`,
				);

				delete ctx.session.__menu;
				return next();
			}

			// call child and parent otherwise middleware in reverse sequence
			// child has higher priority, so it should be called first
			await (childChosen?.otherwiseMiddleware || passthru)(ctx, async () => {
				await (chosen.otherwiseMiddleware || passthru)(ctx, next);
			});
		});

		return composer;
	}
}

/**
 * Create a new menu.
 *
 * @example
 * declare module "../plugins/StatefulMenu.ts" {
 * 	interface MenuRegistry {
 * 		MyMenu: { token: string };
 * 	}
 * }
 *
 * const menu = createMenu("MyMenu")
 * 	.init<Context>({
 * 		validate: state => state && "token" in state && typeof state.token === "string",
 * 	})
 * 	.headerText(ctx => `Hello, your token is ${ctx.menu.state.token}!`)
 * 	.text("A", (ctx) => ctx.reply("You selected A"))
 * 	.text("B", (ctx) => ctx.reply("You selected B"))
 * 	.otherwise((ctx) => ctx.reply("You sent something else"));
 */
export const createMenu = <Id extends MenuIds>(id: Id) => ({
	// this is curried to allow inferring id from the argument, but explicitly pass Context type

	/**
	 * Create a new menu instance.
	 * If the menu has state, it must be validated in the validate option here.
	 */
	init: <C extends StatefulMenuFlavour<MessageMethodFlavour<Context>>, Data = null>(
		...args: ConstructorParams<C, Id, Data>
	) => new StatefulMenu<C, Id, Data>(id, ...args),
});

/**
 * Register all menus in the registry.
 *
 * @example
 * menus({
 * 	MyMenu: MyMenu(deps),
 * 	OtherMenu: OtherMenu(deps),
 * });
 */
export const menus = StatefulMenu.registerMenus;
