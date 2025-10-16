CREATE TABLE "wallet_token" (
	"id" serial PRIMARY KEY NOT NULL,
	-- if a user is deleted, we'll delete all their wallet tokens
	"user_id" varchar(255) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
	"wallet_address" varchar(255) NOT NULL,
	"network" varchar(255) NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"balance" numeric(40, 0) NOT NULL DEFAULT 0,
	"is_native" boolean NOT NULL DEFAULT FALSE,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "wallet_token_user_wallet_network_token_unique" UNIQUE ("user_id", "wallet_address", "network", "token_address")
);

CREATE INDEX "wallet_token_user_id"
	ON "wallet_token"
	USING btree ("user_id" text_ops);

CREATE INDEX "wallet_token_wallet_address_network"
	ON "wallet_token"
	USING btree ("wallet_address" text_ops,"network" text_ops);

CREATE TRIGGER "wallet_token_updated_at"
	BEFORE UPDATE ON "wallet_token"
	FOR EACH ROW
	EXECUTE FUNCTION "public"."update_timestamp"();
