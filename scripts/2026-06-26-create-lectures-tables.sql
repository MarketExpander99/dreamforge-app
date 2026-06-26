-- ============================================================
-- LECTURE TABLES MIGRATION (Two-Stage Generation)
-- Run this entire file in Supabase SQL Editor
-- ============================================================
--
-- scripts/2026-06-26-create-lectures-tables.sql
-- Two-Stage Lecture Generation tables (per Developer Spec v1)
--
-- Creates:
--   lectures          — stores the master document + top-level metadata
--   lecture_sections  — ordered progressive sections with scaffolding metadata
--
-- Design notes (v1 scope):
-- - master_content is the full canonical Markdown from Stage 1
-- - sections content is lightly adapted for standalone progressive reading
-- - No changes to existing tables/columns (additive only)
-- - RLS: owner can CRUD their lectures; sections follow via lecture ownership
-- - Optional future: path_id link, published flag, etc.

-- 1. Master lectures table
CREATE TABLE IF NOT EXISTS lectures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  master_content TEXT NOT NULL,           -- Full Stage-1 cohesive lecture (Markdown)
  metadata JSONB DEFAULT '{}'::jsonb,     -- e.g. { "sectionCount": 5, "totalMinutes": 72, "audience": "...", "sourcePathId": "..." }
  path_id UUID,                           -- Optional link to learning_paths.id (or future paths)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Progressive sections (child of lecture)
CREATE TABLE IF NOT EXISTS lecture_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE NOT NULL,
  section_number INTEGER NOT NULL CHECK (section_number > 0),
  title TEXT NOT NULL,
  content TEXT NOT NULL,                  -- Markdown for this section (Stage-2 split)
  key_takeaways JSONB NOT NULL,           -- Array of 3-5 strings stored as JSONB
  estimated_minutes INTEGER NOT NULL DEFAULT 15 CHECK (estimated_minutes > 0),
  prerequisites TEXT NOT NULL DEFAULT 'None',
  reflection_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (lecture_id, section_number)     -- Enforce order uniqueness per lecture
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_lectures_user_id ON lectures(user_id);
CREATE INDEX IF NOT EXISTS idx_lectures_topic ON lectures USING gin (to_tsvector('english', topic));
CREATE INDEX IF NOT EXISTS idx_lecture_sections_lecture ON lecture_sections(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_sections_number ON lecture_sections(lecture_id, section_number);

-- Enable RLS
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_sections ENABLE ROW LEVEL SECURITY;

-- Policies: Users manage only their own lectures
-- (Admins with special email can be granted broader access in application layer or future policy)

-- Use DROP + CREATE for policies because PostgreSQL does not support "CREATE POLICY IF NOT EXISTS"
DROP POLICY IF EXISTS "Users can view their own lectures" ON lectures;
CREATE POLICY "Users can view their own lectures"
  ON lectures FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own lectures" ON lectures;
CREATE POLICY "Users can insert their own lectures"
  ON lectures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own lectures" ON lectures;
CREATE POLICY "Users can update their own lectures"
  ON lectures FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own lectures" ON lectures;
CREATE POLICY "Users can delete their own lectures"
  ON lectures FOR DELETE
  USING (auth.uid() = user_id);

-- Sections: access only through owning lecture (enforced via RLS on lecture + join in queries)
-- Simple owner policy via subselect (secure and common Supabase pattern)
DROP POLICY IF EXISTS "Users can view sections of their lectures" ON lecture_sections;
CREATE POLICY "Users can view sections of their lectures"
  ON lecture_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lectures l
      WHERE l.id = lecture_sections.lecture_id
        AND l.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert sections for their lectures" ON lecture_sections;
CREATE POLICY "Users can insert sections for their lectures"
  ON lecture_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lectures l
      WHERE l.id = lecture_sections.lecture_id
        AND l.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update sections for their lectures" ON lecture_sections;
CREATE POLICY "Users can update sections for their lectures"
  ON lecture_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lectures l
      WHERE l.id = lecture_sections.lecture_id
        AND l.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete sections for their lectures" ON lecture_sections;
CREATE POLICY "Users can delete sections for their lectures"
  ON lecture_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lectures l
      WHERE l.id = lecture_sections.lecture_id
        AND l.user_id = auth.uid()
    )
  );

-- Trigger to keep updated_at fresh on lectures
CREATE OR REPLACE FUNCTION update_lectures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lectures_set_updated_at ON lectures;
CREATE TRIGGER lectures_set_updated_at
  BEFORE UPDATE ON lectures
  FOR EACH ROW
  EXECUTE FUNCTION update_lectures_updated_at();

-- Note:
-- Run the entire contents of this file in the Supabase SQL Editor.
-- It is safe to re-run (uses DROP POLICY IF EXISTS + CREATE POLICY, CREATE TABLE IF NOT EXISTS, etc.).
-- After running, the lectures + lecture_sections tables will be ready (with proper RLS).
-- No existing tables or columns were modified.

-- Quick verification (run after the above)
SELECT 'lectures' AS table_name, COUNT(*) AS row_count FROM information_schema.tables WHERE table_name = 'lectures'
UNION ALL
SELECT 'lecture_sections', COUNT(*) FROM information_schema.tables WHERE table_name = 'lecture_sections';