-- ============================================================================
-- CREATE GROKLET + PAYFAST TEST USERS (for Supabase SQL Editor) - ROBUST VERSION
-- ============================================================================
-- Purpose: Create reliable dev/test accounts. Handles case where email already exists.
--
-- Emails & Passwords:
--   groklet@skillgain.dev     → GrokletTest2026!   (student)
--   payfast-test@skillgain.dev → PayFastTest2026!  (parent)
--
-- HOW TO USE:
-- 1. Go to your Supabase project → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- 4. The script is idempotent and safe even if the email already exists.
--
-- FIX FOR THIS ERROR:
-- "duplicate key value violates unique constraint "users_email_partial_key""
-- → The email already exists (from a previous run of your original script).
--   The previous version used ON CONFLICT (id) but the conflict is on email.
--   This version looks up by email first, updates if exists, inserts if not.
--
-- This also forces email_confirmed_at for the two users and runs a mass
-- update to mark ALL users as confirmed (dev environment only).
--
-- After running, log in with the credentials above.
-- The sidebar login/logout section will switch based on auth state.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  groklet_email text := 'groklet@skillgain.dev';
  groklet_pass  text := 'GrokletTest2026!';
  groklet_name  text := 'Groklet Explorer';
  groklet_grade text := 'Grade 7';

  payfast_email text := 'payfast-test@skillgain.dev';
  payfast_pass  text := 'PayFastTest2026!';
  payfast_name  text := 'PayFast Tester';

  v_id uuid;
BEGIN
  -- ============================================================
  -- GROKLET (student)
  -- ============================================================
  SELECT id INTO v_id FROM auth.users WHERE email = groklet_email;

  IF v_id IS NOT NULL THEN
    -- Update existing record (avoids email unique violation)
    UPDATE auth.users
    SET
      encrypted_password   = crypt(groklet_pass, gen_salt('bf')),
      email_confirmed_at   = now(),
      raw_app_meta_data    = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data   = jsonb_build_object('full_name', groklet_name),
      updated_at           = now()
    WHERE id = v_id;
    RAISE NOTICE 'Updated existing groklet user %', v_id;
  ELSE
    -- Fresh insert
    v_id := gen_random_uuid();
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
    ) VALUES (
      v_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      groklet_email,
      crypt(groklet_pass, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', groklet_name),
      now(),
      now()
    );
    RAISE NOTICE 'Created new groklet user %', v_id;
  END IF;

  -- Ensure profile exists / is updated
  INSERT INTO public.profiles (id, role, full_name, grade_level, created_at, updated_at)
  VALUES (v_id, 'student', groklet_name, groklet_grade, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    grade_level = EXCLUDED.grade_level,
    updated_at = now();

  -- ============================================================
  -- PAYFAST TESTER (parent)
  -- ============================================================
  SELECT id INTO v_id FROM auth.users WHERE email = payfast_email;

  IF v_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      encrypted_password   = crypt(payfast_pass, gen_salt('bf')),
      email_confirmed_at   = now(),
      raw_app_meta_data    = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data   = jsonb_build_object('full_name', payfast_name),
      updated_at           = now()
    WHERE id = v_id;
    RAISE NOTICE 'Updated existing payfast user %', v_id;
  ELSE
    v_id := gen_random_uuid();
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
    ) VALUES (
      v_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      payfast_email,
      crypt(payfast_pass, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', payfast_name),
      now(),
      now()
    );
    RAISE NOTICE 'Created new payfast user %', v_id;
  END IF;

  -- Ensure profile exists / is updated
  INSERT INTO public.profiles (id, role, full_name, created_at, updated_at)
  VALUES (v_id, 'parent', payfast_name, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    updated_at = now();

  RAISE NOTICE '✅ Groklet + PayFast test users are ready';
END $$;

-- ============================================================================
-- DEV-ONLY: Force email confirmation on ALL users
-- Only touches email_confirmed_at (confirmed_at is generated)
-- ============================================================================
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email IS NOT NULL;

-- Also repair any broken metadata (safe)
UPDATE auth.users
SET 
    instance_id = COALESCE(instance_id, '00000000-0000-0000-0000-000000000000'),
    raw_app_meta_data = COALESCE(
        raw_app_meta_data, 
        '{"provider":"email","providers":["email"]}'::jsonb
    ),
    aud = COALESCE(aud, 'authenticated'),
    role = COALESCE(role, 'authenticated')
WHERE email IS NOT NULL;

-- ============================================================================
-- CRITICAL REPAIR: Ensure auth.identities records exist
-- Direct SQL inserts into auth.users often miss this, causing "Database error querying schema"
-- on signInWithPassword. The identity links the user to the 'email' provider.
-- ============================================================================
DO $$
DECLARE
  v_id uuid;
  v_email text;
BEGIN
  FOREACH v_email IN ARRAY ARRAY['groklet@skillgain.dev', 'payfast-test@skillgain.dev'] LOOP
    SELECT id INTO v_id FROM auth.users WHERE email = v_email;
    IF v_id IS NOT NULL THEN
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        v_id,
        jsonb_build_object('sub', v_id::text, 'email', v_email),
        'email',
        v_email,
        now(),
        now(),
        now()
      )
      ON CONFLICT (provider, provider_id) DO NOTHING;
      RAISE NOTICE 'Repaired/ensured identity record for %', v_email;
    END IF;
  END LOOP;
END $$;

-- Quick verification
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  p.role,
  p.full_name,
  p.grade_level
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email IN ('groklet@skillgain.dev', 'payfast-test@skillgain.dev')
ORDER BY u.created_at DESC;

-- You should now be able to log in with the test passwords.
-- The sidebar will show "Log out" when signed in, and the login links when signed out.

-- If still failing, delete the users entirely in Supabase Auth dashboard and recreate using:
-- node scripts/create-groklet-payfast-users.js (with service role key)