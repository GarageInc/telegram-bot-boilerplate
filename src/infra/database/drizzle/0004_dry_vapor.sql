-- helper functions for triggers to set updated_at automatically

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- table to store token metadata
-- note that this is a relatively long-lived table that is not refreshed often
-- this table does not include price information which has to be more recent

CREATE TABLE "token_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"network" varchar(255) NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"symbol" varchar(255) NOT NULL,
	"decimals" int4 NOT NULL,
	"is_native" boolean NOT NULL DEFAULT FALSE,
	"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "token_metadata_token_address_network_unique" UNIQUE ("token_address", "network")
);

CREATE INDEX "token_metadata_token_address_network"
	ON "token_metadata"
	USING btree ("token_address" text_ops,"network" text_ops);

CREATE TRIGGER "token_metadata_updated_at"
	BEFORE UPDATE ON "token_metadata"
	FOR EACH ROW
	EXECUTE FUNCTION "public"."update_timestamp"();
