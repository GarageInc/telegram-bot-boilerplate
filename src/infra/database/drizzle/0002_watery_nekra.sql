-- Set the value to false if database has null values, then alter the column to NOT NULL

UPDATE users
SET password_required_for_transfers = false
WHERE password_required_for_transfers IS NULL;

ALTER TABLE users
ALTER COLUMN password_required_for_transfers SET NOT NULL;
