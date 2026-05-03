-- Curriculum and Lesson Planning Database Schema
-- Extends the existing DreamForge schema for structured educational content

-- Create curriculums table
CREATE TABLE IF NOT EXISTS curriculums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- e.g., "CAPS", "IEB", "Cambridge"
  country TEXT NOT NULL, -- e.g., "South Africa", "UK"
  description TEXT,
  grade_levels TEXT[] NOT NULL, -- e.g., ["Grade 1", "Grade 2", "Grade 3"]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum_id UUID REFERENCES curriculums(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Mathematics", "English", "Science"
  description TEXT,
  icon TEXT,
  color TEXT,
  grade_levels TEXT[] NOT NULL, -- Which grades this subject applies to
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(curriculum_id, name)
);

-- Create learning_objectives table
CREATE TABLE IF NOT EXISTS learning_objectives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  grade_level TEXT NOT NULL,
  code TEXT NOT NULL, -- e.g., "LO1", "LO2"
  description TEXT NOT NULL,
  strand TEXT, -- e.g., "Numbers", "Operations", "Space and Shape"
  assessment_type TEXT, -- e.g., "formative", "summative"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(subject_id, grade_level, code)
);

-- Create lesson_plans table
CREATE TABLE IF NOT EXISTS lesson_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  grade_level TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL, -- Total lesson duration
  sequence_order INTEGER, -- For ordering within a unit/term
  unit_title TEXT, -- e.g., "Addition and Subtraction"
  term TEXT, -- e.g., "Term 1", "Term 2"
  week INTEGER, -- Week within the term
  learning_objectives UUID[] REFERENCES learning_objectives(id), -- Array of objective IDs
  prerequisites UUID[], -- Array of prerequisite lesson IDs
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create lesson_content table (links lessons to content items)
CREATE TABLE IF NOT EXISTS lesson_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_plan_id UUID REFERENCES lesson_plans(id) ON DELETE CASCADE,
  content_id TEXT REFERENCES content_items(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL, -- Order within the lesson
  content_type TEXT NOT NULL CHECK (content_type IN ('introduction', 'main_activity', 'practice', 'assessment', 'extension')),
  is_required BOOLEAN DEFAULT true,
  estimated_duration INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(lesson_plan_id, content_id)
);

-- Create grade_assessments table
CREATE TABLE IF NOT EXISTS grade_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  curriculum_id UUID REFERENCES curriculums(id),
  assessed_grade TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  assessment_data JSONB, -- Store detailed assessment results
  assessment_method TEXT NOT NULL CHECK (assessment_method IN ('ai_assessment', 'manual', 'parent_input')),
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, curriculum_id)
);

-- Create learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  curriculum_id UUID REFERENCES curriculums(id),
  subject_id UUID REFERENCES subjects(id),
  current_grade TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_lessons UUID[], -- Array of completed lesson IDs
  current_lesson UUID REFERENCES lesson_plans(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, curriculum_id, subject_id)
);

-- Create assessment_questions table for grade assessment
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum_id UUID REFERENCES curriculums(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'text_input', 'voice_input')),
  question TEXT NOT NULL,
  options TEXT[], -- For multiple choice questions
  correct_answer TEXT, -- For multiple choice, or expected keywords for text
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('easy', 'intermediate', 'hard')),
  points INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view curriculums" ON curriculums FOR SELECT USING (true);
CREATE POLICY "Anyone can view subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can view learning objectives" ON learning_objectives FOR SELECT USING (true);
CREATE POLICY "Anyone can view lesson plans" ON lesson_plans FOR SELECT USING (true);
CREATE POLICY "Anyone can view lesson content" ON lesson_content FOR SELECT USING (true);
CREATE POLICY "Anyone can view assessment questions" ON assessment_questions FOR SELECT USING (true);

CREATE POLICY "Users can view their own grade assessments" ON grade_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own grade assessments" ON grade_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own grade assessments" ON grade_assessments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own learning paths" ON learning_paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own learning paths" ON learning_paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own learning paths" ON learning_paths FOR UPDATE USING (auth.uid() = user_id);

