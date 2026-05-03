-- Storage policies for avatar uploads
-- Run this in your Supabase SQL Editor

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload avatar files
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(storage.filename(name), '-', 2)
    AND (storage.filename(name) LIKE 'avatar-%')
  );

-- Allow users to update their own avatar files
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(storage.filename(name), '-', 2)
  );

-- Allow anyone to view avatar files (public access)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to delete their own avatar files
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(storage.filename(name), '-', 2)
  );

-- Alternative: Disable RLS for avatars bucket (less secure but simpler)
-- DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;