# sendOrEdit

## [source](../../src/plugins/sendOrEditMethod.ts)

This plugin allows us to use `ctx.sendOrEdit()` when we want to send a message or edit the last message. This plugin depends on session, so it has to be mounted after session. We never directly use `ctx.sendOrEdit()`, since it's used internally by [StatefulMenu](./StatefulMenu.md)'s `ctx.sendMenu()`. But it may be useful to understand how it works.

## Usage

```TS
bot.use(installSendOrEditMethod());
```

## How it works

This plugin adds two methods to Context: `ctx.sendOrEdit()` and `ctx.sendOrEditPhoto()`.

Under the hood, they use normal methods such as `ctx.reply()`, `ctx.editMessageText()`, and `ctx.replyWithPhoto()`.

The first time `ctx.sendOrEdit()` is called, it will send a new message and store the message id in `ctx.session.lastMessageId` (and set `ctx.session.lastMessageType` to "text"). The next time `ctx.sendOrEdit()` is called, it will edit the last message. If an error is thrown while editing, it will attempt to send a new message instead and delete the last message.

If in any case, we want to force sending a new message, we can pass `skipEdit: true` to `ctx.sendOrEdit()` or `ctx.sendOrEditPhoto()`. This will prevent the plugin from attempting to edit the last message.

If in the unlikely scenario that we don't want to delete the last message, we can pass `skipDelete: true` to `ctx.sendOrEdit()`. This will prevent the plugin from deleting the last message.

When `skipEdit` and `skipDelete` are both true, `ctx.sendOrEdit()` will behave like `ctx.reply()`, ignoring the last message.

Additionally, whenever either method is called, the plugin will also delete the incoming message. `skipDelete` will also prevent this from happening.

`ctx.sendOrEditPhoto()` is similar to `ctx.sendOrEdit()`, but it will always send a new photo and delete the last message. This is the only way to consistently edit photo, caption, and reply_markup at once. Otherwise we'd have to call editMessageMedia, editMessageCaption and handle errors appropriately.

Additionally, when the `lastMessageType` changes from "text" to "photo" or vice-versa, the plugin will also delete the last message.

None of the deletions are waited for, but their errors are caught and ignored. This allows the bot to move faster and not block on the deletion.

Finally, although this plugin does several carefully orchestrated steps, care has been taken to keep the code as simple to read as possible. The core logic for each method is kept under ~40 lines.
