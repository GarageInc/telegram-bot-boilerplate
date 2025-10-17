# Preface

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119).

This document is a guide for contributing to this project. It MUST be followed with care and kept updated to maintain consistency for future maintainers and contributors.

After reading this document, you SHOULD read [docs/plugins/StatefulMenu.md](./plugins/StatefulMenu.md). This is the central pillar of this project, and a good understanding of it is essential to contributing.

# Table of contents

- [Basic setup](#basic-setup)
  - [Runtime](#runtime)
  - [Formatting](#formatting)
  - [TypeScript](#typescript)
  - [Linting](#linting)
- [Environment variables](#environment-variables)
- [Menus](#menus)
- [Dependency Injection](#dependency-injection)
- [Testing](#testing)
- [Plugins](#plugins)
- [Principles](#principles)

<!-- TODO: add section on deployment to production and staging, and diagnostics and debugging in production -->

# Basic setup

## Runtime

This project uses [Bun](https://bun.sh). It cannot be run with Node.js because we use `Bun.serve`. However, you SHOULD use `"node:*"` modules when possible to maintain as much compatibility as possible. If a specific API is either more convenient or more performant via Bun APIs, you MAY use them. Dependencies must be installed using `bun add`.

## Running the bot

> [!WARNING]
>
> This section is a work in progress.
> It needs to document how to set up the PostgreSQL database, and Redis cache.

```bash
# install dependencies
bun install

# run in watch mode
bun dev

# or in regular mode
bun start
```

If you haven't already set up the [environment variables](#environment-variables), the bot will exit with an easy to copy list of required variables. You MAY copy this to `.env`, and fill in the values before running the bot again. See [`src/env.ts`](../src/env.ts) for a list of all accepted variables.

```
> bot dev

[CRITICAL!] Missing required environment variables (8):

BOT_TOKEN=
REDIS_URL=
PG_HOST=
PG_PORT=
PG_USER=
PG_PASSWORD=
PG_DATABASE=
```

## Formatting

Respect the `.prettierrc` file. You SHOULD run `bun fmt` before committing. Using the editor extension for your editor is recommended.

- [VSCode and forks](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Emacs](https://github.com/prettier/prettier-emacs)
- Add your editor extension to the list if it's not already there.

## TypeScript

This project uses strict TypeScript. When possible, we SHOULD upgrade to the latest version of TypeScript. However, note that Bun strips types and does not check them. This improves our development velocity and allows us to depend on editor linting, but you SHOULD run `bun check` before committing.

## Linting

This project currently does not use a linter. As the codebase grows, we MAY add a linter. The current recommendation is [oxlint](https://oxc.rs/docs/guide/usage/linter). It's a highly performant linter that also implements all ESLint rules in addition to several of their own, with sensible defaults. When configured, it SHOULD be added to the `check` script in package.json.

<!-- TODO: add introduction to Otel -->

# Environment variables

Bun automatically loads environment variables from the `.env` file while running locally. For non-secret production variables, you MUST use the `production.env` file. This is merged with secrets in the deployment environment. While adding new environment variables, you SHOULD add them to both files and the `.env.example` file, especially if they are required.

All environment variables MUST be loaded centrally using the `env.ts` module and imported elsewhere from there.

Use the `reqd` and `opt` functions to load environment variables.

```TS
export const TELEGRAM_BOT_TOKEN = reqd("TELEGRAM_BOT_TOKEN");
export const ENABLE_WEBHOOK = opt("ENABLE_WEBHOOK");

...

checks();
```

The `checks()` function at the end of `env.ts` will throw an error if any required environment variables are not set.

You MAY transform the environment variables before exporting them.

```TS
export const PORT = reqd("PORT", port => parseInt(port, 10));
```

If an optional environment variable's transform function always returns a value, it will be inferred as that type.

```TS
// type: string | undefined
export const ENABLE_WEBHOOK = opt("ENABLE_WEBHOOK");

// type: boolean
export const ENABLE_WEBHOOK = opt("ENABLE_WEBHOOK", setting => setting === "true");
```

# Menus

Menus MUST be defined in `src/menus`. If appropriate, one file MAY contain multiple menus.

Menus MUST be registered in `src/main.ts` using the `menus()` function.

Menus MUST be sent using `ctx.sendMenu()`, and MUST NOT be sent using `ctx.menu.nav()` or `ctx.menu.back()`.

Menus MUST be initialized using the `createMenu()` function and NOT using the `StatefulMenu` constructor.

Read [StatefulMenu.md](./plugins/StatefulMenu.md) for more information.

# Dependency Injection

Many modules touch external services, like databases, cache services, thirdparty APIs, filesystem, etc. These services MUST be injected into the modules that need them, allowing them to be mocked in tests.

To simplify the process of injecting dependencies, we use a `BotDependencies` type. This type is a contains all the dependencies that the bot needs. The type is defined in `src/dependencies.ts`.

An implemenentation of `BotDependencies` MUST be constructed in `src/main.ts` and passed into `setup()`. Modules (commands, menus, etc.) that start from `setup()` MUST NOT directly access network, filesystem, or other resources. All external resources MUST be accessed through the dependencies.

It's good practice to pick the exact dependencies that a module needs. In this example, `MyMenu` only needs `myService`. This way, MyMenu can be constructed with only the dependencies it needs.

Take this example:

```TS
export const MyMenu = (deps: Pick<BotDependencies, "myService">) => {
	const { myService } = deps;

	return createMenu("MyMenu")
		.init()
		.headerText(ctx => myService.getHeaderText(ctx.from.id)) // ✅ OK
		.text(...);
};
```

In this example, `MyMenu` may be fully tested without accessing the network by implementing a mock of `myService`.

```TS
const myService = {
	getHeaderText: jest.fn().mockResolvedValue("My Header Text"),
};

const menu = MyMenu({ myService });
```

# Testing

> [!WARNING]
>
> This section is a work in progress.
> We need a way to test menus without going through `MenuRegistry` and strict `sendMenu()` types.

While testing any module, you MAY create a bot instance using the `setup()` function in `src/testutil.ts`. This function returns a `TestSetup` object that contains the following:

- `bot`: The bot instance.
- `defaultUser`: The default user.
- `defaultChat`: The default chat.
- `chats`: An array of chats.
- `spies`: A collection of API method spies.
- `updates`: A collection of update functions.

```TS
const { bot, defaultUser, defaultChat, chats, spies } = setup();

const deps = {
	myService: {
		getHeaderText: spies.BotAPI.getChatMember.mockResolvedValue("My Header Text"),
	},
};

const menu = MyMenu(deps);

bot.use(session());

// TODO(mkr): how to allow menus() to be used in tests without needing to register all menus?
bot.use(menus({ menu }));

bot.command("start", async ctx => {
	await ctx.sendMenu("MyMenu");
});

await updates.message("/start", defaultChat.chat.id);

expect(spies.sendMessage).toHaveBeenCalledWith(defaultChat.chat.id, "My Header Text");
```

# Plugins

Several plugins make life in this project easy. More detailed documentation for each plugin is available in the [docs/plugins](./plugins) directory. See:

- [ensureConsistentWidth](./plugins/EnsureConsistentWidth.md)
- [sendOrEdit](./plugins/SendOrEdit.md)
- [StatefulMenu](./plugins/StatefulMenu.md)

# Principles

- Do not create one line modules.
- Avoid creating junction files (index.ts) that export \* from multiple modules. Prefer to directly import the modules to clearly understand each module's dependencies.

  Avoid this:

  ```TS
  // @file: something/index.ts
  export * from "./xyz.ts"; // ❌ BAD

  // @file: elsewhere.ts
  import { xyz } from "./something";
  ```

  Instead, do this:

  ```TS
  // @file: elsewhere.ts
  import { xyz } from "./something/xyz.ts"; // ✅ GOOD
  ```

- If you have to create a junction file, make sure to export as namespaces.

  Avoid this:

  ```TS
  // @file: something/index.ts
  export * from "./xyz.ts"; // ❌ BAD

  // @file: elsewhere.ts
  import { doXyzThing } from "./something/index.ts";
  ```

  Instead, do this:

  ```TS
  // @file: something/index.ts
  export * as xyz from "./xyz.ts"; // ✅ GOOD

  // @file: elsewhere.ts
  import { xyz } from "./something/index.ts";
  xyz.doXyzThing();
  ```

- Services MUST not take Context or deal with the Bot. They MUST be blind to the Bot, and only accept the parameters they need.
