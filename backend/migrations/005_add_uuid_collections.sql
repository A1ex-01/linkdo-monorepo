-- Migration: 005_add_uuid_collections
-- Description: Add UUID column to collections table

-- Step 1: Add UUID column (nullable first)
ALTER TABLE collections ADD COLUMN uuid VARCHAR(36) NULL AFTER id;

-- Step 2: Generate UUIDs for existing records
UPDATE collections SET uuid = UUID() WHERE uuid IS NULL;

-- Step 3: Make column NOT NULL now that all have values
ALTER TABLE collections MODIFY COLUMN uuid VARCHAR(36) NOT NULL;

-- Step 4: Add unique index
ALTER TABLE collections ADD UNIQUE INDEX idx_collections_uuid (uuid);
