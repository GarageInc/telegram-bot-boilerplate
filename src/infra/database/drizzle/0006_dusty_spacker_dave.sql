-- Add hyperevm defaults to tx_fee_settings for existing rows (idempotent)
-- Set hyperevm fees on existing rows
UPDATE "bot_settings"
SET "tx_fee_settings" = jsonb_set(
  COALESCE("tx_fee_settings", '{}'::jsonb),
  '{hyperevm}',
  '{"buy_fee":0.5,"sell_fee":0.5}'::jsonb,
  true
);--> statement-breakpoint

-- Update column default to include hyperevm going forward (simple literal)
ALTER TABLE "bot_settings" ALTER COLUMN "tx_fee_settings" SET DEFAULT '{
  "bsc": {"buy_fee": 2, "sell_fee": 2},
  "base": {"buy_fee": 0.3, "sell_fee": 0.3},
  "sonic": {"buy_fee": 1, "sell_fee": 1},
  "solana": {"buy_fee": 0.003, "buy_tip": 0.001, "sell_fee": 0.003, "sell_tip": 0.001},
  "polygon": {"buy_fee": 1, "sell_fee": 1},
  "arbitrum": {"buy_fee": 0.1, "sell_fee": 0.1},
  "ethereum": {"buy_fee": 2, "sell_fee": 2},
  "avalanche": {"buy_fee": 1.5, "sell_fee": 1.5},
  "berachain": {"buy_fee": 1, "sell_fee": 1},
  "hyperevm": {"buy_fee": 0.5, "sell_fee": 0.5}
}'::jsonb;--> statement-breakpoint
