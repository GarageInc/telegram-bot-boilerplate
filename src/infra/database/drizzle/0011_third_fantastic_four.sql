-- Table that keeps track of positions as they are
-- This is an entity derived from bot transactions, but may contain data acquired elsewhere as well.
CREATE TABLE "user_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" VARCHAR(255) NOT NULL,
	"wallet" VARCHAR(255) NOT NULL,
	"initial_trade" integer DEFAULT 0,
	"token_address" VARCHAR(255) NOT NULL,
	"network" integer NOT NULL DEFAULT 0,
	"total_tokens_owned" VARCHAR(255) NOT NULL DEFAULT '0',
	"total_tokens_bought" VARCHAR(255) NOT NULL DEFAULT '0',
	"total_tokens_sold" VARCHAR(255) NOT NULL DEFAULT '0',
	"total_usd_spent" integer NOT NULL DEFAULT 0,
	"total_usd_costs" integer NOT NULL DEFAULT 0,
	"total_usd_sales" integer NOT NULL DEFAULT 0,
	"initial_usd_price" integer NOT NULL DEFAULT 0,
	"last_usd_price" integer NOT NULL DEFAULT 0,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone DEFAULT NULL,
	CONSTRAINT "positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade,
	CONSTRAINT "positions_trading_fkey" FOREIGN KEY ("initial_trade") REFERENCES "public"."trading_history_bot"("id") ON UPDATE cascade
);

CREATE INDEX "positions_user_id" ON "user_positions" USING btree ("user_id" text_ops);
