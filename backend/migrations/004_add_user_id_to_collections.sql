-- Migration: 004_add_user_id_to_collections
-- Description: Add user_id to collections table for ownership

ALTER TABLE collections ADD COLUMN user_id INT UNSIGNED NOT NULL DEFAULT 1;
