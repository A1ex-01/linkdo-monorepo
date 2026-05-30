-- Migration: 001_rename_notion_page_id
-- Description: Rename notion_page_id to notion_database_id in collections table

ALTER TABLE collections CHANGE notion_page_id notion_database_id VARCHAR(255);
