-- Migration: 007_add_uuid_notion_databases
-- Description: Add UUID and relation column to notion_databases table

-- Step 1: Add UUID column (nullable first)
ALTER TABLE notion_databases ADD COLUMN uuid VARCHAR(36) NULL AFTER id;

-- Step 2: Add collection_uuid column (nullable first)
ALTER TABLE notion_databases ADD COLUMN collection_uuid VARCHAR(36) NULL AFTER collection_id;

-- Step 3: Generate UUIDs for existing records
UPDATE notion_databases SET uuid = UUID() WHERE uuid IS NULL;

-- Step 4: Sync collection_uuid from existing collection records
UPDATE notion_databases nd SET nd.collection_uuid = (SELECT c.uuid FROM collections c WHERE c.id = nd.collection_id LIMIT 1) WHERE nd.collection_uuid IS NULL;

-- Step 5: Make columns NOT NULL now that all have values
ALTER TABLE notion_databases MODIFY COLUMN uuid VARCHAR(36) NOT NULL;
ALTER TABLE notion_databases MODIFY COLUMN collection_uuid VARCHAR(36) NOT NULL;

-- Step 6: Add unique index on uuid
ALTER TABLE notion_databases ADD UNIQUE INDEX idx_notion_databases_uuid (uuid);

-- Step 7: Add index on collection_uuid
ALTER TABLE notion_databases ADD INDEX idx_notion_databases_collection_uuid (collection_uuid);
