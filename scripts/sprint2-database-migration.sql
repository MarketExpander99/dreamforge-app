-- ===========================================
-- SPRINT 2 DATABASE MIGRATION SCRIPT
-- ===========================================
-- This script updates the database from Phase 1 to Sprint 2 state
-- Run this after applying the base schema (supabase-schema.sql)
-- ===========================================

-- ===========================================
-- PHASE 1 → SPRINT 2 MIGRATIONS
-- ===========================================

-- 1. Update profiles table to support teacher role
-- ===========================================
-- First, drop the existing check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add teacher role to the check constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('parent', 'student', 'teacher'));

-- Add teacher onboarding tracking column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS teacher_onboarding_completed BOOLEAN DEFAULT false;

-- Update the handle_new_user function to handle teacher role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Determine role based on metadata or default to student
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    CASE
      WHEN NEW.email LIKE '%teacher%' OR NEW.email LIKE '%@school%' THEN 'teacher'
      ELSE 'student'
    END
  );

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    user_role,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      CASE
        WHEN user_role = 'teacher' THEN 'Teacher'
        ELSE 'Student'
      END
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create email notifications table
-- ===========================================
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('teacher-to-student', 'teacher-to-parent', 'weekly-progress')),
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on email notifications
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email notifications
DROP POLICY IF EXISTS "Users can view their own email notifications" ON email_notifications;
DROP POLICY IF EXISTS "Service role can insert email notifications" ON email_notifications;

CREATE POLICY "Users can view their own email notifications"
  ON email_notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Service role can insert email notifications"
  ON email_notifications FOR INSERT
  WITH CHECK (true);

-- 3. Create curriculum-related tables (if missing)
-- ===========================================
CREATE TABLE IF NOT EXISTS curriculum_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(code, grade_level)
);

CREATE TABLE IF NOT EXISTS curriculum_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  lesson_number INTEGER NOT NULL,
  objectives TEXT[],
  resources JSONB DEFAULT '{}',
  assessment JSONB DEFAULT '{}',
  duration_minutes INTEGER DEFAULT 45,
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS curriculum_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES curriculum_lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of possible answers
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  question_type TEXT DEFAULT 'multiple-choice' CHECK (question_type IN ('multiple-choice', 'true-false', 'short-answer')),
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for assessment_questions to support ON CONFLICT
-- First check if it exists and drop if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assessment_questions_unique_question'
  ) THEN
    ALTER TABLE assessment_questions DROP CONSTRAINT assessment_questions_unique_question;
  END IF;
END $$;

-- Add unique constraint on curriculum, grade, subject, and question
ALTER TABLE assessment_questions
ADD CONSTRAINT assessment_questions_unique_question
UNIQUE (curriculum_id, grade_level, subject, question);

-- 4. Create teacher-specific tables
-- ===========================================
CREATE TABLE IF NOT EXISTS teacher_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  class_code TEXT NOT NULL UNIQUE,
  description TEXT,
  max_students INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{
    "allow_self_enrollment": true,
    "send_progress_reports": true,
    "enable_gamification": true,
    "require_parent_approval": false
  }',
  learning_goals TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES teacher_classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
  UNIQUE(class_id, student_id)
);

CREATE TABLE IF NOT EXISTS teacher_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES teacher_classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lesson', 'quiz', 'assignment', 'resource')),
  subject TEXT,
  grade_level TEXT,
  tags TEXT[],
  media_urls JSONB DEFAULT '{}',
  quiz_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS on new tables
-- ===========================================
ALTER TABLE curriculum_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_content ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for curriculum tables (public read for published content)
-- ===========================================
DROP POLICY IF EXISTS "Anyone can view curriculum subjects" ON curriculum_subjects;
DROP POLICY IF EXISTS "Anyone can view curriculum lessons" ON curriculum_lessons;
DROP POLICY IF EXISTS "Anyone can view curriculum assessments" ON curriculum_assessments;

CREATE POLICY "Anyone can view curriculum subjects"
  ON curriculum_subjects FOR SELECT USING (true);

CREATE POLICY "Anyone can view curriculum lessons"
  ON curriculum_lessons FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view curriculum assessments"
  ON curriculum_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM curriculum_lessons cl
      WHERE cl.id = curriculum_assessments.lesson_id
      AND cl.is_active = true
    )
  );

-- 7. RLS Policies for teacher tables
-- ===========================================
DROP POLICY IF EXISTS "Teachers can view their own classes" ON teacher_classes;
DROP POLICY IF EXISTS "Teachers can create their own classes" ON teacher_classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON teacher_classes;
DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON teacher_classes;

CREATE POLICY "Teachers can view their own classes"
  ON teacher_classes FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own classes"
  ON teacher_classes FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own classes"
  ON teacher_classes FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view classes they're enrolled in"
  ON teacher_classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      WHERE cs.class_id = teacher_classes.id
      AND cs.student_id = auth.uid()
      AND cs.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Students can view their class enrollments" ON class_students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON class_students;
DROP POLICY IF EXISTS "Teachers can manage class enrollments" ON class_students;

CREATE POLICY "Students can view their class enrollments"
  ON class_students FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view students in their classes"
  ON class_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_classes tc
      WHERE tc.id = class_students.class_id
      AND tc.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage class enrollments"
  ON class_students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teacher_classes tc
      WHERE tc.id = class_students.class_id
      AND tc.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can view their own content" ON teacher_content;
