-- Migration: 008_add_uuid_time_sessions
-- Description: Add UUID and relation column to time_sessions table

-- Step 1: Add UUID column (nullable first)
ALTER TABLE time_sessions ADD COLUMN uuid VARCHAR(36) NULL AFTER id;

-- Step 2: Add task_uuid column (nullable first)
ALTER TABLE time_sessions ADD COLUMN task_uuid VARCHAR(36) NULL AFTER task_id;

-- Step 3: Generate UUIDs for existing records
UPDATE time_sessions SET uuid = UUID() WHERE uuid IS NULL;

-- Step 4: Sync task_uuid from existing task records
UPDATE time_sessions ts SET ts.task_uuid = (SELECT t.uuid FROM tasks t WHERE t.id = ts.task_id LIMIT 1) WHERE ts.task_uuid IS NULL;

-- Step 5: Make columns NOT NULL now that all have values
ALTER TABLE time_sessions MODIFY COLUMN uuid VARCHAR(36) NOT NULL;
ALTER TABLE time_sessions MODIFY COLUMN task_uuid VARCHAR(36) NOT NULL;

-- Step 6: Add unique index on uuid
ALTER TABLE time_sessions ADD UNIQUE INDEX idx_time_sessions_uuid (uuid);

-- Step 7: Add index on task_uuid
ALTER TABLE time_sessions ADD INDEX idx_time_sessions_task_uuid (task_uuid);
