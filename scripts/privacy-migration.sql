-- Privacy-First Username System Migration
-- Adds display_name, anonymous_id, and parent_consent_given columns to profiles table

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS anonymous_id TEXT UNIQUE NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS parent_consent_given BOOLEAN DEFAULT false;

-- Create function to generate anonymous_id
CREATE OR REPLACE FUNCTION generate_anonymous_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    -- Generate a random 5-digit number (10000-99999)
    new_id := 'User_' || LPAD((10000 + floor(random() * 90000))::TEXT, 5, '0');
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE anonymous_id = new_id) THEN
      RETURN new_id;
    END IF;
    counter := counter + 1;
    -- Prevent infinite loop (though very unlikely)
    IF counter > 1000 THEN
      RAISE EXCEPTION 'Could not generate unique anonymous_id after 1000 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles with anonymous_ids
UPDATE profiles
SET anonymous_id = generate_anonymous_id()
WHERE anonymous_id = '';

-- Make anonymous_id NOT NULL constraint (after backfilling)
ALTER TABLE profiles
ALTER COLUMN anonymous_id SET NOT NULL;

-- Update the handle_new_user function to generate anonymous_id on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, anonymous_id)
  VALUES (
    NEW.id,
    'student',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Student'),
    generate_anonymous_id()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to allow users to update display_name and parent_consent_given
-- (The existing policies should already allow this since they allow full profile updates)

-- Add comment to document the privacy system
COMMENT ON COLUMN profiles.display_name IS 'User-chosen display name shown publicly. Nullable - falls back to anonymous_id if not set.';
COMMENT ON COLUMN profiles.anonymous_id IS 'Auto-generated anonymous identifier (User_XXXXX format) used when display_name is not set.';
COMMENT ON COLUMN profiles.parent_consent_given IS 'Whether parent/guardian has consented to student setting a display name. Only relevant for students.';