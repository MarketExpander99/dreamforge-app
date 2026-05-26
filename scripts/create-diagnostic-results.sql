-- Create diagnostic_results table
CREATE TABLE IF NOT EXISTS diagnostic_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  recommended_grade TEXT NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  subject_proficiency JSONB NOT NULL,
  strengths TEXT[] NOT NULL,
  gaps TEXT[] NOT NULL,
  suggested_topics TEXT[] NOT NULL,
  assessment_summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;

-- Policy for students to see own results
CREATE POLICY "Students can view own diagnostic results" ON diagnostic_results
FOR SELECT USING (auth.uid() = user_id);

-- Policy for teachers to view students' diagnostic results in their classes
CREATE POLICY "Teachers can view students' diagnostic results in their classes" ON diagnostic_results
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM class_members cm
    JOIN classes c ON cm.class_id = c.id
    WHERE c.teacher_id = auth.uid() AND cm.student_id = user_id
  )
);

-- Policy for parents to view their children's results
CREATE POLICY "Parents can view their children's diagnostic results" ON diagnostic_results
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = user_id AND p.parent_id = auth.uid()
  )
);

-- Policy for admins
CREATE POLICY "Admins can view all diagnostic results" ON diagnostic_results
FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_user_id ON diagnostic_results(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_completed_at ON diagnostic_results(completed_at DESC);