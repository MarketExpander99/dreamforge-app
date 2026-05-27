-- ============================================================================
-- CREATE SG TEST USERS (for Supabase SQL Editor)
-- ============================================================================
-- Purpose: Create two reliable test accounts for development/testing.
-- Emails:  sg_test@mail.com   (student)
--          sg_test2_@mail.com (teacher)
--
-- Passwords:
--   sg_test@mail.com   → Password01
--   sg_test2_@mail.com → Password02
--
-- HOW TO USE:
-- 1. Go to your Supabase project → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- 4. The script is idempotent (safe to run multiple times)
--
-- IMPORTANT NOTES:
-- - This uses raw inserts into auth.users (required for pure SQL).
-- - Passwords are bcrypt-hashed using pgcrypto.
-- - We manually create the profiles rows (bypasses the handle_new_user trigger)
--   so we have full control over role + anonymous_id + teacher flags.
-- - The JS scripts (create-test-student.js / create-test-teacher.js) are the
--   "official" supported method in this project and use the Admin API.
--   Use this SQL only when you specifically need to run something in the SQL editor.
--
-- After running, you can log in with the emails + passwords above.
-- ============================================================================

-- 1. Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create / update the two test users
DO $$
DECLARE
  student_id uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';  -- fixed UUID for reproducibility
  teacher_id uuid := 'b2c3d4e5-f6a7-8901-bcde-f23456789012';  -- fixed UUID for reproducibility
BEGIN

  -- ------------------------------------------------------------------
  -- USER 1: sg_test@mail.com  (STUDENT)
  -- ------------------------------------------------------------------
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    student_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'sg_test@mail.com',
    crypt('Password01', gen_salt('bf')),           -- hashed password
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"SG Test Student"}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = now();

  -- Create / update the profile (student)
  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    anonymous_id,
    parent_consent_given,
    created_at,
    updated_at
  )
  VALUES (
    student_id,
    'student',
    'SG Test Student',
    'User_00001',                    -- stable test anonymous id
    true,                            -- allow display name testing
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    anonymous_id = EXCLUDED.anonymous_id,
    parent_consent_given = EXCLUDED.parent_consent_given,
    updated_at = now();

  -- ------------------------------------------------------------------
  -- USER 2: sg_test2_@mail.com  (TEACHER)
  -- ------------------------------------------------------------------
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    teacher_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'sg_test2_@mail.com',
    crypt('Password02', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"SG Test Teacher"}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = now();

  -- Create / update the profile (teacher)
  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    anonymous_id,
    teacher_onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    teacher_id,
    'teacher',
    'SG Test Teacher',
    'User_00002',
    false,                           -- start with onboarding not completed (useful for testing teacher flow)
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    anonymous_id = EXCLUDED.anonymous_id,
    teacher_onboarding_completed = EXCLUDED.teacher_onboarding_completed,
    updated_at = now();

  RAISE NOTICE '✅ SG test users created/updated successfully';
  RAISE NOTICE '   Student: sg_test@mail.com / Password01 (role=student)';
  RAISE NOTICE '   Teacher: sg_test2_@mail.com / Password02 (role=teacher, onboarding=false)';

END $$;

-- 3. Quick verification (run this separately if you want to check)
-- SELECT id, email, created_at FROM auth.users WHERE email IN ('sg_test@mail.com', 'sg_test2_@mail.com');
-- SELECT id, role, full_name, anonymous_id, teacher_onboarding_completed FROM profiles WHERE id IN ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012');