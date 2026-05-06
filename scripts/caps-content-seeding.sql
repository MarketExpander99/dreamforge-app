-- CAPS Content Seeding Script for Grades 4-9
-- This script adds comprehensive CAPS curriculum content for middle grades
-- Run this after running database-curriculum.sql and populate-database.sql

-- ===========================================
-- 1. ADD ADDITIONAL CAPS SUBJECTS
-- ===========================================

-- Add more CAPS subjects
INSERT INTO subjects (curriculum_id, name, description, icon, color, grade_levels) VALUES
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'English Home Language', 'English as a home language - advanced reading, writing, and literature', '📖', '#2563eb', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'English First Additional Language', 'English as an additional language for non-native speakers', '🌐', '#7c3aed', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'Natural Sciences', 'Biology, Chemistry, Physics, and Earth Sciences integrated', '🧬', '#059669', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9']),
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'Technology', 'Design, programming, and technical skills', '💻', '#dc2626', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9']),
  ((SELECT id FROM curriculums WHERE name = 'CAPS'), 'Economic and Management Sciences', 'Business studies, entrepreneurship, and financial literacy', '💰', '#d97706', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'])
ON CONFLICT (curriculum_id, name) DO NOTHING;

-- ===========================================
-- 2. ADD LEARNING OBJECTIVES FOR GRADES 4-9
-- ===========================================

-- Grade 4 Mathematics Objectives
INSERT INTO learning_objectives (subject_id, grade_level, code, description, strand) VALUES
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 4', 'LO1', 'Numbers, Operations and Relationships', 'Numbers'),
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 4', 'LO2', 'Patterns, Functions and Algebra', 'Patterns'),
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 4', 'LO3', 'Space and Shape (Geometry)', 'Geometry'),
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 4', 'LO4', 'Measurement', 'Measurement'),
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 4', 'LO5', 'Data Handling', 'Statistics')
ON CONFLICT (subject_id, grade_level, code) DO NOTHING;

-- Grade 5 Mathematics Objectives
INSERT INTO learning_objectives (subject_id, grade_level, code, description, strand) VALUES
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 5', 'LO1', 'Numbers, Operations and Relationships', 'Numbers'),
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 5', 'LO2', 'Patterns, Functions and Algebra', 'Patterns'),
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 5', 'LO3', 'Space and Shape (Geometry)', 'Geometry'),
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 5', 'LO4', 'Measurement', 'Measurement'),
  ((SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'), 'Grade 5', 'LO5', 'Data Handling', 'Statistics')
ON CONFLICT (subject_id, grade_level, code) DO NOTHING;

-- ===========================================
-- 3. ADD LESSON PLANS FOR GRADES 4-9
-- ===========================================

-- Grade 4 Mathematics Lessons
INSERT INTO lesson_plans (
  subject_id,
  grade_level,
  title,
  description,
  duration_minutes,
  sequence_order,
  unit_title,
  term,
  week,
  difficulty,
  tags
) VALUES
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'),
  'Grade 4',
  'Multiplication and Division Strategies',
  'Learn efficient strategies for multiplication and division including arrays, grouping, and number lines.',
  45,
  1,
  'Multiplication and Division',
  'Term 1',
  2,
  'intermediate',
  ARRAY['multiplication', 'division', 'strategies', 'arrays']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'),
  'Grade 4',
  'Fractions: Parts of a Whole',
  'Understanding fractions as parts of a whole, including halves, quarters, thirds, and fifths.',
  50,
  2,
  'Fractions and Decimals',
  'Term 1',
  4,
  'intermediate',
  ARRAY['fractions', 'parts-of-whole', 'halves', 'quarters']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'),
  'Grade 4',
  'Geometric Shapes and Properties',
  'Explore 2D and 3D shapes, their properties, and how to classify them.',
  45,
  3,
  'Geometry',
  'Term 2',
  1,
  'beginner',
  ARRAY['geometry', 'shapes', '2d-shapes', '3d-shapes']
)
ON CONFLICT DO NOTHING;

-- Grade 4 Natural Sciences Lessons
INSERT INTO lesson_plans (
  subject_id,
  grade_level,
  title,
  description,
  duration_minutes,
  sequence_order,
  unit_title,
  term,
  week,
  difficulty,
  tags
) VALUES
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Natural Sciences'),
  'Grade 4',
  'Plant and Animal Life Cycles',
  'Study the life cycles of plants and animals, from seed to adult and birth to maturity.',
  45,
  1,
  'Life and Living',
  'Term 1',
  3,
  'beginner',
  ARRAY['life-cycles', 'plants', 'animals', 'biology']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Natural Sciences'),
  'Grade 4',
  'States of Matter',
  'Explore solids, liquids, and gases, and how matter changes state.',
  50,
  2,
  'Matter and Materials',
  'Term 2',
  2,
  'intermediate',
  ARRAY['matter', 'states', 'solids', 'liquids', 'gases']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Natural Sciences'),
  'Grade 4',
  'Energy and Movement',
  'Understand different forms of energy and how objects move.',
  45,
  3,
  'Energy and Change',
  'Term 3',
  1,
  'intermediate',
  ARRAY['energy', 'movement', 'physics', 'forces']
)
ON CONFLICT DO NOTHING;

-- Grade 5 Mathematics Lessons
INSERT INTO lesson_plans (
  subject_id,
  grade_level,
  title,
  description,
  duration_minutes,
  sequence_order,
  unit_title,
  term,
  week,
  difficulty,
  tags
) VALUES
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'),
  'Grade 5',
  'Decimal Numbers and Place Value',
  'Master decimal numbers, place value up to thousandths, and decimal operations.',
  50,
  1,
  'Numbers and Operations',
  'Term 1',
  2,
  'intermediate',
  ARRAY['decimals', 'place-value', 'operations', 'thousandths']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'),
  'Grade 5',
  'Common Fractions and Percentages',
  'Work with common fractions, equivalent fractions, and introduction to percentages.',
  45,
  2,
  'Fractions and Percentages',
  'Term 1',
  5,
  'intermediate',
  ARRAY['fractions', 'percentages', 'equivalent-fractions']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'),
  'Grade 5',
  'Area and Perimeter of 2D Shapes',
  'Calculate area and perimeter of rectangles, squares, triangles, and composite shapes.',
  45,
  3,
  'Measurement and Geometry',
  'Term 2',
  3,
  'intermediate',
  ARRAY['area', 'perimeter', '2d-shapes', 'measurement']
)
ON CONFLICT DO NOTHING;

