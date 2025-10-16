-- 1) Drop existing PK (currently on wallet.id = address)
ALTER TABLE wallet DROP CONSTRAINT wallet_pkey;

-- 2) If id column already exists and is varchar = address, drop it
ALTER TABLE wallet DROP COLUMN IF EXISTS id;

-- 3) Add a new UUID column as the primary key
ALTER TABLE wallet ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;

-- 4) Ensure uniqueness is per-user, not global
DROP INDEX IF EXISTS wallet_network_addr_uniq;
CREATE UNIQUE INDEX IF NOT EXISTS wallet_user_network_addr_uniq
  ON wallet (user_id, network, address);

