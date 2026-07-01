-- Phase 2: Extend learning_paths for Save & Manage Personalized Paths
-- Date: 2026-06-29
-- Purpose: Add status, progress (for basic tracking), updated_at without touching any existing columns or data.
-- This table is the one used by Grok path generation (modules JSONB) + discover incremental paths.
-- RLS policies already allow user UPDATE, so no policy changes needed.
-- Run this in Supabase SQL Editor before using save / My Paths features.

ALTER TABLE learning_paths
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'archived'));

ALTER TABLE learning_paths
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0
    CHECK (progress >= 0 AND progress <= 100);

ALTER TABLE learning_paths
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- Ensure trigger function exists (common pattern in this codebase)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach trigger (idempotent)
DROP TRIGGER IF EXISTS update_learning_paths_updated_at ON learning_paths;
CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Backfill updated_at for existing rows (safe, one time)
UPDATE learning_paths SET updated_at = COALESCE(updated_at, created_at) WHERE updated_at IS NULL;

-- Optional: comment for future devs
COMMENT ON COLUMN learning_paths.status IS 'Phase 2: active | completed | archived for saved user paths';
COMMENT ON COLUMN learning_paths.progress IS 'Phase 2: simple 0-100 percentage for basic path progress (no lesson granularity yet)';
COMMENT ON COLUMN learning_paths.modules IS 'Stores GeneratedPath { path: PathStep[], suggestedCourses? } for Grok paths; extensible for Phase 3';