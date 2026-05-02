-- Database Population Script
-- This script populates the database with sample content after the schema migration
-- Run this in Supabase SQL Editor after running database-migration.sql

-- ===========================================
-- 1. INSERT CONTENT ITEMS
-- ===========================================

-- Mathematics Content
INSERT INTO content_items (
  id, title, content, type, category_id, difficulty, tags, image_url, video_url, audio_url, quiz, read_time, is_featured, is_published
) VALUES
(
  'multiplication-basics',
  'Multiplication Basics: Times Tables 1-5',
  'Multiplication is repeated addition. Learn the times tables from 1 to 5 with fun examples. 2 × 3 means 2 groups of 3, which equals 6. Practice these tables every day to become a multiplication master!',
  'text',
  (SELECT id FROM categories WHERE name = 'Mathematics' LIMIT 1),
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
  (SELECT id FROM categories WHERE name = 'Mathematics' LIMIT 1),
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
  (SELECT id FROM categories WHERE name = 'Mathematics' LIMIT 1),
  'beginner',
  ARRAY['mathematics', 'fractions', 'halves', 'quarters', 'grade-3'],
  'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
  NULL,
  NULL,
  '{"question": "If you cut a pizza into 4 equal slices and eat 1 slice, what fraction of the pizza did you eat?", "options": ["1/2", "1/3", "1/4", "3/4"], "correctAnswer": 2, "explanation": "You ate 1 out of 4 equal slices, so you ate 1/4 of the pizza."}',
  6,
  false,
  true
),
(
  'geometry-shapes-properties',
  'Geometry: Shapes and Their Properties',
  'Learn about different shapes and their properties. Triangles have 3 sides, squares have 4 equal sides and 4 right angles, circles have no sides but infinite points on the curved line.',
  'text',
  (SELECT id FROM categories WHERE name = 'Mathematics' LIMIT 1),
  'beginner',
  ARRAY['mathematics', 'geometry', 'shapes', 'properties', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "How many sides does a triangle have?", "options": ["2", "3", "4", "5"], "correctAnswer": 1, "explanation": "A triangle has 3 sides."}',
  7,
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
  (SELECT id FROM categories WHERE name = 'Language Arts' LIMIT 1),
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
  (SELECT id FROM categories WHERE name = 'Language Arts' LIMIT 1),
  'beginner',
  ARRAY['language-arts', 'writing', 'sentences', 'grammar', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "Which is a complete sentence?", "options": ["The big dog", "Running fast", "The big dog runs fast.", "Very quickly"], "correctAnswer": 2, "explanation": "\"The big dog runs fast.\" has a subject (dog) and predicate (runs fast) and expresses a complete thought."}',
  6,
  false,
  true
),
(
  'vocabulary-context-clues',
  'Vocabulary: Using Context Clues',
  'Context clues help you figure out unknown words. Look at the words around the unknown word. Synonyms, antonyms, examples, and explanations can all be clues to meaning.',
  'text',
  (SELECT id FROM categories WHERE name = 'Language Arts' LIMIT 1),
  'intermediate',
  ARRAY['language-arts', 'vocabulary', 'context-clues', 'reading', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What are context clues?", "options": ["Words that rhyme", "Words around an unknown word that help you figure out its meaning", "The title of a book", "Picture captions"], "correctAnswer": 1, "explanation": "Context clues are the words and sentences around an unknown word that help you understand its meaning."}',
  7,
  false,
  true
),
(
  'story-elements-characters-setting',
  'Story Elements: Characters and Setting',
  'Every story has characters (who the story is about) and setting (where and when the story takes place). Characters can be people, animals, or even objects. Setting includes both place and time.',
  'text',
  (SELECT id FROM categories WHERE name = 'Language Arts' LIMIT 1),
  'beginner',
  ARRAY['language-arts', 'reading', 'story-elements', 'characters', 'setting', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What is the setting of a story?", "options": ["The main character", "Where and when the story takes place", "What happens in the story", "How the story ends"], "correctAnswer": 1, "explanation": "The setting tells where and when the story takes place."}',
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
  (SELECT id FROM categories WHERE name = 'Science' LIMIT 1),
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
  (SELECT id FROM categories WHERE name = 'Science' LIMIT 1),
  'intermediate',
  ARRAY['science', 'animals', 'habitats', 'adaptations', 'grade-3'],
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
  NULL,
  NULL,
  '{"question": "What is an adaptation?", "options": ["Where an animal lives", "A special feature that helps an animal survive", "What an animal eats", "How old an animal is"], "correctAnswer": 1, "explanation": "An adaptation is a special feature or behavior that helps an animal survive in its environment."}',
  8,
  false,
  true
),
(
  'weather-types-patterns',
  'Weather Types and Patterns',
  'Weather includes sunny, cloudy, rainy, snowy, windy, and stormy conditions. Weather patterns can be predicted by watching clouds, wind direction, and temperature changes.',
  'text',
  (SELECT id FROM categories WHERE name = 'Science' LIMIT 1),
  'beginner',
  ARRAY['science', 'weather', 'meteorology', 'patterns', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "Which of these is NOT a type of weather?", "options": ["Sunny", "Cloudy", "Sleepy", "Windy"], "correctAnswer": 2, "explanation": "\"Sleepy\" is not a type of weather. Weather types include sunny, cloudy, rainy, snowy, windy, and stormy."}',
  6,
  false,
  true
),
(
  'matter-states-properties',
  'Matter: States and Properties',
  'Matter exists in three main states: solid, liquid, and gas. Solids keep their shape, liquids take the shape of their container, and gases fill all available space. Matter has properties like color, size, and texture.',
  'text',
  (SELECT id FROM categories WHERE name = 'Science' LIMIT 1),
  'intermediate',
  ARRAY['science', 'matter', 'states', 'properties', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "Which state of matter takes the shape of its container?", "options": ["Solid", "Liquid", "Gas", "All of them"], "correctAnswer": 1, "explanation": "Liquids take the shape of their container but keep the same volume."}',
  7,
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
  (SELECT id FROM categories WHERE name = 'Social Studies' LIMIT 1),
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
  (SELECT id FROM categories WHERE name = 'Social Studies' LIMIT 1),
  'beginner',
  ARRAY['social-studies', 'maps', 'geography', 'symbols', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What does a map legend do?", "options": ["Shows directions", "Explains what the symbols on the map mean", "Tells the weather", "Shows pictures"], "correctAnswer": 1, "explanation": "A map legend explains what each symbol or color on the map represents."}',
  7,
  false,
  true
),
(
  'american-revolution-heroes',
  'American Revolution Heroes',
  'George Washington led the Continental Army to victory. Thomas Jefferson wrote the Declaration of Independence. Benjamin Franklin helped create the new government. These heroes fought for freedom and independence.',
  'text-image',
  (SELECT id FROM categories WHERE name = 'Social Studies' LIMIT 1),
  'intermediate',
  ARRAY['social-studies', 'history', 'american-revolution', 'heroes', 'grade-3'],
  'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=400',
  NULL,
  NULL,
  '{"question": "Who wrote the Declaration of Independence?", "options": ["George Washington", "Benjamin Franklin", "Thomas Jefferson", "Abraham Lincoln"], "correctAnswer": 2, "explanation": "Thomas Jefferson wrote the Declaration of Independence in 1776."}',
  8,
  false,
  true
),
(
  'rules-laws-citizenship',
  'Rules, Laws, and Good Citizenship',
  'Rules help keep everyone safe and happy. Laws are rules made by the government that everyone must follow. Good citizens follow rules, help others, and care for their community.',
  'text',
  (SELECT id FROM categories WHERE name = 'Social Studies' LIMIT 1),
  'beginner',
  ARRAY['social-studies', 'citizenship', 'rules', 'laws', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What is a good citizen?", "options": ["Someone who breaks rules", "Someone who follows rules and helps others", "Someone who only thinks about themselves", "Someone who never helps"], "correctAnswer": 1, "explanation": "A good citizen follows rules, helps others, and cares for their community."}',
  6,
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Health & Wellness Content
INSERT INTO content_items (
  id, title, content, type, category_id, difficulty, tags, image_url, video_url, audio_url, quiz, read_time, is_featured, is_published
) VALUES
(
  'healthy-food-groups',
  'Healthy Food Groups and Nutrition',
  'Healthy eating includes fruits, vegetables, grains, protein foods, and dairy. Each food group gives our bodies different nutrients we need to grow strong and stay healthy.',
  'text',
  (SELECT id FROM categories WHERE name = 'Health & Wellness' LIMIT 1),
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
  'exercise-physical-activity',
  'Exercise and Physical Activity',
  'Our bodies need exercise to stay strong and healthy. Activities like running, jumping, swimming, and playing sports help build muscles, strengthen bones, and keep our hearts healthy.',
  'text',
  (SELECT id FROM categories WHERE name = 'Health & Wellness' LIMIT 1),
  'beginner',
  ARRAY['health', 'exercise', 'physical-activity', 'fitness', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "Why do we need exercise?", "options": ["To watch TV more", "To build strong muscles and bones", "To eat more candy", "To sleep all day"], "correctAnswer": 1, "explanation": "Exercise helps build strong muscles and bones, and keeps our hearts and bodies healthy."}',
  5,
  false,
  true
),
(
  'personal-safety-rules',
  'Personal Safety Rules',
  'Stay safe by never talking to strangers, always telling a trusted adult if something feels wrong, wearing seat belts in cars, and knowing emergency numbers. Your safety is very important.',
  'text',
  (SELECT id FROM categories WHERE name = 'Health & Wellness' LIMIT 1),
  'beginner',
  ARRAY['health', 'safety', 'personal-safety', 'rules', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What should you do if a stranger approaches you?", "options": ["Talk to them politely", "Go with them if they offer candy", "Tell a trusted adult and stay away", "Hide and not tell anyone"], "correctAnswer": 2, "explanation": "Always tell a trusted adult if a stranger approaches you, and stay away from strangers."}',
  6,
  false,
  true
),
(
  'emotions-feelings-management',
  'Understanding Emotions and Feelings',
  'Everyone has feelings like happy, sad, angry, scared, and excited. It''s okay to feel all emotions. We can manage our feelings by talking about them, taking deep breaths, or doing activities we enjoy.',
  'text',
  (SELECT id FROM categories WHERE name = 'Health & Wellness' LIMIT 1),
  'intermediate',
  ARRAY['health', 'emotions', 'feelings', 'mental-health', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What is a good way to manage angry feelings?", "options": ["Hit someone", "Take deep breaths and count to ten", "Scream loudly", "Run away"], "correctAnswer": 1, "explanation": "Taking deep breaths and counting to ten helps calm down when feeling angry."}',
  7,
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Arts & Culture Content
INSERT INTO content_items (
  id, title, content, type, category_id, difficulty, tags, image_url, video_url, audio_url, quiz, read_time, is_featured, is_published
) VALUES
(
  'color-theory-primary-secondary',
  'Color Theory: Primary and Secondary Colors',
  'Primary colors are red, blue, and yellow. You can''t make them by mixing other colors. Secondary colors are made by mixing two primary colors: orange (red + yellow), green (blue + yellow), purple (red + blue).',
  'text',
  (SELECT id FROM categories WHERE name = 'Arts & Culture' LIMIT 1),
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
  'music-rhythm-beat',
  'Music: Rhythm and Beat',
  'Rhythm is the pattern of sounds and silence in music. Beat is the steady pulse you can clap or tap to. Different instruments and voices create different rhythms and beats.',
  'text',
  (SELECT id FROM categories WHERE name = 'Arts & Culture' LIMIT 1),
  'beginner',
  ARRAY['arts', 'music', 'rhythm', 'beat', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What is the beat in music?", "options": ["The loudest sound", "The steady pulse you can clap or tap to", "The highest note", "The words being sung"], "correctAnswer": 1, "explanation": "The beat is the steady pulse or rhythm you can feel and clap along to in music."}',
  5,
  false,
  true
),
(
  'art-techniques-line-shape',
  'Art Techniques: Line and Shape',
  'Lines can be straight, curved, thick, or thin. They can show movement or create patterns. Shapes are made by connecting lines and can be geometric (circles, squares) or organic (clouds, trees).',
  'text',
  (SELECT id FROM categories WHERE name = 'Arts & Culture' LIMIT 1),
  'intermediate',
  ARRAY['arts', 'drawing', 'line', 'shape', 'techniques', 'grade-3'],
  NULL,
  NULL,
  NULL,
  '{"question": "What is a geometric shape?", "options": ["A cloud", "A tree", "A circle", "A flower"], "correctAnswer": 2, "explanation": "A circle is a geometric shape because it has a regular, mathematical form."}',
  7,
  false,
  true
),
(
  'cultural-arts-around-world',
  'Cultural Arts from Around the World',
  'Different cultures have unique art forms. Japanese artists create beautiful calligraphy and origami. African artists make colorful masks and sculptures. Mexican artists paint vibrant murals. Each culture shares its history through art.',
  'text-image',
  (SELECT id FROM categories WHERE name = 'Arts & Culture' LIMIT 1),
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
-- VERIFICATION: Check population results
-- ===========================================

-- Check content counts by category
SELECT
  c.name as category_name,
  COUNT(ci.id) as content_count
FROM categories c
LEFT JOIN content_items ci ON c.id = ci.category_id
GROUP BY c.name, c.id
ORDER BY c.name;

-- Check total content items
SELECT COUNT(*) as total_content_items FROM content_items;

-- Check featured content
SELECT title, category_id, is_featured
FROM content_items
WHERE is_featured = true;

-- ===========================================
-- POPULATION COMPLETE
-- ===========================================

-- The database is now populated with sample content for testing the app!