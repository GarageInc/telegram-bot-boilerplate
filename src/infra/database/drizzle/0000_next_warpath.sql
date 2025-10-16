-- This sql file was generated with drizzle-kit introspect
-- This is the base truth generated from the old bot's database

CREATE TYPE "public"."enum_users_status" AS ENUM('IDLE', 'SUCCESS');--> statement-breakpoint
CREATE TABLE "MessageStore" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"origin" varchar(50) NOT NULL,
	"text" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hidden_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"symbol" varchar(255) NOT NULL,
	"network" varchar(255) NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "SequelizeMeta" (
	"name" varchar(255) PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_settings" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"chains_enabled" jsonb DEFAULT '{"bsc":true,"base":true,"sonic":true,"solana":true,"polygon":true,"arbitrum":true,"ethereum":true,"avalanche":true,"berachain":true}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"presets" jsonb DEFAULT '{"bsc":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"base":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"sonic":{"fixed":[10,25,50,75,100],"percent":[10,25,50,75,100]},"solana":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"polygon":{"fixed":[100,200,300,400,500],"percent":[10,25,50,75,100]},"arbitrum":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"ethereum":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"avalanche":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"berachain":{"fixed":[1,2.5,5,7.5,10],"percent":[10,25,50,75,100]}}'::jsonb,
	"slippage_settings" jsonb DEFAULT '{"bsc":0.5,"base":0.5,"sonic":0.5,"solana":5,"polygon":0.5,"arbitrum":0.5,"ethereum":0.5,"avalanche":0.5,"berachain":0.5}'::jsonb NOT NULL,
	"auto_slippage_settings" jsonb DEFAULT '{"bsc":false,"base":false,"sonic":false,"solana":false,"polygon":false,"arbitrum":false,"ethereum":false,"avalanche":false,"berachain":false}'::jsonb NOT NULL,
	"tx_fee_settings" jsonb DEFAULT '{"bsc":{"buy_fee":1.4,"sell_fee":1.4},"base":{"buy_fee":1.4,"sell_fee":1.4},"sonic":{"buy_fee":1.4,"sell_fee":1.4},"solana":{"buy_fee":0.003,"buy_tip":0.001,"sell_fee":0.003,"sell_tip":0.001},"polygon":{"buy_fee":1.4,"sell_fee":1.4},"arbitrum":{"buy_fee":1.4,"sell_fee":1.4},"ethereum":{"buy_fee":1.4,"sell_fee":1.4},"avalanche":{"buy_fee":1.4,"sell_fee":1.4},"berachain":{"buy_fee":1.4,"sell_fee":1.4}}'::jsonb NOT NULL,
	"degen_mode_settings" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"network" varchar(255) NOT NULL,
	"public_key" varchar(255) NOT NULL,
	"address" varchar(255) NOT NULL,
	"label" varchar(255) DEFAULT 'W1' NOT NULL,
	"created_at" timestamp with time zone,
	"updatedAt" timestamp with time zone NOT NULL,
	"toggled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pnl" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"tokenAddress" varchar(255) NOT NULL,
	"network" varchar(255) NOT NULL,
	"usdValue" bigint DEFAULT 0 NOT NULL,
	"action" varchar(255) NOT NULL,
	"avgEntry" double precision NOT NULL,
	"totalQuantitySold" double precision,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_multiplier" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"multiplier" double precision NOT NULL,
	"startDate" timestamp with time zone NOT NULL,
	"endDate" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_name" varchar(255) NOT NULL,
	"name" varchar(255),
	"body" text,
	"created_at" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trading_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"arbitrumVolume" bigint DEFAULT 0 NOT NULL,
	"baseVolume" bigint DEFAULT 0 NOT NULL,
	"ethereumVolume" bigint DEFAULT 0 NOT NULL,
	"solanaVolume" bigint DEFAULT 0 NOT NULL,
	"berachainVolume" bigint DEFAULT 0 NOT NULL,
	"bscVolume" bigint DEFAULT 0 NOT NULL,
	"sonicVolume" bigint DEFAULT 0 NOT NULL,
	"avalancheVolume" bigint DEFAULT 0 NOT NULL,
	"totalVolume" bigint DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trading_history_bot" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"srcTokenAddress" varchar(64) NOT NULL,
	"srcTokenSymbol" varchar(64) NOT NULL,
	"srcTokenDecimals" smallint NOT NULL,
	"srcNetwork" varchar(16) NOT NULL,
	"srcAmount" varchar(255) NOT NULL,
	"destTokenAddress" varchar(64) NOT NULL,
	"destTokenSymbol" varchar(64) NOT NULL,
	"destTokenDecimals" smallint NOT NULL,
	"destNetwork" varchar(16) NOT NULL,
	"destAmount" varchar(255) NOT NULL,
	"feeTokenAddress" varchar(64) NOT NULL,
	"feeAmount" varchar(255) NOT NULL,
	"feeAmountUsd" bigint NOT NULL,
	"swapAmountUsd" bigint NOT NULL,
	"swapPlacementTimestamp" timestamp with time zone NOT NULL,
	"swapExecutionTimestamp" timestamp with time zone NOT NULL,
	"txHash" varchar(255),
	"srcTokenPriceUsd" bigint DEFAULT 0 NOT NULL,
	"destTokenPriceUsd" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trading_history_webapp" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"srcTokenAddress" varchar(64) NOT NULL,
	"srcTokenSymbol" varchar(64) NOT NULL,
	"srcTokenDecimals" smallint NOT NULL,
	"srcNetwork" varchar(16) NOT NULL,
	"srcAmount" varchar(255) NOT NULL,
	"destTokenAddress" varchar(64) NOT NULL,
	"destTokenSymbol" varchar(64) NOT NULL,
	"destTokenDecimals" smallint NOT NULL,
	"destNetwork" varchar(16) NOT NULL,
	"destAmount" varchar(255) NOT NULL,
	"feeTokenAddress" varchar(64) NOT NULL,
	"feeAmount" varchar(255) NOT NULL,
	"feeAmountUsd" bigint NOT NULL,
	"swapAmountUsd" bigint NOT NULL,
	"swapPlacementTimestamp" timestamp with time zone NOT NULL,
	"swapExecutionTimestamp" timestamp with time zone NOT NULL,
	"txHash" varchar(255),
	"srcTokenPriceUsd" bigint DEFAULT 0 NOT NULL,
	"destTokenPriceUsd" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trading_stats" (
	"id" uuid PRIMARY KEY NOT NULL,
	"arbitrumSwaps" bigint DEFAULT 0 NOT NULL,
	"berachainSwaps" bigint DEFAULT 0 NOT NULL,
	"bscSwaps" bigint DEFAULT 0 NOT NULL,
	"sonicSwaps" bigint DEFAULT 0 NOT NULL,
	"avalancheSwaps" bigint DEFAULT 0 NOT NULL,
	"baseSwaps" bigint DEFAULT 0 NOT NULL,
	"ethereumSwaps" bigint DEFAULT 0 NOT NULL,
	"solanaSwaps" bigint DEFAULT 0 NOT NULL,
	"lifetimeSwaps" bigint DEFAULT 0 NOT NULL,
	"arbitrumVolume" bigint DEFAULT 0 NOT NULL,
	"berachainVolume" bigint DEFAULT 0 NOT NULL,
	"bscVolume" bigint DEFAULT 0 NOT NULL,
	"sonicVolume" bigint DEFAULT 0 NOT NULL,
	"avalancheVolume" bigint DEFAULT 0 NOT NULL,
	"baseVolume" bigint DEFAULT 0 NOT NULL,
	"ethereumVolume" bigint DEFAULT 0 NOT NULL,
	"solanaVolume" bigint DEFAULT 0 NOT NULL,
	"lifetimeVolume" bigint DEFAULT 0 NOT NULL,
	"lifetimeUsers" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"dau" integer NOT NULL,
	"wau" integer,
	"mau" integer,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "users_activity_date_key" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "users_analytics" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"arbitrumVolume" bigint DEFAULT 0 NOT NULL,
	"berachainVolume" bigint DEFAULT 0 NOT NULL,
	"bscVolume" bigint DEFAULT 0 NOT NULL,
	"sonicVolume" bigint DEFAULT 0 NOT NULL,
	"avalancheVolume" bigint DEFAULT 0 NOT NULL,
	"baseVolume" bigint DEFAULT 0 NOT NULL,
	"ethereumVolume" bigint DEFAULT 0 NOT NULL,
	"solanaVolume" bigint DEFAULT 0 NOT NULL,
	"totalVolume" bigint DEFAULT 0 NOT NULL,
	"fee" bigint DEFAULT 0 NOT NULL,
	"referralsVolume" bigint DEFAULT 0 NOT NULL,
	"referralsFee" bigint DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"default_address_evm" varchar(255),
	"default_address_solana" varchar(255),
	"created_at" timestamp with time zone,
	"whitelisted_access" boolean,
	"new_feature_access" boolean,
	"username" varchar(255),
	"updatedAt" timestamp with time zone NOT NULL,
	"email" varchar(255),
	"sub_organization_id" varchar(255),
	"sub_user_id" varchar(255),
	"status" "enum_users_status" DEFAULT 'IDLE',
	"sub_org_key" varchar(255),
	"last_time_active" timestamp with time zone DEFAULT now() NOT NULL,
	"referrerId" varchar(255),
	"slippage_settings" jsonb DEFAULT '{"base":0.5,"solana":1,"arbitrum":0.5,"ethereum":0.5}'::jsonb NOT NULL,
	"gas_settings" jsonb DEFAULT '{"base":1.2,"solana":0.001,"arbitrum":1.2,"ethereum":1.2}'::jsonb NOT NULL,
	"app_version" varchar(255) DEFAULT '1.0.0',
	"ref_code" varchar(255),
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"referrals_enabled" boolean DEFAULT false NOT NULL,
	"jito_tip_solana" double precision DEFAULT '0.002',
	"password_hash" varchar(255),
	"password_required_for_transfers" boolean DEFAULT false,
	CONSTRAINT "users_ref_code_key" UNIQUE("ref_code")
);
--> statement-breakpoint
ALTER TABLE "hidden_tokens" ADD CONSTRAINT "hidden_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "hidden_tokens_token_address_network" ON "hidden_tokens" USING btree ("token_address" text_ops,"network" text_ops);--> statement-breakpoint
CREATE INDEX "hidden_tokens_user_id" ON "hidden_tokens" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trading_history_bot_dest_token_network" ON "trading_history_bot" USING btree ("destTokenAddress" text_ops,"destNetwork" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trading_history_bot_src_token_network" ON "trading_history_bot" USING btree ("srcTokenAddress" text_ops,"srcNetwork" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trading_history_bot_user_dest_token_network" ON "trading_history_bot" USING btree ("userId" text_ops,"destTokenAddress" text_ops,"destNetwork" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trading_history_bot_user_id" ON "trading_history_bot" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trading_history_bot_user_src_token_network" ON "trading_history_bot" USING btree ("userId" text_ops,"srcTokenAddress" text_ops,"srcNetwork" text_ops);--> statement-breakpoint
CREATE INDEX "trading_history_bot_dest_token_address_dest_network" ON "trading_history_bot" USING btree ("destTokenAddress" text_ops,"destNetwork" text_ops);--> statement-breakpoint
CREATE INDEX "trading_history_bot_src_token_address_src_network" ON "trading_history_bot" USING btree ("srcTokenAddress" text_ops,"srcNetwork" text_ops);--> statement-breakpoint
CREATE INDEX "trading_history_bot_user_id" ON "trading_history_bot" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "trading_history_bot_user_id_dest_token_address_dest_network" ON "trading_history_bot" USING btree ("userId" text_ops,"destTokenAddress" text_ops,"destNetwork" text_ops);--> statement-breakpoint
CREATE INDEX "trading_history_bot_user_id_src_token_address_src_network" ON "trading_history_bot" USING btree ("userId" text_ops,"srcTokenAddress" text_ops,"srcNetwork" text_ops);--> statement-breakpoint
CREATE VIEW "public"."ReferrerData" AS (SELECT users.id, users.username, users."referrerId", users.default_address_evm AS default_address_ethereum, users.default_address_solana, users.referrals_enabled FROM users);--> statement-breakpoint
CREATE VIEW "public"."users_non_sensitive" AS (SELECT users.id, users.default_address_evm, users.default_address_solana, users.created_at, users.whitelisted_access, users.new_feature_access, users.username, users."updatedAt", users.email, users.status, users.last_time_active, users."referrerId", users.slippage_settings, users.gas_settings, users.app_version, users.ref_code, users.notifications_enabled, users.referrals_enabled, users.jito_tip_solana FROM users);
