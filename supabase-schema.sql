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

-- Create content_relationships table for fractal graph connections
CREATE TABLE IF NOT EXISTS content_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id TEXT REFERENCES content_items(id) ON DELETE CASCADE,
  target_id TEXT REFERENCES content_items(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('prerequisite', 'extends', 'gamified_link', 'similar')),
  strength INTEGER DEFAULT 1 CHECK (strength >= 1 AND strength <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(source_id, target_id, relationship_type)
);

-- === NEW TABLES FOR LEARNING PATH CONNECTIVITY ===
CREATE TABLE IF NOT EXISTS user_explorations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  short_description TEXT,
  main_function TEXT,
  components TEXT[],
  self_similar TEXT[],
  deep_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  modules JSONB,
  generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on all tables (existing + new)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_explorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

-- (Existing policies for other tables remain unchanged - only adding new ones below)

-- New policies for user_explorations
CREATE POLICY IF NOT EXISTS "Users can view their own explorations" ON user_explorations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own explorations" ON user_explorations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- New policies for learning_paths
CREATE POLICY IF NOT EXISTS "Users can view their own learning paths" ON learning_paths
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own learning paths" ON learning_paths
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own learning paths" ON learning_paths
  FOR UPDATE USING (auth.uid() = user_id);

-- (All existing categories/content seeding policies, triggers, functions, and default inserts remain exactly as before)