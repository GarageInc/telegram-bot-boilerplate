-- Change trading history table for more sensible field types.

-- UUID have several downsides, and there is no need for anything but a serial integer ID on this table.
ALTER TABLE trading_history_bot DROP COLUMN IF EXISTS id;
ALTER TABLE trading_history_bot ADD COLUMN id serial PRIMARY KEY NOT NULL;

-- We store chain IDs on transaction, so they can be numbers.
ALTER TABLE trading_history_bot
ALTER COLUMN "srcNetwork" TYPE integer USING (
	CASE
		WHEN "srcNetwork" = 'ethereum' THEN 1
		WHEN "srcNetwork" = 'base' THEN 8453
		WHEN "srcNetwork" = 'arbitrum' THEN 42161
		WHEN "srcNetwork" = 'berachain' THEN 80094
		WHEN "srcNetwork" = 'bsc' THEN 56
		WHEN "srcNetwork" = 'solana' THEN 7565164
		WHEN "srcNetwork" = 'sonic' THEN 146
		WHEN "srcNetwork" = 'avalanche' THEN 43114
		WHEN "srcNetwork" = 'polygon' THEN 137
		WHEN "srcNetwork" = 'hyperevm' THEN 999
		WHEN "srcNetwork" IS NULL OR "srcNetwork" = '' THEN 0
		ELSE 0
	END
),
ALTER COLUMN "srcNetwork" SET DEFAULT 0,
ALTER COLUMN "srcNetwork" SET NOT NULL,
ALTER COLUMN "destNetwork" TYPE integer USING (
	CASE
		WHEN "destNetwork" = 'ethereum' THEN 1
		WHEN "destNetwork" = 'base' THEN 8453
		WHEN "destNetwork" = 'arbitrum' THEN 42161
		WHEN "destNetwork" = 'berachain' THEN 80094
		WHEN "destNetwork" = 'bsc' THEN 56
		WHEN "destNetwork" = 'solana' THEN 7565164
		WHEN "destNetwork" = 'sonic' THEN 146
		WHEN "destNetwork" = 'avalanche' THEN 43114
		WHEN "destNetwork" = 'polygon' THEN 137
		WHEN "destNetwork" = 'hyperevm' THEN 999
		WHEN "destNetwork" IS NULL OR "destNetwork" = '' THEN 0
		ELSE 0
	END
),
ALTER COLUMN "destNetwork" SET DEFAULT 0,
ALTER COLUMN "destNetwork" SET NOT NULL,
ADD COLUMN wallet VARCHAR(255) NOT NULL DEFAULT '';
