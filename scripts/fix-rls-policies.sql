-- Fix RLS policies for teacher_classes to prevent infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON teacher_classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON teacher_classes;
DROP POLICY IF EXISTS "Teachers can create their own classes" ON teacher_classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON teacher_classes;

-- Create simplified policies
CREATE POLICY "Teachers can manage their classes"
  ON teacher_classes FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Students can view enrolled classes"
  ON teacher_classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      WHERE cs.class_id = teacher_classes.id
      AND cs.student_id = auth.uid()
      AND cs.status = 'active'
    )
  );

-- Also fix class_students policies if needed
DROP POLICY IF EXISTS "Students can view their class enrollments" ON class_students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON class_students;
DROP POLICY IF EXISTS "Teachers can manage class enrollments" ON class_students;

CREATE POLICY "Students can view their enrollments"
  ON class_students FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can manage enrollments"
  ON class_students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teacher_classes tc
      WHERE tc.id = class_students.class_id
      AND tc.teacher_id = auth.uid()
    )
  );