DROP POLICY IF EXISTS "Teachers can create content" ON teacher_content;
DROP POLICY IF EXISTS "Teachers can update their own content" ON teacher_content;
DROP POLICY IF EXISTS "Students can view published content from their classes" ON teacher_content;

CREATE POLICY "Teachers can view their own content"
  ON teacher_content FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create content"
  ON teacher_content FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own content"
  ON teacher_content FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view published content from their classes"
  ON teacher_content FOR SELECT
  USING (
    is_published = true AND (
      class_id IS NULL OR
      EXISTS (
        SELECT 1 FROM class_students cs
        WHERE cs.class_id = teacher_content.class_id
        AND cs.student_id = auth.uid()
        AND cs.status = 'active'
      )
    )
  );

-- 8. Add updated_at triggers for new tables
-- ===========================================
DROP TRIGGER IF EXISTS update_curriculum_lessons_updated_at ON curriculum_lessons;
DROP TRIGGER IF EXISTS update_teacher_classes_updated_at ON teacher_classes;
DROP TRIGGER IF EXISTS update_teacher_content_updated_at ON teacher_content;

CREATE TRIGGER update_curriculum_lessons_updated_at
  BEFORE UPDATE ON curriculum_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_classes_updated_at
  BEFORE UPDATE ON teacher_classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_content_updated_at
  BEFORE UPDATE ON teacher_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert CAPS curriculum subjects (South African curriculum)
-- ===========================================
INSERT INTO curriculum_subjects (name, code, grade_level, description) VALUES
-- Grade 1-3 subjects
('Mathematics', 'MATH', 'grade-1', 'Numbers, Operations and Relationships'),
('Mathematics', 'MATH', 'grade-2', 'Numbers, Operations and Relationships'),
('Mathematics', 'MATH', 'grade-3', 'Numbers, Operations and Relationships'),
('English Home Language', 'ENG-HL', 'grade-1', 'Language structures and conventions'),
('English Home Language', 'ENG-HL', 'grade-2', 'Language structures and conventions'),
('English Home Language', 'ENG-HL', 'grade-3', 'Language structures and conventions'),
('Natural Sciences', 'NAT-SCI', 'grade-1', 'Life and Living, Earth and Beyond'),
('Natural Sciences', 'NAT-SCI', 'grade-2', 'Life and Living, Earth and Beyond'),
('Natural Sciences', 'NAT-SCI', 'grade-3', 'Life and Living, Earth and Beyond'),

-- Grade 4-9 subjects (expanded)
('Mathematics', 'MATH', 'grade-4', 'Numbers, Operations and Relationships'),
('Mathematics', 'MATH', 'grade-5', 'Numbers, Operations and Relationships'),
('Mathematics', 'MATH', 'grade-6', 'Numbers, Operations and Relationships'),
('Mathematics', 'MATH', 'grade-7', 'Numbers, Operations and Relationships'),
('Mathematics', 'MATH', 'grade-8', 'Numbers, Operations and Relationships'),
('Mathematics', 'MATH', 'grade-9', 'Numbers, Operations and Relationships'),
('Natural Sciences', 'NAT-SCI', 'grade-4', 'Life and Living, Matter and Materials'),
('Natural Sciences', 'NAT-SCI', 'grade-5', 'Life and Living, Matter and Materials'),
('Natural Sciences', 'NAT-SCI', 'grade-6', 'Life and Living, Matter and Materials'),
('Natural Sciences', 'NAT-SCI', 'grade-7', 'Life and Living, Matter and Materials'),
('Natural Sciences', 'NAT-SCI', 'grade-8', 'Life and Living, Matter and Materials'),
('Natural Sciences', 'NAT-SCI', 'grade-9', 'Life and Living, Matter and Materials'),
('English Home Language', 'ENG-HL', 'grade-4', 'Language structures and conventions'),
('English Home Language', 'ENG-HL', 'grade-5', 'Language structures and conventions'),
('English Home Language', 'ENG-HL', 'grade-6', 'Language structures and conventions'),
('English Home Language', 'ENG-HL', 'grade-7', 'Language structures and conventions'),
('English Home Language', 'ENG-HL', 'grade-8', 'Language structures and conventions'),
('English Home Language', 'ENG-HL', 'grade-9', 'Language structures and conventions'),

-- Grade 10-12 subjects
('Mathematics', 'MATH', 'grade-10', 'Patterns, Functions and Algebra'),
('Mathematics', 'MATH', 'grade-11', 'Patterns, Functions and Algebra'),
('Mathematics', 'MATH', 'grade-12', 'Patterns, Functions and Algebra'),
('Physical Sciences', 'PHY-SCI', 'grade-10', 'Matter and Materials, Chemical Change'),
('Physical Sciences', 'PHY-SCI', 'grade-11', 'Chemical Change, Energy and Change'),
('Physical Sciences', 'PHY-SCI', 'grade-12', 'Energy and Change, Global Challenges'),
('Life Sciences', 'LIFE-SCI', 'grade-10', 'Diversity, Change and Continuity'),
('Life Sciences', 'LIFE-SCI', 'grade-11', 'Diversity, Change and Continuity'),
('Life Sciences', 'LIFE-SCI', 'grade-12', 'Diversity, Change and Continuity')
ON CONFLICT (code, grade_level) DO NOTHING;

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================
-- Next steps:
-- 1. Run scripts/caps-content-seeding.sql to populate curriculum content
-- 2. Run scripts/sprint2-content-seeding.sql to add Sprint 2 content
-- 3. Test teacher functionality and onboarding
-- ===========================================