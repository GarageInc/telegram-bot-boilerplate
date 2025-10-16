import * as schema from "./schema.ts";

export declare namespace Database {
	export type EnumUsersStatus = (typeof schema.enumUsersStatus.enumValues)[number];
	export type BotSettings = typeof schema.botSettings.$inferSelect;
	export type User = typeof schema.users.$inferSelect;
	export type HiddenToken = typeof schema.hiddenTokens.$inferSelect;
	export type Release = typeof schema.releases.$inferSelect;
	export type Wallet = typeof schema.wallet.$inferSelect;
	export type SequelizeMeta = typeof schema.sequelizeMeta.$inferSelect;
	export type Pnl = typeof schema.pnl.$inferSelect;
	export type PointsMultiplier = typeof schema.pointsMultiplier.$inferSelect;
	export type TradingHistory = typeof schema.tradingHistory.$inferSelect;
	export type TradingHistoryBot = typeof schema.tradingHistoryBot.$inferSelect;
	export type TradingHistoryWebapp = typeof schema.tradingHistoryWebapp.$inferSelect;
	export type TradingStats = typeof schema.tradingStats.$inferSelect;
	export type UsersActivity = typeof schema.usersActivity.$inferSelect;
	export type MessageStore = typeof schema.messageStore.$inferSelect;
	export type ReferrerData = typeof schema.referrerData.$inferSelect;
	export type WalletPair = typeof schema.walletPairs.$inferSelect;
	export type TokenMetadata = typeof schema.tokenMetadata.$inferSelect;
	export type TokenPrice = typeof schema.tokenPrice.$inferSelect;
	export type WalletToken = typeof schema.walletToken.$inferSelect;
	export type UserPosition = typeof schema.userPositions.$inferSelect;

	// Insert types
	export namespace Insert {
		export type Wallet = typeof schema.wallet.$inferInsert;
	}
}
