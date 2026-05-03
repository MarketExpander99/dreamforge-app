-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('parent', 'student')),
  parent_id UUID REFERENCES profiles(id),
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  grade_level TEXT,
  interests TEXT[],
  learning_goals TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'text-image', 'video', 'quiz', 'audio')),
  category_id UUID REFERENCES categories(id),
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[],
  image_url TEXT,
  video_url TEXT,
  audio_url TEXT,
  quiz JSONB,
  read_time INTEGER DEFAULT 5, -- in minutes
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_id TEXT REFERENCES content_items(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent INTEGER DEFAULT 0, -- in minutes
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, content_id)
);

-- Create user_bookmarks table
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_id TEXT REFERENCES content_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, content_id)
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, achievement_type)
);

-- Create user_likes table
CREATE TABLE IF NOT EXISTS user_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_id TEXT REFERENCES content_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, content_id)
);

-- Create content_comments table
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_id TEXT REFERENCES content_items(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Temporarily disable RLS for categories and content_items for seeding
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Allow seeding categories" ON categories;
DROP POLICY IF EXISTS "Categories public access" ON categories;

-- Categories policies (allow all operations for seeding and public access)
CREATE POLICY "Categories public access" ON categories
  FOR ALL USING (true);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view published content" ON content_items;
DROP POLICY IF EXISTS "Allow seeding content items" ON content_items;

-- Content items policies (public read for published content)
CREATE POLICY "Anyone can view published content" ON content_items
  FOR SELECT USING (is_published = true);

-- Allow seeding operations (for API seeding)
CREATE POLICY "Allow seeding content items" ON content_items
  FOR ALL USING (true);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;

-- User progress policies
CREATE POLICY "Users can view their own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON user_bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON user_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON user_bookmarks;

-- User bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON user_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" ON user_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON user_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own likes" ON user_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON user_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON user_likes;

-- User likes policies
CREATE POLICY "Users can view their own likes" ON user_likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own likes" ON user_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON user_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view comments on content they can see" ON content_comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON content_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON content_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON content_comments;

-- Content comments policies
CREATE POLICY "Users can view comments on content they can see" ON content_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_items
      WHERE content_items.id = content_comments.content_id
      AND content_items.is_published = true
    )
  );

CREATE POLICY "Users can insert their own comments" ON content_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON content_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON content_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, 'student', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Student'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('Science', 'Explore the wonders of science and discovery', '🔬', 'blue'),
  ('History', 'Journey through time and human civilization', '🏛️', 'amber'),
  ('Geography', 'Discover the world and its landscapes', '🌍', 'green'),
  ('Daily Life', 'Learn about everyday skills and knowledge', '🏠', 'purple'),
  ('Mathematics', 'Master numbers, patterns, and problem-solving', '🔢', 'red'),
  ('Language Arts', 'Develop reading, writing, and communication skills', '📚', 'indigo'),
  ('Arts & Culture', 'Express creativity and explore human culture', '🎨', 'pink'),
  ('Health & Wellness', 'Learn about physical and mental well-being', '❤️', 'rose')
ON CONFLICT (name) DO NOTHING;
