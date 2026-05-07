-- FINAL RLS FIX: Separate Policies to Avoid Infinite Recursion
-- Execute this SQL in Supabase SQL Editor

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "teacher_class_access" ON teacher_classes;
DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON teacher_classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON teacher_classes;
DROP POLICY IF EXISTS "Teachers can create their own classes" ON teacher_classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON teacher_classes;

-- Step 2: Create separate policies for different operations
CREATE POLICY "teachers_select_own_classes" ON teacher_classes
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "teachers_insert_own_classes" ON teacher_classes
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "teachers_update_own_classes" ON teacher_classes
  FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "teachers_delete_own_classes" ON teacher_classes
  FOR DELETE USING (auth.uid() = teacher_id);

-- Step 3: Verify policies were created (run this query)
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'teacher_classes'
ORDER BY policyname;