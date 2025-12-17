-- Drop notes table and related objects
-- This migration removes all notes functionality from the database

-- Drop triggers first
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
DROP TRIGGER IF EXISTS update_project_last_modified_on_notes_change ON notes;

-- Drop indexes
DROP INDEX IF EXISTS idx_notes_project_id;
DROP INDEX IF EXISTS idx_notes_user_id;
DROP INDEX IF EXISTS idx_notes_order;

-- Drop the notes table
DROP TABLE IF EXISTS notes;