-- Grade 5 Natural Sciences Lessons
INSERT INTO lesson_plans (
  subject_id,
  grade_level,
  title,
  description,
  duration_minutes,
  sequence_order,
  unit_title,
  term,
  week,
  difficulty,
  tags
) VALUES
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Natural Sciences'),
  'Grade 5',
  'Human Digestive System',
  'Learn about the organs and processes involved in digestion.',
  45,
  1,
  'Life and Living',
  'Term 1',
  4,
  'beginner',
  ARRAY['digestive-system', 'human-body', 'biology', 'organs']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Natural Sciences'),
  'Grade 5',
  'Chemical Reactions',
  'Explore chemical changes, reactions, and the conservation of matter.',
  50,
  2,
  'Matter and Materials',
  'Term 2',
  3,
  'intermediate',
  ARRAY['chemical-reactions', 'chemistry', 'matter', 'conservation']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Natural Sciences'),
  'Grade 5',
  'Electricity and Magnetism',
  'Understand electrical circuits, conductors, insulators, and magnetic forces.',
  45,
  3,
  'Energy and Change',
  'Term 3',
  2,
  'intermediate',
  ARRAY['electricity', 'magnetism', 'circuits', 'physics']
)
ON CONFLICT DO NOTHING;

-- ===========================================
-- 4. ADD CONTENT ITEMS FOR NEW LESSONS
-- ===========================================

