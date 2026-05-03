-- Disable Row Level Security for storage (simpler but less secure)
-- Run this in your Supabase SQL Editor if you prefer to disable RLS entirely

-- Disable RLS for storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS but allow all operations on avatars bucket
-- (comment out the above line and use these policies instead)

/*
-- Allow all operations on avatars bucket
CREATE POLICY "Allow all operations on avatars" ON storage.objects
  FOR ALL USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');
*/