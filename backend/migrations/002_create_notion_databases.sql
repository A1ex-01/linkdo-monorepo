-- Migration: 002_create_notion_databases
-- Description: Add user_id to collections table (notion_databases created by GORM AutoMigrate)

ALTER TABLE collections ADD COLUMN user_id INT UNSIGNED NOT NULL DEFAULT 1;
