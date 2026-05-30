-- Migration: 009_add_uuid_users
-- Description: Add UUID column to users table

-- Step 1: Add UUID column (nullable first)
ALTER TABLE users ADD COLUMN uuid VARCHAR(36) NULL AFTER id;

-- Step 2: Generate UUIDs for existing records
UPDATE users SET uuid = UUID() WHERE uuid IS NULL;

-- Step 3: Make column NOT NULL now that all have values
ALTER TABLE users MODIFY COLUMN uuid VARCHAR(36) NOT NULL;

-- Step 4: Add unique index
ALTER TABLE users ADD UNIQUE INDEX idx_users_uuid (uuid);
