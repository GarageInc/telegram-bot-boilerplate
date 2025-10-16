-- Ensure UUID gen is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint

DO $$
BEGIN
  -- createdAt -> created_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE "wallet" RENAME COLUMN "createdAt" TO "created_at";
  END IF;

  -- updatedAt -> updated_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "wallet" RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;
END$$;--> statement-breakpoint


CREATE TABLE IF NOT EXISTS "wallet_pairs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar(255) NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "label" varchar(255) NOT NULL DEFAULT 'W1',
  "meta" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz
);--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_pairs_user_fkey'
  ) THEN
    ALTER TABLE "wallet_pairs"
      ADD CONSTRAINT "wallet_pairs_user_fkey"
      FOREIGN KEY ("user_id") REFERENCES public.users(id)
      ON UPDATE CASCADE ON DELETE CASCADE;

  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_pairs_user_fkey'
  ) THEN
    ALTER TABLE "wallet_pairs"
      ADD CONSTRAINT "wallet_pairs_user_fkey"
      FOREIGN KEY ("user_id") REFERENCES auth.users(id)
      ON UPDATE CASCADE ON DELETE CASCADE;

  ELSE
    RAISE NOTICE 'Skipping FK wallet_pairs.user_id: users table not found (public/auth). Add later.';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'FK wallet_pairs_user_fkey already exists, skipping.';
END$$;--> statement-breakpoint

-- Indexes on wallet_pairs
CREATE INDEX IF NOT EXISTS "wallet_pairs_user_idx" ON "wallet_pairs" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_pairs_user_label_uniq" ON "wallet_pairs" ("user_id","label");--> statement-breakpoint


ALTER TABLE "wallet" ADD COLUMN IF NOT EXISTS "pair_id" uuid;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_pair_id_fkey'
  ) THEN
    ALTER TABLE "wallet"
      ADD CONSTRAINT "wallet_pair_id_fkey"
      FOREIGN KEY ("pair_id") REFERENCES "wallet_pairs"("id")
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END$$;--> statement-breakpoint


CREATE INDEX IF NOT EXISTS "wallet_user_idx" ON "wallet" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_user_pair_idx" ON "wallet" ("user_id","pair_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_pair_network_uniq" ON "wallet" ("pair_id","network");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_user_network_addr_uniq" ON "wallet" ("user_id","network","address");--> statement-breakpoint


DROP INDEX IF EXISTS "wallet_user_label_idx";--> statement-breakpoint
ALTER TABLE "wallet" DROP COLUMN IF EXISTS "toggled";--> statement-breakpoint
ALTER TABLE "wallet" DROP COLUMN IF EXISTS "label";--> statement-breakpoint