-- Update triggers for updated_at
CREATE TRIGGER update_curriculums_updated_at BEFORE UPDATE ON curriculums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_objectives_updated_at BEFORE UPDATE ON learning_objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lesson_plans_updated_at BEFORE UPDATE ON lesson_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert CAPS curriculum data
INSERT INTO curriculums (name, country, description, grade_levels) VALUES
  ('CAPS', 'South Africa', 'Curriculum and Assessment Policy Statement - South African national curriculum', ARRAY['Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'])
ON CONFLICT (name) DO NOTHING;

-- Insert CAPS subjects
INSERT INTO subjects (curriculum_id, name, description, icon, color, grade_levels) VALUES
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'Mathematics', 'Numbers, operations, patterns, relationships, and algebraic thinking', '🔢', 'red', ARRAY['Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'English', 'Language development, reading, writing, and communication skills', '📚', 'blue', ARRAY['Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'Science', 'Natural sciences, physical sciences, and scientific inquiry', '🔬', 'green', ARRAY['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'Social Sciences', 'History, geography, and social studies', '🌍', 'orange', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'Life Skills', 'Personal development, physical education, and creative arts', '🎨', 'purple', ARRAY['Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'])
ON CONFLICT (curriculum_id, name) DO NOTHING;

-- Sample learning objectives for Grade 3 Mathematics
INSERT INTO learning_objectives (subject_id, grade_level, code, description, strand) VALUES
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 3', 'LO1', 'Numbers, Operations and Relationships', 'Numbers'),
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 3', 'LO2', 'Patterns, Functions and Algebra', 'Patterns'),
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 3', 'LO3', 'Space and Shape (Geometry)', 'Geometry'),
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 3', 'LO4', 'Measurement', 'Measurement'),
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 3', 'LO5', 'Data Handling', 'Statistics')
ON CONFLICT (subject_id, grade_level, code) DO NOTHING;

-- Sample assessment questions for grade assessment
INSERT INTO assessment_questions (curriculum_id, subject, grade_level, question_type, question, options, correct_answer, difficulty) VALUES
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'Mathematics', 'Grade 3', 'multiple_choice', 'What is 15 + 27?', ARRAY['42', '32', '52', '62'], '42', 'intermediate'),
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'Mathematics', 'Grade 3', 'multiple_choice', 'Which shape has 4 equal sides and 4 right angles?', ARRAY['Circle', 'Triangle', 'Square', 'Rectangle'], 'Square', 'easy'),
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'English', 'Grade 3', 'text_input', 'Write a sentence using the word "beautiful".', NULL, 'beautiful', 'easy'),
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'Science', 'Grade 3', 'multiple_choice', 'What do plants need to make their own food?', ARRAY['Sunlight, water, and air', 'Only water', 'Only sunlight', 'Soil only'], 'Sunlight, water, and air', 'intermediate')
ON CONFLICT DO NOTHING;

-- Functions for curriculum management
CREATE OR REPLACE FUNCTION get_user_recommended_grade(
  user_id_param UUID,
  curriculum_name TEXT DEFAULT 'CAPS'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recommended_grade TEXT;
BEGIN
  SELECT assessed_grade INTO recommended_grade
  FROM grade_assessments ga
  JOIN curriculums c ON ga.curriculum_id = c.id
  WHERE ga.user_id = user_id_param AND c.name = curriculum_name
  ORDER BY ga.assessed_at DESC
  LIMIT 1;

  RETURN COALESCE(recommended_grade, 'Grade 3'); -- Default fallback
END;
$$;

CREATE OR REPLACE FUNCTION get_lesson_plan_progress(
  user_id_param UUID,
  lesson_plan_id_param UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_content INTEGER;
  completed_content INTEGER;
BEGIN
  -- Count total content items in the lesson
  SELECT COUNT(*) INTO total_content
  FROM lesson_content
  WHERE lesson_plan_id = lesson_plan_id_param;

  -- Count completed content items for this user
  SELECT COUNT(*) INTO completed_content
  FROM lesson_content lc
  JOIN user_progress up ON lc.content_id = up.content_id
  WHERE lc.lesson_plan_id = lesson_plan_id_param
    AND up.user_id = user_id_param
    AND up.status = 'completed';

  -- Return percentage
  IF total_content = 0 THEN
    RETURN 0;
  ELSE
    RETURN ROUND((completed_content::DECIMAL / total_content::DECIMAL) * 100)::INTEGER;
  END IF;
END;
$$;