-- KnowFeed Database Seeding Script
-- Run this in your Supabase SQL Editor to populate the database with sample data

-- ===========================================
-- 1. INSERT CATEGORIES
-- ===========================================

-- Add unique constraint on name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_name_key'
    AND conrelid = 'categories'::regclass
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);
  END IF;
END $$;

INSERT INTO categories (name, description, icon, color) VALUES
('Mathematics', 'Master numbers, patterns, and problem-solving skills', '🔢', 'purple'),
('Language Arts', 'Develop reading, writing, and communication skills', '📚', 'blue'),
('Science', 'Explore the wonders of science and discovery', '🔬', 'green'),
('Social Studies', 'Learn about communities, history, and geography', '🌍', 'orange'),
('Health & Wellness', 'Learn about physical and mental well-being', '❤️', 'red'),
('Arts & Culture', 'Express creativity and explore human culture', '🎨', 'pink')
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- 2. INSERT CONTENT ITEMS
-- ===========================================

-- Get category IDs for reference
CREATE TEMP TABLE category_ids AS
SELECT id, name FROM categories;

-- Mathematics Content
INSERT INTO content_items (
  id, title, content, type, category_id, difficulty, tags, image_url, video_url, audio_url, quiz, read_time, is_featured, is_published
) VALUES
(
  'multiplication-basics',
  'Multiplication Basics: Times Tables 1-5',
  'Multiplication is repeated addition. Learn the times tables from 1 to 5 with fun examples. 2 × 3 means 2 groups of 3, which equals 6. Practice these tables every day to become a multiplication master!',
  'text',
  (SELECT id FROM category_ids WHERE name = 'Mathematics'),
  'beginner',
  ARRAY['mathematics', 'multiplication', 'times-tables', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What is 4 × 3?", "options": ["7", "12", "9", "15"], "correctAnswer": 1, "explanation": "4 × 3 = 12. Four groups of three equals twelve."}',
  8,
  true,
  true
),
(
  'addition-subtraction-3-digit',
  'Adding and Subtracting 3-Digit Numbers',
  'Learn to add and subtract numbers with hundreds, tens, and ones places. Remember to line up the numbers by their place values and add or subtract from right to left, starting with the ones column.',
  'text',
  (SELECT id FROM category_ids WHERE name = 'Mathematics'),
  'intermediate',
  ARRAY['mathematics', 'addition', 'subtraction', 'place-value', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What is 256 + 147?", "options": ["393", "403", "413", "423"], "correctAnswer": 1, "explanation": "256 + 147 = 403. Add hundreds: 2+1=3, tens: 5+4=9, ones: 6+7=13 (write 3, carry 1), plus carried 1 makes tens 10."}',
  10,
  false,
  true
),
(
  'fractions-halves-quarters',
  'Understanding Fractions: Halves and Quarters',
  'Fractions show parts of a whole. One half (1/2) means one piece when something is divided into two equal parts. One quarter (1/4) means one piece when divided into four equal parts.',
  'text-image',
  (SELECT id FROM category_ids WHERE name = 'Mathematics'),
  'beginner',
  ARRAY['mathematics', 'fractions', 'halves', 'quarters', 'grade-3'],
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  NULL,
  NULL,
  '{"question": "If you cut a pizza into 4 equal slices and eat 1 slice, what fraction of the pizza did you eat?", "options": ["1/2", "1/3", "1/4", "3/4"], "correctAnswer": 2, "explanation": "You ate 1 out of 4 equal slices, so you ate 1/4 of the pizza."}',
  6,
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Language Arts Content
INSERT INTO content_items (
  id, title, content, type, category_id, difficulty, tags, image_url, video_url, audio_url, quiz, read_time, is_featured, is_published
) VALUES
(
  'reading-comprehension-main-idea',
  'Reading Comprehension: Finding the Main Idea',
  'The main idea is the most important point the author wants to make. Look for repeated words or ideas, and ask yourself "What is this mostly about?" The main idea is usually in the first or last sentence of a paragraph.',
  'text',
  (SELECT id FROM category_ids WHERE name = 'Language Arts'),
  'intermediate',
  ARRAY['language-arts', 'reading', 'comprehension', 'main-idea', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What is the main idea of a story?", "options": ["The title", "The most important point the author wants to make", "The last sentence", "The longest paragraph"], "correctAnswer": 1, "explanation": "The main idea is the most important point or message the author wants to communicate."}',
  8,
  false,
  true
),
(
  'writing-complete-sentences',
  'Writing Complete Sentences',
  'A complete sentence has a subject (who or what) and a predicate (what they do). It must express a complete thought and start with a capital letter, end with punctuation. Examples: "The cat sleeps." "I like pizza."',
  'text',
  (SELECT id FROM category_ids WHERE name = 'Language Arts'),
  'beginner',
  ARRAY['language-arts', 'writing', 'sentences', 'grammar', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "Which is a complete sentence?", "options": ["The big dog", "Running fast", "The big dog runs fast.", "Very quickly"], "correctAnswer": 2, "explanation": "\"The big dog runs fast.\" has a subject (dog) and predicate (runs fast) and expresses a complete thought."}',
  6,
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Science Content
INSERT INTO content_items (
  id, title, content, type, category_id, difficulty, tags, image_url, video_url, audio_url, quiz, read_time, is_featured, is_published
) VALUES
(
  'plants-parts-functions',
  'Plants: Parts and Functions',
  'Plants have roots, stems, leaves, flowers, and sometimes fruit. Roots absorb water and nutrients from soil. Leaves make food through photosynthesis. Flowers make seeds for new plants.',
  'text-image',
  (SELECT id FROM category_ids WHERE name = 'Science'),
  'beginner',
  ARRAY['science', 'plants', 'biology', 'photosynthesis', 'grade-3'],
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  NULL,
  NULL,
  '{"question": "What do plant roots do?", "options": ["Make food", "Absorb water and nutrients", "Make seeds", "Attract bees"], "correctAnswer": 1, "explanation": "Roots absorb water and nutrients from the soil to help the plant grow."}',
  7,
  true,
  true
),
(
  'animal-habitats-adaptations',
  'Animal Habitats and Adaptations',
  'Animals live in different habitats like forests, deserts, oceans, and grasslands. They have special adaptations that help them survive in their habitats, like camouflage, thick fur, or webbed feet.',
  'text-image',
  (SELECT id FROM category_ids WHERE name = 'Science'),
  'intermediate',
  ARRAY['science', 'animals', 'habitats', 'adaptations', 'grade-3'],
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
  NULL,
  NULL,
  '{"question": "What is an adaptation?", "options": ["Where an animal lives", "A special feature that helps an animal survive", "What an animal eats", "How old an animal is"], "correctAnswer": 1, "explanation": "An adaptation is a special feature or behavior that helps an animal survive in its environment."}',
  8,
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Social Studies Content
INSERT INTO content_items (
  id, title, content, type, category_id, difficulty, tags, image_url, video_url, audio_url, quiz, read_time, is_featured, is_published
) VALUES
(
  'community-helpers',
  'Community Helpers and Their Jobs',
  'People in our community have important jobs that help everyone. Police officers keep us safe, firefighters put out fires, doctors help sick people, and teachers help us learn. Each job is important for our community.',
  'text',
  (SELECT id FROM category_ids WHERE name = 'Social Studies'),
  'beginner',
  ARRAY['social-studies', 'community', 'jobs', 'citizenship', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What do firefighters do?", "options": ["Teach children", "Put out fires and help in emergencies", "Grow food", "Build houses"], "correctAnswer": 1, "explanation": "Firefighters put out fires and help people in emergencies."}',
  6,
  false,
  true
),
(
  'maps-symbols-legend',
  'Maps: Symbols and Legends',
  'Maps use symbols to show real things. A legend explains what each symbol means. Common symbols include roads, buildings, water, and parks. Learning to read maps helps us understand our world.',
  'text',
  (SELECT id FROM category_ids WHERE name = 'Social Studies'),
  'beginner',
  ARRAY['social-studies', 'maps', 'geography', 'symbols', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What does a map legend do?", "options": ["Shows directions", "Explains what the symbols on the map mean", "Tells the weather", "Shows pictures"], "correctAnswer": 1, "explanation": "A map legend explains what each symbol or color on the map represents."}',
  7,
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Health Content
INSERT INTO content_items (
  id, title, content, type, category_id, difficulty, tags, image_url, video_url, audio_url, quiz, read_time, is_featured, is_published
) VALUES
(
  'healthy-food-groups',
  'Healthy Food Groups and Nutrition',
  'Healthy eating includes fruits, vegetables, grains, protein foods, and dairy. Each food group gives our bodies different nutrients we need to grow strong and stay healthy.',
  'text',
  (SELECT id FROM category_ids WHERE name = 'Health & Wellness'),
  'beginner',
  ARRAY['health', 'nutrition', 'food-groups', 'wellness', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "Which food group includes apples and carrots?", "options": ["Grains", "Proteins", "Fruits and Vegetables", "Dairy"], "correctAnswer": 2, "explanation": "Apples and carrots are both fruits and vegetables."}',
  6,
  false,
  true
),
(
  'personal-safety-rules',
  'Personal Safety Rules',
  'Stay safe by never talking to strangers, always telling a trusted adult if something feels wrong, wearing seat belts in cars, and knowing emergency numbers. Your safety is very important.',
  'text',
  (SELECT id FROM category_ids WHERE name = 'Health & Wellness'),
  'beginner',
  ARRAY['health', 'safety', 'personal-safety', 'rules', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What should you do if a stranger approaches you?", "options": ["Talk to them politely", "Go with them if they offer candy", "Tell a trusted adult and stay away", "Hide and not tell anyone"], "correctAnswer": 2, "explanation": "Always tell a trusted adult if a stranger approaches you, and stay away from strangers."}',
  6,
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Arts Content
INSERT INTO content_items (
  id, title, content, type, category_id, difficulty, tags, image_url, video_url, audio_url, quiz, read_time, is_featured, is_published
) VALUES
(
  'color-theory-primary-secondary',
  'Color Theory: Primary and Secondary Colors',
  'Primary colors are red, blue, and yellow. You can''t make them by mixing other colors. Secondary colors are made by mixing two primary colors: orange (red + yellow), green (blue + yellow), purple (red + blue).',
  'text',
  (SELECT id FROM category_ids WHERE name = 'Arts & Culture'),
  'beginner',
  ARRAY['arts', 'color-theory', 'primary-colors', 'secondary-colors', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "Which color do you get by mixing red and blue?", "options": ["Orange", "Green", "Purple", "Yellow"], "correctAnswer": 2, "explanation": "Mixing red and blue makes purple, a secondary color."}',
  6,
  false,
  true
),
(
  'cultural-arts-around-world',
  'Cultural Arts from Around the World',
  'Different cultures have unique art forms. Japanese artists create beautiful calligraphy and origami. African artists make colorful masks and sculptures. Mexican artists paint vibrant murals. Each culture shares its history through art.',
  'text-image',
  (SELECT id FROM category_ids WHERE name = 'Arts & Culture'),
  'intermediate',
  ARRAY['arts', 'cultural-arts', 'world-cultures', 'diversity', 'grade-3'],
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  NULL,
  NULL,
  '{"question": "What is origami?", "options": ["Japanese painting", "Japanese paper folding", "Japanese dancing", "Japanese cooking"], "correctAnswer": 1, "explanation": "Origami is the Japanese art of paper folding to create decorative objects."}',
  8,
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 3. CREATE TEST USER PROFILES
-- ===========================================
-- NOTE: Auth users must be created through Supabase Auth API, not SQL
-- After creating auth users, you can create their profiles here

-- Example: Replace 'user-uuid-here' with actual user IDs from Supabase Auth
-- INSERT INTO profiles (id, role, full_name, grade_level, bio, interests, learning_goals) VALUES
-- ('user-uuid-here', 'student', 'Alex Johnson', 'grade-3', 'A curious third-grade student who loves learning about science and math!', ARRAY['science', 'mathematics', 'reading', 'art'], 'To become better at multiplication and learn about plants and animals.')
-- ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 4. SAMPLE USER PROGRESS (requires user IDs)
-- ===========================================
-- After creating test users, uncomment and update with real user IDs:

-- INSERT INTO user_progress (user_id, content_id, status, progress_percentage, time_spent) VALUES
-- ('user-uuid-here', 'multiplication-basics', 'completed', 100, 15),
-- ('user-uuid-here', 'plants-parts-functions', 'completed', 100, 12),
-- ('user-uuid-here', 'reading-comprehension-main-idea', 'in_progress', 75, 8)
-- ON CONFLICT (user_id, content_id) DO NOTHING;

-- ===========================================
-- 5. SAMPLE USER BOOKMARKS (requires user IDs)
-- ===========================================
-- INSERT INTO user_bookmarks (user_id, content_id) VALUES
-- ('user-uuid-here', 'animal-habitats-adaptations'),
-- ('user-uuid-here', 'geometry-shapes-properties')
-- ON CONFLICT (user_id, content_id) DO NOTHING;

-- ===========================================
-- 6. SAMPLE USER ACHIEVEMENTS (requires user IDs)
-- ===========================================
-- INSERT INTO user_achievements (user_id, achievement_type, title, description, icon) VALUES
-- ('user-uuid-here', 'first_steps', 'First Steps', 'Completed your first learning module', '🎯'),
-- ('user-uuid-here', 'science_explorer', 'Science Explorer', 'Completed 3 science modules', '🔬'),
-- ('user-uuid-here', 'math_whiz', 'Math Whiz', 'Mastered multiplication basics', '🧮')
-- ON CONFLICT (user_id, achievement_type) DO NOTHING;

-- ===========================================
-- CLEANUP
-- ===========================================
DROP TABLE category_ids;

-- ===========================================
-- INSTRUCTIONS FOR USE
-- ===========================================
/*
1. Run this script in your Supabase SQL Editor
2. Create test users through the Supabase Auth dashboard or API
3. Get the user UUIDs from the auth.users table
4. Uncomment and update the user-specific sections with real UUIDs
5. Run the updated script again to add user data

ALTERNATIVE: Use the API endpoint /api/seed to seed data programmatically
(after fixing RLS policies)
*/