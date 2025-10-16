-- add circulating supply to token metadata and multiply by token_price.price_usd to get market_cap_usd
ALTER TABLE "token_metadata" ADD COLUMN "circulating_supply" numeric(40, 0) NOT NULL DEFAULT 0;
ALTER TABLE "token_metadata" ADD COLUMN "liquidity" numeric(40, 0) NOT NULL DEFAULT 0;

ALTER TABLE "token_metadata" ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE "token_metadata" ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE;

-- token_price is a separate table only because it needs a different refresh schedule than token_metadata
CREATE TABLE "token_price" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"network" varchar(255) NOT NULL,
	"is_native" boolean NOT NULL DEFAULT FALSE,
	"price_usd" numeric(36, 18) NOT NULL,
	"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "token_price_token_address_network_unique" UNIQUE ("token_address", "network")
);

CREATE INDEX "token_price_token_address_network"
	ON "token_price"
	USING btree ("token_address" text_ops,"network" text_ops);

CREATE TRIGGER "token_price_updated_at"
	BEFORE UPDATE ON "token_price"
	FOR EACH ROW
	EXECUTE FUNCTION "public"."update_timestamp"();
