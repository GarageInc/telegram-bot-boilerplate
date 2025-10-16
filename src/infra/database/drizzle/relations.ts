import { relations } from "drizzle-orm/relations";
import { users, hiddenTokens, walletPairs, wallet, walletToken, userPositions, tradingHistoryBot } from "./schema";

export const hiddenTokensRelations = relations(hiddenTokens, ({one}) => ({
	user: one(users, {
		fields: [hiddenTokens.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	hiddenTokens: many(hiddenTokens),
	walletPairs: many(walletPairs),
	wallets: many(wallet),
	walletTokens: many(walletToken),
	userPositions: many(userPositions),
}));

export const walletPairsRelations = relations(walletPairs, ({one, many}) => ({
	user: one(users, {
		fields: [walletPairs.userId],
		references: [users.id]
	}),
	wallets: many(wallet),
}));

export const walletRelations = relations(wallet, ({one}) => ({
	user: one(users, {
		fields: [wallet.userId],
		references: [users.id]
	}),
	walletPair: one(walletPairs, {
		fields: [wallet.pairId],
		references: [walletPairs.id]
	}),
}));

export const walletTokenRelations = relations(walletToken, ({one}) => ({
	user: one(users, {
		fields: [walletToken.userId],
		references: [users.id]
	}),
}));

export const userPositionsRelations = relations(userPositions, ({one}) => ({
	user: one(users, {
		fields: [userPositions.userId],
		references: [users.id]
	}),
	tradingHistoryBot: one(tradingHistoryBot, {
		fields: [userPositions.initialTrade],
		references: [tradingHistoryBot.id]
	}),
}));

export const tradingHistoryBotRelations = relations(tradingHistoryBot, ({many}) => ({
	userPositions: many(userPositions),
}));