import { pgTable, varchar, integer, text, timestamp, jsonb, boolean, uuid, bigint, doublePrecision, serial, date, smallint, unique, index, foreignKey, uniqueIndex, numeric, pgView, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const enumUsersStatus = pgEnum("enum_users_status", ['IDLE', 'SUCCESS'])


export const messageStore = pgTable("MessageStore", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	messageId: integer("message_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	origin: varchar({ length: 50 }).notNull(),
	text: text().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
});

export const sequelizeMeta = pgTable("SequelizeMeta", {
	name: varchar({ length: 255 }).primaryKey().notNull(),
});

export const botSettings = pgTable("bot_settings", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	chainsEnabled: jsonb("chains_enabled").default({"bsc":false,"base":true,"sonic":false,"solana":true,"polygon":false,"arbitrum":false,"ethereum":true,"hyperevm":true,"avalanche":false,"berachain":false}).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	presets: jsonb().default({"bsc":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"base":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"sonic":{"fixed":[10,25,50,75,100],"percent":[10,25,50,75,100]},"solana":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"polygon":{"fixed":[100,200,300,400,500],"percent":[10,25,50,75,100]},"arbitrum":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"ethereum":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"hyperevm":{"fixed":[0.1,0.5,1,2,3],"percent":[10,25,50,75,100]},"avalanche":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"berachain":{"fixed":[1,2.5,5,7.5,10],"percent":[10,25,50,75,100]}}),
	slippageSettings: jsonb("slippage_settings").default({"bsc":0.5,"base":0.5,"sonic":0.5,"solana":5,"polygon":0.5,"arbitrum":0.5,"ethereum":0.5,"hyperevm":0.5,"avalanche":0.5,"berachain":0.5}).notNull(),
	autoSlippageSettings: jsonb("auto_slippage_settings").default({"bsc":false,"base":false,"sonic":false,"solana":false,"polygon":false,"arbitrum":false,"ethereum":false,"avalanche":false,"berachain":false}).notNull(),
	txFeeSettings: jsonb("tx_fee_settings").default({"bsc":{"buy_fee":0.1,"sell_fee":0.1},"base":{"buy_fee":0.05,"sell_fee":0.05},"sonic":{"buy_fee":1,"sell_fee":1},"solana":{"buy_fee":0.003,"buy_tip":0.001,"sell_fee":0.003,"sell_tip":0.001},"polygon":{"buy_fee":1,"sell_fee":1},"arbitrum":{"buy_fee":0.05,"sell_fee":0.05},"ethereum":{"buy_fee":2,"sell_fee":2},"hyperevm":{"buy_fee":0.5,"sell_fee":0.5},"avalanche":{"buy_fee":1.5,"sell_fee":1.5},"berachain":{"buy_fee":1,"sell_fee":1}}).notNull(),
	degenModeSettings: boolean("degen_mode_settings").default(false).notNull(),
});

export const pnl = pgTable("pnl", {
	id: uuid().primaryKey().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	tokenAddress: varchar({ length: 255 }).notNull(),
	network: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	usdValue: bigint({ mode: "number" }).default(0).notNull(),
	action: varchar({ length: 255 }).notNull(),
	avgEntry: doublePrecision().notNull(),
	totalQuantitySold: doublePrecision(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
});

export const pointsMultiplier = pgTable("points_multiplier", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	multiplier: doublePrecision().notNull(),
	startDate: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	endDate: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
});