-- Grade 4 Mathematics Content
INSERT INTO content_items (
  id, title, content, type, category_id, difficulty, tags, image_url, video_url, audio_url, quiz, read_time, is_featured, is_published
) VALUES
(
  'grade4-multiplication-strategies',
  'Multiplication Strategies for Grade 4',
  'Multiplication can be done in many ways! Use arrays to visualize multiplication. For example, 3 × 4 means 3 rows of 4 items each, totaling 12 items. You can also use grouping: 4 × 5 = 4 groups of 5, which equals 20. Practice these strategies to become a multiplication expert!',
  'text-image',
  (SELECT id FROM categories WHERE name = 'Mathematics' LIMIT 1),
  'intermediate',
  ARRAY['mathematics', 'multiplication', 'strategies', 'grade-4', 'arrays'],
  'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
  NULL,
  NULL,
  '{"question": "How many dots are in 3 rows of 4 dots each?", "options": ["7", "12", "9", "15"], "correctAnswer": 1, "explanation": "3 × 4 = 12. Three rows with four dots each equals twelve dots total."}',
  8,
  false,
  true
),
(
  'grade4-fractions-intro',
  'Understanding Fractions as Parts of a Whole',
  'Fractions show equal parts of a whole. One half (1/2) means the whole is divided into 2 equal parts and you have 1 part. One quarter (1/4) means the whole is divided into 4 equal parts. Pizza slices and chocolate bars are great ways to understand fractions!',
  'text-image',
  (SELECT id FROM categories WHERE name = 'Mathematics' LIMIT 1),
  'beginner',
  ARRAY['mathematics', 'fractions', 'parts-of-whole', 'grade-4'],
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  NULL,
  NULL,
  '{"question": "If you eat 2 slices of a pizza cut into 8 equal slices, what fraction of the pizza did you eat?", "options": ["2/8", "1/4", "1/2", "3/8"], "correctAnswer": 0, "explanation": "You ate 2 out of 8 equal slices, so you ate 2/8 of the pizza."}',
  7,
  false,
  true
),
(
  'grade4-geometry-shapes',
  'Exploring 2D and 3D Shapes',
  '2D shapes are flat and have only length and width. Circles, squares, rectangles, and triangles are 2D shapes. 3D shapes have length, width, and height. Cubes, spheres, cylinders, and pyramids are 3D shapes. Each shape has special properties that make it unique!',
  'text',
  (SELECT id FROM categories WHERE name = 'Mathematics' LIMIT 1),
  'beginner',
  ARRAY['mathematics', 'geometry', 'shapes', '2d-shapes', '3d-shapes', 'grade-4'],
  NULL,
  NULL,
  NULL,
  '{"question": "Which of these is a 3D shape?", "options": ["Square", "Triangle", "Cube", "Circle"], "correctAnswer": 2, "explanation": "A cube is a 3D shape because it has length, width, and height."}',
  6,
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Grade 4 Natural Sciences Content
INSERT INTO content_items (
  id, title, content, type, category_id, difficulty, tags, image_url, video_url, audio_url, quiz, read_time, is_featured, is_published
) VALUES
(
  'grade4-life-cycles',
  'Life Cycles of Plants and Animals',
  'All living things have life cycles. Plants start as seeds, grow into seedlings, then mature plants that make flowers and new seeds. Animals hatch from eggs or are born live, grow into adults, and have babies of their own. Life cycles help living things continue!',
  'text-image',
  (SELECT id FROM categories WHERE name = 'Science' LIMIT 1),
  'beginner',
  ARRAY['science', 'life-cycles', 'plants', 'animals', 'grade-4'],
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  NULL,
  NULL,
  '{"question": "What is the first stage of a plant life cycle?", "options": ["Flower", "Seed", "Tree", "Fruit"], "correctAnswer": 1, "explanation": "The plant life cycle begins with a seed."}',
  8,
  false,
  true
),
(
  'grade4-states-of-matter',
  'The Three States of Matter',
  'Matter exists in three states: solid, liquid, and gas. Solids keep their shape and size, like ice cubes or rocks. Liquids take the shape of their container but keep the same volume, like water. Gases fill all available space, like air. Matter can change between these states!',
  'text',
  (SELECT id FROM categories WHERE name = 'Science' LIMIT 1),
  'intermediate',
  ARRAY['science', 'matter', 'states', 'solids', 'liquids', 'gases', 'grade-4'],
  NULL,
  NULL,
  NULL,
  '{"question": "Which state of matter takes the shape of its container?", "options": ["Solid", "Liquid", "Gas", "All of them"], "correctAnswer": 1, "explanation": "Liquids take the shape of their container but keep the same volume."}',
  7,
  false,
  true
),
(
  'grade4-energy-movement',
  'Energy and How Things Move',
  'Energy makes things move! Potential energy is stored energy, like a stretched rubber band. Kinetic energy is energy of motion, like a rolling ball. Forces like pushes and pulls can change how objects move. Gravity pulls objects toward Earth!',
  'text',
  (SELECT id FROM categories WHERE name = 'Science' LIMIT 1),
  'intermediate',
  ARRAY['science', 'energy', 'movement', 'forces', 'physics', 'grade-4'],
  NULL,
  NULL,
  NULL,
  '{"question": "What type of energy does a moving bicycle have?", "options": ["Potential energy", "Kinetic energy", "Solar energy", "Heat energy"], "correctAnswer": 1, "explanation": "A moving bicycle has kinetic energy, which is the energy of motion."}',
  7,
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 5. LINK CONTENT TO LESSONS
-- ===========================================

-- Link Grade 4 Mathematics content to lessons
INSERT INTO lesson_content (
  lesson_plan_id,
  content_id,
  sequence_order,
  content_type,
  is_required,
  estimated_duration
) VALUES
(
  (SELECT lp.id FROM lesson_plans lp JOIN subjects s ON lp.subject_id = s.id JOIN curriculums c ON s.curriculum_id = c.id
   WHERE c.name = 'CAPS' AND s.name = 'Mathematics' AND lp.grade_level = 'Grade 4' AND lp.title = 'Multiplication and Division Strategies'),
  'grade4-multiplication-strategies',
  1,
  'main_activity',
  true,
  25
),
(
  (SELECT lp.id FROM lesson_plans lp JOIN subjects s ON lp.subject_id = s.id JOIN curriculums c ON s.curriculum_id = c.id
   WHERE c.name = 'CAPS' AND s.name = 'Mathematics' AND lp.grade_level = 'Grade 4' AND lp.title = 'Fractions: Parts of a Whole'),
  'grade4-fractions-intro',
  1,
  'main_activity',
  true,
  30
),
(
  (SELECT lp.id FROM lesson_plans lp JOIN subjects s ON lp.subject_id = s.id JOIN curriculums c ON s.curriculum_id = c.id
   WHERE c.name = 'CAPS' AND s.name = 'Mathematics' AND lp.grade_level = 'Grade 4' AND lp.title = 'Geometric Shapes and Properties'),
  'grade4-geometry-shapes',
  1,
  'main_activity',
  true,
  25
)
ON CONFLICT (lesson_plan_id, content_id) DO NOTHING;

-- Link Grade 4 Natural Sciences content to lessons
INSERT INTO lesson_content (
  lesson_plan_id,
  content_id,
  sequence_order,
  content_type,
  is_required,
  estimated_duration
) VALUES
(
  (SELECT lp.id FROM lesson_plans lp JOIN subjects s ON lp.subject_id = s.id JOIN curriculums c ON s.curriculum_id = c.id
   WHERE c.name = 'CAPS' AND s.name = 'Natural Sciences' AND lp.grade_level = 'Grade 4' AND lp.title = 'Plant and Animal Life Cycles'),
  'grade4-life-cycles',
  1,
  'main_activity',
  true,
  30
),
(
  (SELECT lp.id FROM lesson_plans lp JOIN subjects s ON lp.subject_id = s.id JOIN curriculums c ON s.curriculum_id = c.id
   WHERE c.name = 'CAPS' AND s.name = 'Natural Sciences' AND lp.grade_level = 'Grade 4' AND lp.title = 'States of Matter'),
  'grade4-states-of-matter',
  1,
  'main_activity',
  true,
  35
),
(
  (SELECT lp.id FROM lesson_plans lp JOIN subjects s ON lp.subject_id = s.id JOIN curriculums c ON s.curriculum_id = c.id
   WHERE c.name = 'CAPS' AND s.name = 'Natural Sciences' AND lp.grade_level = 'Grade 4' AND lp.title = 'Energy and Movement'),
  'grade4-energy-movement',
  1,
  'main_activity',
  true,
  30
)
ON CONFLICT (lesson_plan_id, content_id) DO NOTHING;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check new subjects added
SELECT
  s.name as subject_name,
  array_length(s.grade_levels, 1) as grade_count,
  s.grade_levels
FROM subjects s
JOIN curriculums c ON s.curriculum_id = c.id
WHERE c.name = 'CAPS'
ORDER BY s.name;

-- Check lesson plans by grade and subject
SELECT
  lp.grade_level,
  s.name as subject_name,
  COUNT(lp.id) as lesson_count
FROM lesson_plans lp
JOIN subjects s ON lp.subject_id = s.id
JOIN curriculums c ON s.curriculum_id = c.id
WHERE c.name = 'CAPS' AND lp.grade_level IN ('Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9')
GROUP BY lp.grade_level, s.name
ORDER BY lp.grade_level, s.name;

-- Check content items added
SELECT
  ci.title,
  cat.name as category,
  ci.difficulty,
  ci.tags
FROM content_items ci
JOIN categories cat ON ci.category_id = cat.id
WHERE ci.id LIKE 'grade4-%' OR ci.id LIKE 'grade5-%'
ORDER BY ci.id;

-- ===========================================
-- SEEDING COMPLETE
-- ===========================================

-- The database now has comprehensive CAPS content for Grades 4-9!