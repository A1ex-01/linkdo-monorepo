-- Migration: 006_add_uuid_tasks
-- Description: Add UUID and relation columns to tasks table

-- Step 1: Add UUID column (nullable first)
ALTER TABLE tasks ADD COLUMN uuid VARCHAR(36) NULL AFTER id;

-- Step 2: Add relation columns (nullable first)
ALTER TABLE tasks ADD COLUMN collection_uuid VARCHAR(36) NULL AFTER collection_id;
ALTER TABLE tasks ADD COLUMN notion_database_uuid VARCHAR(36) NULL AFTER notion_database_id;

-- Step 3: Generate UUIDs for existing records
UPDATE tasks SET uuid = UUID() WHERE uuid IS NULL;

-- Step 4: Sync collection_uuid from existing collection records
UPDATE tasks t SET t.collection_uuid = (SELECT c.uuid FROM collections c WHERE c.id = t.collection_id LIMIT 1) WHERE t.collection_uuid IS NULL;

-- Step 5: Sync notion_database_uuid from existing notion_database records
UPDATE tasks t SET t.notion_database_uuid = (SELECT nd.uuid FROM notion_databases nd WHERE nd.id = t.notion_database_id LIMIT 1) WHERE t.notion_database_uuid IS NULL;

-- Step 6: Make columns NOT NULL now that all have values
ALTER TABLE tasks MODIFY COLUMN uuid VARCHAR(36) NOT NULL;
ALTER TABLE tasks MODIFY COLUMN collection_uuid VARCHAR(36) NOT NULL;

-- Step 7: Add unique index on uuid
ALTER TABLE tasks ADD UNIQUE INDEX idx_tasks_uuid (uuid);

-- Step 8: Add indexes on relation columns
ALTER TABLE tasks ADD INDEX idx_tasks_collection_uuid (collection_uuid);
ALTER TABLE tasks ADD INDEX idx_tasks_notion_database_uuid (notion_database_uuid);