export const releases = pgTable("releases", {
	id: serial().primaryKey().notNull(),
	tagName: varchar("tag_name", { length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	body: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
});

export const tradingHistory = pgTable("trading_history", {
	id: uuid().primaryKey().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	date: date().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	arbitrumVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	baseVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ethereumVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	solanaVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	berachainVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	bscVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sonicVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avalancheVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalVolume: bigint({ mode: "number" }).default(0).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
});

export const tradingHistoryWebapp = pgTable("trading_history_webapp", {
	id: uuid().primaryKey().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	srcTokenAddress: varchar({ length: 64 }).notNull(),
	srcTokenSymbol: varchar({ length: 64 }).notNull(),
	srcTokenDecimals: smallint().notNull(),
	srcNetwork: varchar({ length: 16 }).notNull(),
	srcAmount: varchar({ length: 255 }).notNull(),
	destTokenAddress: varchar({ length: 64 }).notNull(),
	destTokenSymbol: varchar({ length: 64 }).notNull(),
	destTokenDecimals: smallint().notNull(),
	destNetwork: varchar({ length: 16 }).notNull(),
	destAmount: varchar({ length: 255 }).notNull(),
	feeTokenAddress: varchar({ length: 64 }).notNull(),
	feeAmount: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	feeAmountUsd: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	swapAmountUsd: bigint({ mode: "number" }).notNull(),
	swapPlacementTimestamp: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	swapExecutionTimestamp: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	txHash: varchar({ length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	srcTokenPriceUsd: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	destTokenPriceUsd: bigint({ mode: "number" }).default(0).notNull(),
});

export const tradingStats = pgTable("trading_stats", {
	id: uuid().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	arbitrumSwaps: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	berachainSwaps: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	bscSwaps: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sonicSwaps: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avalancheSwaps: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	baseSwaps: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ethereumSwaps: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	solanaSwaps: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	lifetimeSwaps: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	arbitrumVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	berachainVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	bscVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sonicVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avalancheVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	baseVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ethereumVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	solanaVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	lifetimeVolume: bigint({ mode: "number" }).default(0).notNull(),
	lifetimeUsers: integer().default(0).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
});

export const usersActivity = pgTable("users_activity", {
	id: serial().primaryKey().notNull(),
	date: date().notNull(),
	dau: integer().notNull(),
	wau: integer(),
	mau: integer(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	unique("users_activity_date_key").on(table.date),
]);

export const usersAnalytics = pgTable("users_analytics", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	arbitrumVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	berachainVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	bscVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sonicVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avalancheVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	baseVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ethereumVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	solanaVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fee: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	referralsVolume: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	referralsFee: bigint({ mode: "number" }).default(0).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
});

export const users = pgTable("users", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	defaultAddressEvm: varchar("default_address_evm", { length: 255 }),
	defaultAddressSolana: varchar("default_address_solana", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	whitelistedAccess: boolean("whitelisted_access"),
	newFeatureAccess: boolean("new_feature_access"),
	username: varchar({ length: 255 }),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	email: varchar({ length: 255 }),
	subOrganizationId: varchar("sub_organization_id", { length: 255 }),
	subUserId: varchar("sub_user_id", { length: 255 }),
	status: enumUsersStatus().default('IDLE'),
	subOrgKey: varchar("sub_org_key", { length: 255 }),
	lastTimeActive: timestamp("last_time_active", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	referrerId: varchar({ length: 255 }),
	slippageSettings: jsonb("slippage_settings").default({"base":0.5,"solana":1,"arbitrum":0.5,"ethereum":0.5}).notNull(),
	gasSettings: jsonb("gas_settings").default({"base":1.2,"solana":0.001,"arbitrum":1.2,"ethereum":1.2}).notNull(),
	appVersion: varchar("app_version", { length: 255 }).default('1.0.0'),
	refCode: varchar("ref_code", { length: 255 }),
	notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
	referralsEnabled: boolean("referrals_enabled").default(false).notNull(),
	jitoTipSolana: doublePrecision("jito_tip_solana").default(sql`'0.002'`),
	passwordHash: varchar("password_hash", { length: 255 }),
	passwordRequiredForTransfers: boolean("password_required_for_transfers").default(false).notNull(),
}, (table) => [
	unique("users_ref_code_key").on(table.refCode),
]);

export const hiddenTokens = pgTable("hidden_tokens", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	tokenAddress: varchar("token_address", { length: 255 }).notNull(),
	symbol: varchar({ length: 255 }).notNull(),
	network: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("hidden_tokens_token_address_network").using("btree", table.tokenAddress.asc().nullsLast().op("text_ops"), table.network.asc().nullsLast().op("text_ops")),
	index("hidden_tokens_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "hidden_tokens_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const walletPairs = pgTable("wallet_pairs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	label: varchar({ length: 255 }).default('W1').notNull(),
	meta: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("wallet_pairs_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("wallet_pairs_user_label_uniq").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.label.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wallet_pairs_user_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const tokenMetadata = pgTable("token_metadata", {
	id: serial().primaryKey().notNull(),
	network: varchar({ length: 255 }).notNull(),
	tokenAddress: varchar("token_address", { length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	symbol: varchar({ length: 255 }).notNull(),
	decimals: integer().notNull(),
	isNative: boolean("is_native").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	circulatingSupply: numeric("circulating_supply", { precision: 40, scale:  0 }).default('0').notNull(),
	liquidity: numeric({ precision: 40, scale:  0 }).default('0').notNull(),
}, (table) => [
	index("token_metadata_token_address_network").using("btree", table.tokenAddress.asc().nullsLast().op("text_ops"), table.network.asc().nullsLast().op("text_ops")),
	unique("token_metadata_token_address_network_unique").on(table.network, table.tokenAddress),
]);

export const wallet = pgTable("wallet", {
	userId: varchar("user_id", { length: 255 }).notNull(),
	network: varchar({ length: 255 }).notNull(),
	publicKey: varchar("public_key", { length: 255 }).notNull(),
	address: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	pairId: uuid("pair_id"),
	id: uuid().defaultRandom().primaryKey().notNull(),
}, (table) => [
	uniqueIndex("wallet_pair_network_uniq").using("btree", table.pairId.asc().nullsLast().op("text_ops"), table.network.asc().nullsLast().op("uuid_ops")),
	index("wallet_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("wallet_user_network_addr_uniq").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.network.asc().nullsLast().op("text_ops"), table.address.asc().nullsLast().op("text_ops")),
	index("wallet_user_pair_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.pairId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wallet_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.pairId],
			foreignColumns: [walletPairs.id],
			name: "wallet_pair_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const tokenPrice = pgTable("token_price", {
	id: serial().primaryKey().notNull(),
	tokenAddress: varchar("token_address", { length: 255 }).notNull(),
	network: varchar({ length: 255 }).notNull(),
	isNative: boolean("is_native").default(false).notNull(),
	priceUsd: numeric("price_usd", { precision: 36, scale:  18 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("token_price_token_address_network").using("btree", table.tokenAddress.asc().nullsLast().op("text_ops"), table.network.asc().nullsLast().op("text_ops")),
	unique("token_price_token_address_network_unique").on(table.tokenAddress, table.network),
]);

export const walletToken = pgTable("wallet_token", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	walletAddress: varchar("wallet_address", { length: 255 }).notNull(),
	network: varchar({ length: 255 }).notNull(),
	tokenAddress: varchar("token_address", { length: 255 }).notNull(),
	balance: numeric({ precision: 40, scale:  0 }).default('0').notNull(),
	isNative: boolean("is_native").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("wallet_token_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("wallet_token_wallet_address_network").using("btree", table.walletAddress.asc().nullsLast().op("text_ops"), table.network.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wallet_token_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("wallet_token_user_wallet_network_token_unique").on(table.userId, table.walletAddress, table.network, table.tokenAddress),
]);

export const userPositions = pgTable("user_positions", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	wallet: varchar({ length: 255 }).notNull(),
	initialTrade: integer("initial_trade").default(0),
	tokenAddress: varchar("token_address", { length: 255 }).notNull(),
	network: integer().default(0).notNull(),
	totalTokensOwned: varchar("total_tokens_owned", { length: 255 }).default('0').notNull(),
	totalTokensBought: varchar("total_tokens_bought", { length: 255 }).default('0').notNull(),
	totalTokensSold: varchar("total_tokens_sold", { length: 255 }).default('0').notNull(),
	totalUsdSpent: integer("total_usd_spent").default(0).notNull(),
	totalUsdCosts: integer("total_usd_costs").default(0).notNull(),
	totalUsdSales: integer("total_usd_sales").default(0).notNull(),
	initialUsdPrice: integer("initial_usd_price").default(0).notNull(),
	lastUsdPrice: integer("last_usd_price").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("positions_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "positions_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.initialTrade],
			foreignColumns: [tradingHistoryBot.id],
			name: "positions_trading_fkey"
		}).onUpdate("cascade"),
]);

export const tradingHistoryBot = pgTable("trading_history_bot", {
	id: serial().primaryKey().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	srcTokenAddress: varchar({ length: 64 }).notNull(),
	srcTokenSymbol: varchar({ length: 64 }).notNull(),
	srcTokenDecimals: smallint().notNull(),
	srcNetwork: integer().default(0).notNull(),
	srcAmount: varchar({ length: 255 }).notNull(),
	destTokenAddress: varchar({ length: 64 }).notNull(),
	destTokenSymbol: varchar({ length: 64 }).notNull(),
	destTokenDecimals: smallint().notNull(),
	destNetwork: integer().default(0).notNull(),
	destAmount: varchar({ length: 255 }).notNull(),
	feeTokenAddress: varchar({ length: 64 }).notNull(),
	feeAmount: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	feeAmountUsd: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	swapAmountUsd: bigint({ mode: "number" }).notNull(),
	swapPlacementTimestamp: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	swapExecutionTimestamp: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	txHash: varchar({ length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	srcTokenPriceUsd: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	destTokenPriceUsd: bigint({ mode: "number" }).default(0).notNull(),
	wallet: varchar({ length: 255 }).default("").notNull(),
}, (table) => [
	index("idx_trading_history_bot_dest_token_network").using("btree", table.destTokenAddress.asc().nullsLast().op("text_ops"), table.destNetwork.asc().nullsLast().op("int4_ops")),
	index("idx_trading_history_bot_src_token_network").using("btree", table.srcTokenAddress.asc().nullsLast().op("text_ops"), table.srcNetwork.asc().nullsLast().op("text_ops")),
	index("idx_trading_history_bot_user_dest_token_network").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.destTokenAddress.asc().nullsLast().op("int4_ops"), table.destNetwork.asc().nullsLast().op("text_ops")),
	index("idx_trading_history_bot_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("idx_trading_history_bot_user_src_token_network").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.srcTokenAddress.asc().nullsLast().op("text_ops"), table.srcNetwork.asc().nullsLast().op("text_ops")),
	index("trading_history_bot_dest_token_address_dest_network").using("btree", table.destTokenAddress.asc().nullsLast().op("int4_ops"), table.destNetwork.asc().nullsLast().op("text_ops")),
	index("trading_history_bot_src_token_address_src_network").using("btree", table.srcTokenAddress.asc().nullsLast().op("text_ops"), table.srcNetwork.asc().nullsLast().op("text_ops")),
	index("trading_history_bot_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("trading_history_bot_user_id_dest_token_address_dest_network").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.destTokenAddress.asc().nullsLast().op("text_ops"), table.destNetwork.asc().nullsLast().op("text_ops")),
	index("trading_history_bot_user_id_src_token_address_src_network").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.srcTokenAddress.asc().nullsLast().op("int4_ops"), table.srcNetwork.asc().nullsLast().op("int4_ops")),
]);
export const referrerData = pgView("ReferrerData", {	id: varchar({ length: 255 }),
	username: varchar({ length: 255 }),
	referrerId: varchar({ length: 255 }),
	defaultAddressEthereum: varchar("default_address_ethereum", { length: 255 }),
	defaultAddressSolana: varchar("default_address_solana", { length: 255 }),
	referralsEnabled: boolean("referrals_enabled"),
}).as(sql`SELECT users.id, users.username, users."referrerId", users.default_address_evm AS default_address_ethereum, users.default_address_solana, users.referrals_enabled FROM users`);

export const usersNonSensitive = pgView("users_non_sensitive", {	id: varchar({ length: 255 }),
	defaultAddressEvm: varchar("default_address_evm", { length: 255 }),
	defaultAddressSolana: varchar("default_address_solana", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	whitelistedAccess: boolean("whitelisted_access"),
	newFeatureAccess: boolean("new_feature_access"),
	username: varchar({ length: 255 }),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }),
	email: varchar({ length: 255 }),
	status: enumUsersStatus(),
	lastTimeActive: timestamp("last_time_active", { withTimezone: true, mode: 'string' }),
	referrerId: varchar({ length: 255 }),
	slippageSettings: jsonb("slippage_settings"),
	gasSettings: jsonb("gas_settings"),
	appVersion: varchar("app_version", { length: 255 }),
	refCode: varchar("ref_code", { length: 255 }),
	notificationsEnabled: boolean("notifications_enabled"),
	referralsEnabled: boolean("referrals_enabled"),
	jitoTipSolana: doublePrecision("jito_tip_solana"),
}).as(sql`SELECT users.id, users.default_address_evm, users.default_address_solana, users.created_at, users.whitelisted_access, users.new_feature_access, users.username, users."updatedAt", users.email, users.status, users.last_time_active, users."referrerId", users.slippage_settings, users.gas_settings, users.app_version, users.ref_code, users.notifications_enabled, users.referrals_enabled, users.jito_tip_solana FROM users`);
