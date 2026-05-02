-- Database Migration Script
-- This script updates the existing database schema to fix the UUID/TEXT mismatch
-- Run this in Supabase SQL Editor to migrate existing data safely

-- ===========================================
-- MIGRATION: Change content_items.id from UUID to TEXT
-- ===========================================

-- Step 1: Drop existing foreign key constraints that reference content_items.id
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_content_id_fkey;
ALTER TABLE user_bookmarks DROP CONSTRAINT IF EXISTS user_bookmarks_content_id_fkey;

-- Step 2: Drop existing policies that might conflict
DROP POLICY IF EXISTS "Anyone can view published content" ON content_items;
DROP POLICY IF EXISTS "Allow seeding content items" ON content_items;
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON user_bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON user_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON user_bookmarks;

-- Step 3: Handle existing data conversion
-- First, check if there are any existing records
DO $$
DECLARE
    content_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO content_count FROM content_items;

    IF content_count > 0 THEN
        -- If there are existing records, we need to handle the conversion carefully
        -- Convert UUIDs to their string representation
        ALTER TABLE content_items ALTER COLUMN id TYPE TEXT USING id::TEXT;
    ELSE
        -- If no data exists, just change the type
        ALTER TABLE content_items ALTER COLUMN id TYPE TEXT;
    END IF;
END $$;

-- Step 4: Recreate foreign key constraints with TEXT references
ALTER TABLE user_progress ALTER COLUMN content_id TYPE TEXT;
ALTER TABLE user_bookmarks ALTER COLUMN content_id TYPE TEXT;

ALTER TABLE user_progress ADD CONSTRAINT user_progress_content_id_fkey
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE;

ALTER TABLE user_bookmarks ADD CONSTRAINT user_bookmarks_content_id_fkey
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE;

-- Step 5: Recreate RLS policies
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Content items policies
CREATE POLICY "Anyone can view published content" ON content_items
  FOR SELECT USING (is_published = true);

CREATE POLICY "Allow seeding content items" ON content_items
  FOR ALL USING (true);

-- User progress policies
CREATE POLICY "Users can view their own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- User bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON user_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" ON user_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON user_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- VERIFICATION: Check that migration was successful
-- ===========================================

-- Check content_items table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'content_items' AND column_name = 'id';

-- Check foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name = 'user_progress' OR tc.table_name = 'user_bookmarks')
  AND kcu.column_name = 'content_id';

-- Check sample data
SELECT COUNT(*) as content_count FROM content_items;
SELECT COUNT(*) as progress_count FROM user_progress;
SELECT COUNT(*) as bookmarks_count FROM user_bookmarks;

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================

-- You can now run your seeding scripts with string IDs like 'multiplication-basics'