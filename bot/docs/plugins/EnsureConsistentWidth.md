# ensureConsistentWidth

## [[source]](../../src/plugins/ensureConsistentWidth.ts)

This is a [grammY Transformer](https://grammy.dev/advanced/transformers) that intercepts calls to `sendMessage` or `editMessageText`, and pads the message with whitespace and ZWNJ (Zero-Width Non-Joiner) to prevent the spaces from being trimmed.

At the moment, it is deemed unnecessary for photo messages, and this transformer is not applied to them.

This forces Telegram to render all our messages and menus at a consistent (maximum) width. It's a hands-off experience. Once enabled, doesn't ever have to be touched anywhere else in the bot.

## Usage

```TS
bot.api.config.use(ensureConsistentWidth());
```
