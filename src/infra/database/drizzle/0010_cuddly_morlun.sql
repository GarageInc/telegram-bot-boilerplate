-- Update all users' BSC fee settings to set buy_fee and sell_fee to 0.1
-- This migration updates the tx_fee_settings JSONB field for all users
-- while preserving existing settings for other networks

UPDATE "bot_settings"
SET "tx_fee_settings" = jsonb_set(
  jsonb_set(
    COALESCE("tx_fee_settings", '{}'::jsonb),
    '{bsc,buy_fee}',
    '0.1'::jsonb,
    true
  ),
  '{bsc,sell_fee}',
  '0.1'::jsonb,
  true
)
WHERE "tx_fee_settings" IS NOT NULL;


-- Update column default to include hyperevm going forward (simple literal)
ALTER TABLE "bot_settings" ALTER COLUMN "tx_fee_settings" SET DEFAULT '{
  "bsc": {"buy_fee": 0.1, "sell_fee": 0.1},
  "base": {"buy_fee": 0.05, "sell_fee": 0.05},
  "sonic": {"buy_fee": 1, "sell_fee": 1},
  "solana": {"buy_fee": 0.003, "buy_tip": 0.001, "sell_fee": 0.003, "sell_tip": 0.001},
  "polygon": {"buy_fee": 1, "sell_fee": 1},
  "arbitrum": {"buy_fee": 0.05, "sell_fee": 0.05},
  "ethereum": {"buy_fee": 2, "sell_fee": 2},
  "avalanche": {"buy_fee": 1.5, "sell_fee": 1.5},
  "berachain": {"buy_fee": 1, "sell_fee": 1},
  "hyperevm": {"buy_fee": 0.5, "sell_fee": 0.5}
}'::jsonb;--> statement-breakpoint
