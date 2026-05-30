-- Migration: 003_add_notion_database_id_to_tasks
-- Description: Add notion_database_id to tasks table

ALTER TABLE tasks ADD COLUMN notion_database_id INT UNSIGNED NULL;
