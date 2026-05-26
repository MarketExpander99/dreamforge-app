-- Adaptive Learning Engine Migration
-- Adds proficiency JSONB field to profiles table for tracking user skill levels

-- Add proficiency column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS proficiency JSONB DEFAULT '{}'::jsonb;

-- Add comment to document the proficiency system
COMMENT ON COLUMN profiles.proficiency IS 'JSON object tracking user proficiency levels by topic (e.g., {"grade_3_math": 82, "grade_3_science": 65}). Values range from 0-100.';

-- Create index for better query performance on proficiency data
CREATE INDEX IF NOT EXISTS idx_profiles_proficiency ON profiles USING GIN (proficiency);

-- Update RLS policies to allow users to read their own proficiency data
-- (Existing policies should already allow this since they allow full profile access)

-- Optional: Add a function to calculate average proficiency for a grade
CREATE OR REPLACE FUNCTION calculate_grade_proficiency(user_id UUID, grade_level TEXT)
RETURNS INTEGER AS $$
DECLARE
  prof_data JSONB;
  grade_topics TEXT[];
  total_score INTEGER := 0;
  topic_count INTEGER := 0;
  topic_key TEXT;
  topic_score INTEGER;
BEGIN
  -- Get user's proficiency data
  SELECT proficiency INTO prof_data
  FROM profiles
  WHERE id = user_id;

  IF prof_data IS NULL THEN
    RETURN 0;
  END IF;

  -- Find all topics for this grade
  FOR topic_key IN SELECT jsonb_object_keys(prof_data)
  LOOP
    IF topic_key LIKE grade_level || '_%' THEN
      topic_score := (prof_data->>topic_key)::INTEGER;
      total_score := total_score + topic_score;
      topic_count := topic_count + 1;
    END IF;
  END LOOP;

  -- Return average or 0 if no topics found
  IF topic_count = 0 THEN
    RETURN 0;
  ELSE
    RETURN (total_score / topic_count)::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for the helper function
COMMENT ON FUNCTION calculate_grade_proficiency(UUID, TEXT) IS 'Calculates average proficiency score for all topics in a given grade level.';