# Adding a new menu

### 1. Create the new menu file in `src/menus`

We'll call the new Menu "NewMenu" in this guide. Choose a name suitable for your menu.

```bash
cd src/menus
touch NewMenu.ts
```

### 2. Export the new menu from `src/menus/index.ts`

```ts
// @file: src/menus/index.ts
export * from "./NewMenu.ts";
```

### 3. Register the new menu into MenuRegistry

```ts
// @file: src/menus/NewMenu.ts
declare module "../plugins/StatefulMenu.ts" {
	interface MenuRegistry {
		NewMenu: null;
	}
}
```

### 4. Create the new menu

Accept dependencies as a parameter and return a new menu. It's important to use `createMenu` to create the menu.

```ts
// @file: src/menus/NewMenu.ts
import type { BotDependencies } from "../dependencies.ts";

// to use specific dependencies, use `Pick<BotDependencies, "someDependency">`
export const NewMenu = (_deps: BotDependencies) => {
	return createMenu("NewMenu")
		.init<MyContext>()
		.headerText("New Menu")
		.text("Back to Start", async ctx => {
			await ctx.sendMenu("ExistingUserStart");
		});
};
```

For more information on the Menu API, see the [StatefulMenu](../plugins/StatefulMenu.md) plugin docs.

### 5. Register the new menu in `main.ts`

```TS
// @file: main.ts

bot.use(menus({
	// ... other menus
	NewMenu: NewMenu(deps),
}));
```

### 5. To navigate to our new menu from somewhere else (for instance from another menu's handler), use `ctx.sendMenu`

```TS
// @file: src/menus/SomeMenu.ts

export const SomeMenu = (deps: BotDependencies) => {
	return createMenu("SomeMenu")
		.init<MyContext>()
		.headerText("Some Menu")
		.text("New Menu", async ctx => {
			await ctx.sendMenu("NewMenu");
		});
};
```
