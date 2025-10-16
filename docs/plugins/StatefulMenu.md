# StatefulMenu

StatefulMenu is a wrapper around grammY's `Menu`.

What sets it apart is that it can remember which Menu is currently active, and what state it has.

This opens up powerful possibilities, like:

- Accepting non-callbackQuery updates coupled with the active Menu. This document will explain more about this below.
- Passing state to Menus. This acts as a form of "context" for the Menu, if the same Menu will be used in different contexts.

Additionally, unlike grammY's `Menu`, StatefulMenu can also declaratively define its text and photo.

It's important to note that some of these features are enabled by the assumption that only one Menu is active at a time. Since StatefulMenu uses sendOrEdit underneath, it will attempt to edit (or delete and re-send) the last message sent by the bot and delete the incoming message when sendMenu is called. This ensures a consistent Menu experience.

Finally, note that many of [grammY Menu](https://grammy.dev/plugins/menu) features may be used with StatefulMenu if not explicitly documented below. It's a good idea to read their documentation.

## Table of contents

- [Registering Menus](#registering-menus)
- [Sending Menus](#sending-menus)
- [Declaratively defining the Menu's text and photo](#declaratively-defining-the-menus-text-and-photo)
- [Accepting non-callback inputs coupled with the active Menu](#accepting-non-callback-inputs-coupled-with-the-active-menu)
- [Passing state to Menus](#passing-state-to-menus)
- [Good practices](#good-practices)

## Registering Menus

Every Menu must be first registered to the type-level `MenuRegistry` interface.

```TS
declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		// null is the default value for menus that don't need state
		// we'll see how to pass state to Menus below
		MyMenu: null;
	}
}

const MyMenu = createMenu("MyMenu")
	// pass your context type here
	.init<Context>()
	.text("A", (ctx) => ctx.reply("You selected A"));
```

Menus must also be passed to the `menus()` middleware. It's a type-error to not pass all Menus to the middleware.

```TS
bot.use(menus({
	MyMenu: MyMenu,
}));
```

## Sending Menus

Menus can be sent using `ctx.sendMenu()`.

```TS
await ctx.sendMenu("MyMenu");
```

## Declaratively defining the Menu's text and photo

Menus can declare their text and photo using the `headerText()` and `headerPhoto()` methods respectively.

```TS
const menu = createMenu("MyMenu")
	.init()
	// If a bare InputFile is passed, it will be cached as a file_id after the first time the menu is sent
	.headerPhoto(new InputFile(createReadStream("my-photo.png")))
	.headerText("Welcome to my menu!")
	.text("A", (ctx) => ctx.reply("You selected A"))
	.text("B", (ctx) => ctx.reply("You selected B"))
	.text("C", (ctx) => ctx.reply("You selected C"));
```

Both `headerText()` and `headerPhoto()` can be passed a function that returns a string (or InputFile for `headerPhoto()`). These functions will be called with the current context, and the return value will be used as the header text or photo.

You may override the header text while using `ctx.sendMenu()`.

```TS
await ctx.sendMenu("MyMenu", "Welcome back to my menu!");
```

But typically you'll want to set some state and declaratively react to it. More about state later.

```TS
const menu = createMenu("MyMenu")
	.init({
		validate: state => { /* TODO */ }
	})
	.headerText(ctx => `You selected ${ctx.menu.state.option}!`)
	.text("A", ctx => ctx.sendMenu("MyMenu", { state: { option: "A" } }))
	.text("B", ctx => ctx.sendMenu("MyMenu", { state: { option: "B" } }));

await ctx.sendMenu("MyMenu", { state: { option: "A" } });
```

## Accepting non-callback inputs coupled with the active Menu

This is a powerful feature that allows you to accept updates that are not callback queries.

For example, if you have a Menu that allows you to select from a list of options, but you also accept text inputs, you can use the active Menu to determine which options are available.

```TS
declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		MyMenu: null;
	}
}

const menu = createMenu("MyMenu")
	.init()
	.text("A", (ctx) => ctx.reply("You selected A"))
	.text("B", (ctx) => ctx.reply("You selected B"))
	.text("C", (ctx) => ctx.reply("You selected C"))
	.otherwise(async (ctx, next) => {
		// text inputs!
		if (ctx.message?.text) {
			await ctx.reply("You selected " + ctx.message.text);
		}

		// important to pass control to the next middleware when we're not handling the update
		return next();
	});
```

The otherwise handler can also accept a Composer. This is useful for filtering specific updates to handle, while passing through other updates to the next middleware.

```TS
const otherwiseComposer = new Composer();
otherwiseComposer.on(":text", async (ctx) => {
	await ctx.reply("You selected " + ctx.message.text);
});

const menu = createMenu("MyMenu")
	.init()
	.otherwise(otherwiseComposer);
```

## Passing state to Menus

Menus can be passed state when they are sent.

```TS
await ctx.sendMenu("MyMenu", { state: { language: "en" } });
```

This is available as `ctx.menu.state` in the Menu, but it must be validated in the Menu's `init()` method. It's a type-error to not add a validator to the menu if the registered state is not null. It's also a type-error to not pass the corresponding state when calling `ctx.sendMenu()` if the menu's registered state type is not null.

```TS
declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		// this enforces that the state is an object with a language property
		// this menu cannot be sent without the corresponding state
		MyMenu: { language: string };
	}
}

const greeting = {
	en: "Hello",
	es: "Hola",
	fr: "Bonjour",
}

const menu = createMenu("MyMenu")
	.init<Context>({
		validate: state => {
			if (!state) throw new Error("State is required");
			if (typeof state !== "object") throw new Error("State must be an object");
			if (!state.language) throw new Error("Language is required");
			if (!greeting[state.language]) throw new Error("Language is not available");
		},
	})
	.headerText(ctx => `${greeting[ctx.menu.state.language]}! (${ctx.menu.state.language})`)
	.text("en", async (ctx) => ctx.sendMenu("MyMenu", { state: { language: "en" } }))
	.text("es", async (ctx) => ctx.sendMenu("MyMenu", { state: { language: "es" } }))
	.text("fr", async (ctx) => ctx.sendMenu("MyMenu", { state: { language: "fr" } }))
	.otherwise(async (ctx, next) => {
		if (ctx.message?.text) {
			await ctx.sendMenu(
				"MyMenu",
				ctx.message.text + " is not available",
				{ state: ctx.menu.state },
			);
		}

		return next();
	});
```

## Good practices

- Don't use the `StatefulMenu` constructor directly. Use `createMenu().init()` instead.
- Always use `ctx.sendMenu()` to navigate between Menus. Do not use `ctx.menu.nav()` and `ctx.menu.back()`.
- When not passing a `Composer` to `Menu::otherwise()`, always call `next()` for updates you don't handle to pass control to the next middleware.
- Don't try to cram too much responsibility into a single Menu. If the content and buttons are different, create a new Menu. A good example is NewUserStart vs ExistingUserStart. While both are responses to `/start`, they're substantially different and should be separate Menus.
- When a button text is dynamic, pass a callback as the first argument to `menu.text()` instead of a string. Dynamic text does not need `Menu::dynamic()`.
- When a menu needs a variadic list of buttons, use `Menu::dynamic()`.
