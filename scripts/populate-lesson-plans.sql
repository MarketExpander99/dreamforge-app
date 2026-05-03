-- Populate sample lesson plans for Grade 3 CAPS curriculum
-- Run this after running database-curriculum.sql

-- Insert sample lesson plans for Mathematics
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
  'Grade 3',
  'Multiplication Basics: Times Tables 1-5',
  'Learn the fundamentals of multiplication through times tables 1-5 with interactive examples and practice exercises.',
  45,
  1,
  'Multiplication and Division',
  'Term 1',
  3,
  'beginner',
  ARRAY['multiplication', 'times-tables', 'basic-arithmetic']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'),
  'Grade 3',
  'Adding and Subtracting 3-Digit Numbers',
  'Master place value concepts while adding and subtracting numbers with hundreds, tens, and ones places.',
  50,
  2,
  'Addition and Subtraction',
  'Term 1',
  5,
  'intermediate',
  ARRAY['addition', 'subtraction', 'place-value', 'three-digit-numbers']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Mathematics'),
  'Grade 3',
  'Understanding Fractions: Halves and Quarters',
  'Explore the concept of fractions by dividing wholes into equal parts, focusing on halves and quarters.',
  40,
  3,
  'Fractions and Decimals',
  'Term 2',
  2,
  'beginner',
  ARRAY['fractions', 'halves', 'quarters', 'parts-of-whole']
)
ON CONFLICT DO NOTHING;

-- Insert sample lesson plans for English
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
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'English'),
  'Grade 3',
  'Reading Comprehension: Finding the Main Idea',
  'Develop skills to identify the main idea and supporting details in paragraphs and short passages.',
  45,
  1,
  'Reading Comprehension',
  'Term 1',
  4,
  'intermediate',
  ARRAY['reading', 'comprehension', 'main-idea', 'literacy']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'English'),
  'Grade 3',
  'Writing Complete Sentences',
  'Learn the components of complete sentences and practice writing clear, grammatically correct sentences.',
  40,
  2,
  'Writing Skills',
  'Term 1',
  6,
  'beginner',
  ARRAY['writing', 'sentences', 'grammar', 'language']
)
ON CONFLICT DO NOTHING;

-- Insert sample lesson plans for Science
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
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Science'),
  'Grade 3',
  'Plants: Parts and Functions',
  'Explore the different parts of plants and understand how each part contributes to the plant''s survival.',
  45,
  1,
  'Life and Living',
  'Term 2',
  1,
  'beginner',
  ARRAY['plants', 'biology', 'photosynthesis', 'botany']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Science'),
  'Grade 3',
  'Animal Habitats and Adaptations',
  'Learn about different animal habitats and how animals adapt to survive in their environments.',
  50,
  2,
  'Life and Living',
  'Term 2',
  3,
  'intermediate',
  ARRAY['animals', 'habitats', 'adaptations', 'ecology']
)
ON CONFLICT DO NOTHING;

-- Insert sample lesson plans for Social Sciences
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
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Social Sciences'),
  'Grade 3',
  'Community Helpers and Their Jobs',
  'Learn about different people in our community and the important jobs they do to help others.',
  40,
  1,
  'People and Communities',
  'Term 3',
  1,
  'beginner',
  ARRAY['community', 'jobs', 'citizenship', 'social-studies']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Social Sciences'),
  'Grade 3',
  'Maps: Symbols and Legends',
  'Understand how to read maps using symbols and legends to interpret geographical information.',
  45,
  2,
  'Geography and Mapping',
  'Term 3',
  3,
  'beginner',
  ARRAY['maps', 'geography', 'symbols', 'legends']
)
ON CONFLICT DO NOTHING;

-- Insert sample lesson plans for Life Skills
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
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Life Skills'),
  'Grade 3',
  'Healthy Food Groups and Nutrition',
  'Learn about different food groups and why each is important for maintaining good health.',
  40,
  1,
  'Health and Nutrition',
  'Term 1',
  2,
  'beginner',
  ARRAY['nutrition', 'food-groups', 'health', 'wellness']
),
(
  (SELECT s.id FROM subjects s JOIN curriculums c ON s.curriculum_id = c.id WHERE c.name = 'CAPS' AND s.name = 'Life Skills'),
  'Grade 3',
  'Personal Safety Rules',
  'Understand important safety rules to keep yourself safe in different situations.',
  35,
  2,
  'Personal Safety',
  'Term 2',
  4,
  'beginner',
  ARRAY['safety', 'personal-safety', 'rules', 'wellness']
)
ON CONFLICT DO NOTHING;

-- Verification query
SELECT
  s.name as subject_name,
  COUNT(lp.id) as lesson_plans_count
FROM subjects s
LEFT JOIN lesson_plans lp ON s.id = lp.subject_id
WHERE s.curriculum_id = (SELECT id FROM curriculums WHERE name = 'CAPS')
GROUP BY s.name, s.id
ORDER BY s.name;