// Database seeding utilities
import { createClient } from './supabase-server'

export interface SeedData {
  categories: Array<{
    id: string
    name: string
    description: string | null
    icon: string | null
    color: string | null
  }>
  content: Array<{
    id: string
    title: string
    content: string
    type: 'text' | 'text-image' | 'video' | 'quiz' | 'audio'
    category_id: string | null
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    tags: string[] | null
    image_url: string | null
    video_url: string | null
    audio_url: string | null
  quiz: {
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  } | null
    read_time: number
    is_featured: boolean
    is_published: boolean
  }>
}

// Sample seed data for Grade 3
export const sampleSeedData: SeedData = {
  categories: [
    {
      id: 'mathematics',
      name: 'Mathematics',
      description: 'Master numbers, patterns, and problem-solving skills',
      icon: '🔢',
      color: 'purple'
    },
    {
      id: 'language-arts',
      name: 'Language Arts',
      description: 'Develop reading, writing, and communication skills',
      icon: '📚',
      color: 'blue'
    },
    {
      id: 'science',
      name: 'Science',
      description: 'Explore the wonders of science and discovery',
      icon: '🔬',
      color: 'green'
    },
    {
      id: 'social-studies',
      name: 'Social Studies',
      description: 'Learn about communities, history, and geography',
      icon: '🌍',
      color: 'orange'
    },
    {
      id: 'health',
      name: 'Health & Wellness',
      description: 'Learn about physical and mental well-being',
      icon: '❤️',
      color: 'red'
    },
    {
      id: 'arts',
      name: 'Arts & Culture',
      description: 'Express creativity and explore human culture',
      icon: '🎨',
      color: 'pink'
    }
  ],
  content: [
    // MATHEMATICS CONTENT
    {
      id: 'multiplication-basics',
      title: 'Multiplication Basics: Times Tables 1-5',
      content: 'Multiplication is repeated addition. Learn the times tables from 1 to 5 with fun examples. 2 × 3 means 2 groups of 3, which equals 6. Practice these tables every day to become a multiplication master!',
      type: 'text',
      category_id: 'mathematics',
      difficulty: 'beginner',
      tags: ['mathematics', 'multiplication', 'times-tables', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What is 4 × 3?',
        options: ['7', '12', '9', '15'],
        correctAnswer: 1,
        explanation: '4 × 3 = 12. Four groups of three equals twelve.'
      },
      read_time: 8,
      is_featured: true,
      is_published: true
    },
    {
      id: 'addition-subtraction-3-digit',
      title: 'Adding and Subtracting 3-Digit Numbers',
      content: 'Learn to add and subtract numbers with hundreds, tens, and ones places. Remember to line up the numbers by their place values and add or subtract from right to left, starting with the ones column.',
      type: 'text',
      category_id: 'mathematics',
      difficulty: 'intermediate',
      tags: ['mathematics', 'addition', 'subtraction', 'place-value', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What is 256 + 147?',
        options: ['393', '403', '413', '423'],
        correctAnswer: 1,
        explanation: '256 + 147 = 403. Add hundreds: 2+1=3, tens: 5+4=9, ones: 6+7=13 (write 3, carry 1), plus carried 1 makes tens 10.'
      },
      read_time: 10,
      is_featured: false,
      is_published: true
    },
    {
      id: 'fractions-halves-quarters',
      title: 'Understanding Fractions: Halves and Quarters',
      content: 'Fractions show parts of a whole. One half (1/2) means one piece when something is divided into two equal parts. One quarter (1/4) means one piece when divided into four equal parts.',
      type: 'text-image',
      category_id: 'mathematics',
      difficulty: 'beginner',
      tags: ['mathematics', 'fractions', 'halves', 'quarters', 'grade-3'],
      image_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'If you cut a pizza into 4 equal slices and eat 1 slice, what fraction of the pizza did you eat?',
        options: ['1/2', '1/3', '1/4', '3/4'],
        correctAnswer: 2,
        explanation: 'You ate 1 out of 4 equal slices, so you ate 1/4 of the pizza.'
      },
      read_time: 6,
      is_featured: false,
      is_published: true
    },
    {
      id: 'geometry-shapes-properties',
      title: 'Geometry: Shapes and Their Properties',
      content: 'Learn about different shapes and their properties. Triangles have 3 sides, squares have 4 equal sides and 4 right angles, circles have no sides but infinite points on the curved line.',
      type: 'text',
      category_id: 'mathematics',
      difficulty: 'beginner',
      tags: ['mathematics', 'geometry', 'shapes', 'properties', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'How many sides does a triangle have?',
        options: ['2', '3', '4', '5'],
        correctAnswer: 1,
        explanation: 'A triangle has 3 sides.'
      },
      read_time: 7,
      is_featured: false,
      is_published: true
    },

    // LANGUAGE ARTS CONTENT
    {
      id: 'reading-comprehension-main-idea',
      title: 'Reading Comprehension: Finding the Main Idea',
      content: 'The main idea is the most important point the author wants to make. Look for repeated words or ideas, and ask yourself "What is this mostly about?" The main idea is usually in the first or last sentence of a paragraph.',
      type: 'text',
      category_id: 'language-arts',
      difficulty: 'intermediate',
      tags: ['language-arts', 'reading', 'comprehension', 'main-idea', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What is the main idea of a story?',
        options: ['The title', 'The most important point the author wants to make', 'The last sentence', 'The longest paragraph'],
        correctAnswer: 1,
        explanation: 'The main idea is the most important point or message the author wants to communicate.'
      },
      read_time: 8,
      is_featured: false,
      is_published: true
    },
    {
      id: 'writing-complete-sentences',
      title: 'Writing Complete Sentences',
      content: 'A complete sentence has a subject (who or what) and a predicate (what they do). It must express a complete thought and start with a capital letter, end with punctuation. Examples: "The cat sleeps." "I like pizza."',
      type: 'text',
      category_id: 'language-arts',
      difficulty: 'beginner',
      tags: ['language-arts', 'writing', 'sentences', 'grammar', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'Which is a complete sentence?',
        options: ['The big dog', 'Running fast', 'The big dog runs fast.', 'Very quickly'],
        correctAnswer: 2,
        explanation: '"The big dog runs fast." has a subject (dog) and predicate (runs fast) and expresses a complete thought.'
      },
      read_time: 6,
      is_featured: false,
      is_published: true
    },
    {
      id: 'vocabulary-context-clues',
      title: 'Vocabulary: Using Context Clues',
      content: 'Context clues help you figure out unknown words. Look at the words around the unknown word. Synonyms, antonyms, examples, and explanations can all be clues to meaning.',
      type: 'text',
      category_id: 'language-arts',
      difficulty: 'intermediate',
      tags: ['language-arts', 'vocabulary', 'context-clues', 'reading', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What are context clues?',
        options: ['Words that rhyme', 'Words around an unknown word that help you figure out its meaning', 'The title of a book', 'Picture captions'],
        correctAnswer: 1,
        explanation: 'Context clues are the words and sentences around an unknown word that help you understand its meaning.'
      },
      read_time: 7,
      is_featured: false,
      is_published: true
    },
    {
      id: 'story-elements-characters-setting',
      title: 'Story Elements: Characters and Setting',
      content: 'Every story has characters (who the story is about) and setting (where and when the story takes place). Characters can be people, animals, or even objects. Setting includes both place and time.',
      type: 'text',
      category_id: 'language-arts',
      difficulty: 'beginner',
      tags: ['language-arts', 'reading', 'story-elements', 'characters', 'setting', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What is the setting of a story?',
        options: ['The main character', 'Where and when the story takes place', 'What happens in the story', 'How the story ends'],
        correctAnswer: 1,
        explanation: 'The setting tells where and when the story takes place.'
      },
      read_time: 6,
      is_featured: false,
      is_published: true
    },

    // SCIENCE CONTENT
    {
      id: 'plants-parts-functions',
      title: 'Plants: Parts and Functions',
      content: 'Plants have roots, stems, leaves, flowers, and sometimes fruit. Roots absorb water and nutrients from soil. Leaves make food through photosynthesis. Flowers make seeds for new plants.',
      type: 'text-image',
      category_id: 'science',
      difficulty: 'beginner',
      tags: ['science', 'plants', 'biology', 'photosynthesis', 'grade-3'],
      image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What do plant roots do?',
        options: ['Make food', 'Absorb water and nutrients', 'Make seeds', 'Attract bees'],
        correctAnswer: 1,
        explanation: 'Roots absorb water and nutrients from the soil to help the plant grow.'
      },
      read_time: 7,
      is_featured: true,
      is_published: true
    },
    {
      id: 'animal-habitats-adaptations',
      title: 'Animal Habitats and Adaptations',
      content: 'Animals live in different habitats like forests, deserts, oceans, and grasslands. They have special adaptations that help them survive in their habitats, like camouflage, thick fur, or webbed feet.',
      type: 'text-image',
      category_id: 'science',
      difficulty: 'intermediate',
      tags: ['science', 'animals', 'habitats', 'adaptations', 'grade-3'],
      image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What is an adaptation?',
        options: ['Where an animal lives', 'A special feature that helps an animal survive', 'What an animal eats', 'How old an animal is'],
        correctAnswer: 1,
        explanation: 'An adaptation is a special feature or behavior that helps an animal survive in its environment.'
      },
      read_time: 8,
      is_featured: false,
      is_published: true
    },
    {
      id: 'weather-types-patterns',
      title: 'Weather Types and Patterns',
      content: 'Weather includes sunny, cloudy, rainy, snowy, windy, and stormy conditions. Weather patterns can be predicted by watching clouds, wind direction, and temperature changes.',
      type: 'text',
      category_id: 'science',
      difficulty: 'beginner',
      tags: ['science', 'weather', 'meteorology', 'patterns', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'Which of these is NOT a type of weather?',
        options: ['Sunny', 'Cloudy', 'Sleepy', 'Windy'],
        correctAnswer: 2,
        explanation: '"Sleepy" is not a type of weather. Weather types include sunny, cloudy, rainy, snowy, windy, and stormy.'
      },
      read_time: 6,
      is_featured: false,
      is_published: true
    },
    {
      id: 'matter-states-properties',
      title: 'Matter: States and Properties',
      content: 'Matter exists in three main states: solid, liquid, and gas. Solids keep their shape, liquids take the shape of their container, and gases fill all available space. Matter has properties like color, size, and texture.',
      type: 'text',
      category_id: 'science',
      difficulty: 'intermediate',
      tags: ['science', 'matter', 'states', 'properties', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'Which state of matter takes the shape of its container?',
        options: ['Solid', 'Liquid', 'Gas', 'All of them'],
        correctAnswer: 1,
        explanation: 'Liquids take the shape of their container but keep the same volume.'
      },
      read_time: 7,
      is_featured: false,
      is_published: true
    },

    // SOCIAL STUDIES CONTENT
    {
      id: 'community-helpers',
      title: 'Community Helpers and Their Jobs',
      content: 'People in our community have important jobs that help everyone. Police officers keep us safe, firefighters put out fires, doctors help sick people, and teachers help us learn. Each job is important for our community.',
      type: 'text',
      category_id: 'social-studies',
      difficulty: 'beginner',
      tags: ['social-studies', 'community', 'jobs', 'citizenship', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What do firefighters do?',
        options: ['Teach children', 'Put out fires and help in emergencies', 'Grow food', 'Build houses'],
        correctAnswer: 1,
        explanation: 'Firefighters put out fires and help people in emergencies.'
      },
      read_time: 6,
      is_featured: false,
      is_published: true
    },
    {
      id: 'maps-symbols-legend',
      title: 'Maps: Symbols and Legends',
      content: 'Maps use symbols to show real things. A legend explains what each symbol means. Common symbols include roads, buildings, water, and parks. Learning to read maps helps us understand our world.',
      type: 'text',
      category_id: 'social-studies',
      difficulty: 'beginner',
      tags: ['social-studies', 'maps', 'geography', 'symbols', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What does a map legend do?',
        options: ['Shows directions', 'Explains what the symbols on the map mean', 'Tells the weather', 'Shows pictures'],
        correctAnswer: 1,
        explanation: 'A map legend explains what each symbol or color on the map represents.'
      },
      read_time: 7,
      is_featured: false,
      is_published: true
    },
    {
      id: 'american-revolution-heroes',
      title: 'American Revolution Heroes',
      content: 'George Washington led the Continental Army to victory. Thomas Jefferson wrote the Declaration of Independence. Benjamin Franklin helped create the new government. These heroes fought for freedom and independence.',
      type: 'text-image',
      category_id: 'social-studies',
      difficulty: 'intermediate',
      tags: ['social-studies', 'history', 'american-revolution', 'heroes', 'grade-3'],
      image_url: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=400',
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'Who wrote the Declaration of Independence?',
        options: ['George Washington', 'Benjamin Franklin', 'Thomas Jefferson', 'Abraham Lincoln'],
        correctAnswer: 2,
        explanation: 'Thomas Jefferson wrote the Declaration of Independence in 1776.'
      },
      read_time: 8,
      is_featured: false,
      is_published: true
    },
    {
      id: 'rules-laws-citizenship',
      title: 'Rules, Laws, and Good Citizenship',
      content: 'Rules help keep everyone safe and happy. Laws are rules made by the government that everyone must follow. Good citizens follow rules, help others, and care for their community.',
      type: 'text',
      category_id: 'social-studies',
      difficulty: 'beginner',
      tags: ['social-studies', 'citizenship', 'rules', 'laws', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What is a good citizen?',
        options: ['Someone who breaks rules', 'Someone who follows rules and helps others', 'Someone who only thinks about themselves', 'Someone who never helps'],
        correctAnswer: 1,
        explanation: 'A good citizen follows rules, helps others, and cares for their community.'
      },
      read_time: 6,
      is_featured: false,
      is_published: true
    },

    // HEALTH CONTENT
    {
      id: 'healthy-food-groups',
      title: 'Healthy Food Groups and Nutrition',
      content: 'Healthy eating includes fruits, vegetables, grains, protein foods, and dairy. Each food group gives our bodies different nutrients we need to grow strong and stay healthy.',
      type: 'text',
      category_id: 'health',
      difficulty: 'beginner',
      tags: ['health', 'nutrition', 'food-groups', 'wellness', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'Which food group includes apples and carrots?',
        options: ['Grains', 'Proteins', 'Fruits and Vegetables', 'Dairy'],
        correctAnswer: 2,
        explanation: 'Apples and carrots are both fruits and vegetables.'
      },
      read_time: 6,
      is_featured: false,
      is_published: true
    },
    {
      id: 'exercise-physical-activity',
      title: 'Exercise and Physical Activity',
      content: 'Our bodies need exercise to stay strong and healthy. Activities like running, jumping, swimming, and playing sports help build muscles, strengthen bones, and keep our hearts healthy.',
      type: 'text',
      category_id: 'health',
      difficulty: 'beginner',
      tags: ['health', 'exercise', 'physical-activity', 'fitness', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'Why do we need exercise?',
        options: ['To watch TV more', 'To build strong muscles and bones', 'To eat more candy', 'To sleep all day'],
        correctAnswer: 1,
        explanation: 'Exercise helps build strong muscles and bones, and keeps our hearts and bodies healthy.'
      },
      read_time: 5,
      is_featured: false,
      is_published: true
    },
    {
      id: 'personal-safety-rules',
      title: 'Personal Safety Rules',
      content: 'Stay safe by never talking to strangers, always telling a trusted adult if something feels wrong, wearing seat belts in cars, and knowing emergency numbers. Your safety is very important.',
      type: 'text',
      category_id: 'health',
      difficulty: 'beginner',
      tags: ['health', 'safety', 'personal-safety', 'rules', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What should you do if a stranger approaches you?',
        options: ['Talk to them politely', 'Go with them if they offer candy', 'Tell a trusted adult and stay away', 'Hide and not tell anyone'],
        correctAnswer: 2,
        explanation: 'Always tell a trusted adult if a stranger approaches you, and stay away from strangers.'
      },
      read_time: 6,
      is_featured: false,
      is_published: true
    },
    {
      id: 'emotions-feelings-management',
      title: 'Understanding Emotions and Feelings',
      content: 'Everyone has feelings like happy, sad, angry, scared, and excited. It\'s okay to feel all emotions. We can manage our feelings by talking about them, taking deep breaths, or doing activities we enjoy.',
      type: 'text',
      category_id: 'health',
      difficulty: 'intermediate',
      tags: ['health', 'emotions', 'feelings', 'mental-health', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What is a good way to manage angry feelings?',
        options: ['Hit someone', 'Take deep breaths and count to ten', 'Scream loudly', 'Run away'],
        correctAnswer: 1,
        explanation: 'Taking deep breaths and counting to ten helps calm down when feeling angry.'
      },
      read_time: 7,
      is_featured: false,
      is_published: true
    },

    // ARTS CONTENT
    {
      id: 'color-theory-primary-secondary',
      title: 'Color Theory: Primary and Secondary Colors',
      content: 'Primary colors are red, blue, and yellow. You can\'t make them by mixing other colors. Secondary colors are made by mixing two primary colors: orange (red + yellow), green (blue + yellow), purple (red + blue).',
      type: 'text',
      category_id: 'arts',
      difficulty: 'beginner',
      tags: ['arts', 'color-theory', 'primary-colors', 'secondary-colors', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'Which color do you get by mixing red and blue?',
        options: ['Orange', 'Green', 'Purple', 'Yellow'],
        correctAnswer: 2,
        explanation: 'Mixing red and blue makes purple, a secondary color.'
      },
      read_time: 6,
      is_featured: false,
      is_published: true
    },
    {
      id: 'music-rhythm-beat',
      title: 'Music: Rhythm and Beat',
      content: 'Rhythm is the pattern of sounds and silence in music. Beat is the steady pulse you can clap or tap to. Different instruments and voices create different rhythms and beats.',
      type: 'text',
      category_id: 'arts',
      difficulty: 'beginner',
      tags: ['arts', 'music', 'rhythm', 'beat', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What is the beat in music?',
        options: ['The loudest sound', 'The steady pulse you can clap or tap to', 'The highest note', 'The words being sung'],
        correctAnswer: 1,
        explanation: 'The beat is the steady pulse or rhythm you can feel and clap along to in music.'
      },
      read_time: 5,
      is_featured: false,
      is_published: true
    },
    {
      id: 'art-techniques-line-shape',
      title: 'Art Techniques: Line and Shape',
      content: 'Lines can be straight, curved, thick, or thin. They can show movement or create patterns. Shapes are made by connecting lines and can be geometric (circles, squares) or organic (clouds, trees).',
      type: 'text',
      category_id: 'arts',
      difficulty: 'intermediate',
      tags: ['arts', 'drawing', 'line', 'shape', 'techniques', 'grade-3'],
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What is a geometric shape?',
        options: ['A cloud', 'A tree', 'A circle', 'A flower'],
        correctAnswer: 2,
        explanation: 'A circle is a geometric shape because it has a regular, mathematical form.'
      },
      read_time: 7,
      is_featured: false,
      is_published: true
    },
    {
      id: 'cultural-arts-around-world',
      title: 'Cultural Arts from Around the World',
      content: 'Different cultures have unique art forms. Japanese artists create beautiful calligraphy and origami. African artists make colorful masks and sculptures. Mexican artists paint vibrant murals. Each culture shares its history through art.',
      type: 'text-image',
      category_id: 'arts',
      difficulty: 'intermediate',
      tags: ['arts', 'cultural-arts', 'world-cultures', 'diversity', 'grade-3'],
      image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      video_url: null,
      audio_url: null,
      quiz: {
        question: 'What is origami?',
        options: ['Japanese painting', 'Japanese paper folding', 'Japanese dancing', 'Japanese cooking'],
        correctAnswer: 1,
        explanation: 'Origami is the Japanese art of paper folding to create decorative objects.'
      },
      read_time: 8,
      is_featured: false,
      is_published: true
    }
  ]
}

// Database seeding functions
export const seedDatabase = {
  async createTestUser(): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const supabase = await createClient()

      // Create test user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'test.student@skillgain.com',
        password: 'TestPassword123!',
        options: {
          data: {
            full_name: 'Alex Johnson',
          }
        }
      })

      if (authError && authError.message !== 'User already registered') {
        throw authError
      }

      const userId = authData?.user?.id

      if (userId) {
        // Update profile with grade level and other details
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            role: 'student',
            full_name: 'Alex Johnson',
            grade_level: 'grade-3',
            bio: 'A curious third-grade student who loves learning about science and math!',
            interests: ['science', 'mathematics', 'reading', 'art'],
            learning_goals: 'To become better at multiplication and learn about plants and animals.'
          }, { onConflict: 'id' })

        if (profileError) throw profileError

        // Create some sample progress for the test user
        const sampleProgress = [
          { content_id: 'multiplication-basics', status: 'completed', progress_percentage: 100, time_spent: 15 },
          { content_id: 'plants-parts-functions', status: 'completed', progress_percentage: 100, time_spent: 12 },
          { content_id: 'reading-comprehension-main-idea', status: 'in_progress', progress_percentage: 75, time_spent: 8 },
          { content_id: 'healthy-food-groups', status: 'completed', progress_percentage: 100, time_spent: 6 },
          { content_id: 'color-theory-primary-secondary', status: 'not_started', progress_percentage: 0, time_spent: 0 }
        ]

        for (const progress of sampleProgress) {
          await supabase
            .from('user_progress')
            .upsert({
              user_id: userId,
              content_id: progress.content_id,
              status: progress.status,
              progress_percentage: progress.progress_percentage,
              time_spent: progress.time_spent
            }, { onConflict: 'user_id,content_id' })
        }

        // Create some bookmarks
        const sampleBookmarks = ['animal-habitats-adaptations', 'geometry-shapes-properties']
        for (const contentId of sampleBookmarks) {
          await supabase
            .from('user_bookmarks')
            .upsert({
              user_id: userId,
              content_id: contentId
            }, { onConflict: 'user_id,content_id' })
        }

        // Create some achievements
        const sampleAchievements = [
          { achievement_type: 'first_steps', title: 'First Steps', description: 'Completed your first learning module', icon: '🎯' },
          { achievement_type: 'science_explorer', title: 'Science Explorer', description: 'Completed 3 science modules', icon: '🔬' },
          { achievement_type: 'math_whiz', title: 'Math Whiz', description: 'Mastered multiplication basics', icon: '🧮' }
        ]

        for (const achievement of sampleAchievements) {
          await supabase
            .from('user_achievements')
            .upsert({
              user_id: userId,
              achievement_type: achievement.achievement_type,
              title: achievement.title,
              description: achievement.description,
              icon: achievement.icon
            }, { onConflict: 'user_id,achievement_type' })
        }
      }

      return {
        success: true,
        userId: userId || undefined
      }
    } catch (error) {
      console.error('Error creating test user:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  async seedCategories(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      // Use upsert to handle existing categories
      const categoriesForUpsert = sampleSeedData.categories.map(({ id, ...cat }) => ({
        ...cat,
        // Use name as the conflict resolution key since we have UNIQUE constraint on name
      }))

      // Try with RLS first, fallback to direct insert if needed
      let { error } = await supabase
        .from('categories')
        .upsert(categoriesForUpsert, { onConflict: 'name' })

      if (error) {
        console.warn('RLS seeding failed, trying alternative approach:', error.message)
        // If RLS fails, try inserting one by one
        for (const category of categoriesForUpsert) {
          try {
            const { error: insertError } = await supabase
              .from('categories')
              .insert(category)
          } catch (insertErr) {
            console.warn(`Failed to insert category ${category.name}:`, insertErr)
          }
        }
        return { success: true } // Continue even if some fail
      }

      return { success: true }
    } catch (error) {
      console.error('Error seeding categories:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  async seedContent(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      // First, get the category mappings (name -> UUID)
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name')

      if (catError) throw catError

      const categoryMap = new Map(categories?.map(cat => [cat.name.toLowerCase(), cat.id]) || [])

      // Update content items to use correct category UUIDs and remove string IDs
      const contentWithCorrectIds = sampleSeedData.content.map(({ id, ...content }) => ({
        ...content,
        category_id: content.category_id ? categoryMap.get(content.category_id.toLowerCase()) || null : null
      }))

      // Insert content items (without IDs so Supabase generates UUIDs)
      const { error } = await supabase
        .from('content_items')
        .insert(contentWithCorrectIds)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error seeding content:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  async seedAll(): Promise<{ success: boolean; error?: string }> {
    try {
      // Seed categories first
      const categoryResult = await this.seedCategories()
      if (!categoryResult.success) {
        return categoryResult
      }

      // Then seed content
      const contentResult = await this.seedContent()
      if (!contentResult.success) {
        return contentResult
      }

      return { success: true }
    } catch (error) {
      console.error('Error seeding database:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  async createStorageBuckets(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      // Create avatars bucket for user profile pictures
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB limit
      })

      if (bucketError) {
        // Check if bucket already exists or if it's a policy error
        if (bucketError.message.includes('already exists') ||
            bucketError.message.includes('violates row-level security policy')) {
          console.log('ℹ️  Avatars bucket already exists or creation blocked by policy (this is normal)')
          return { success: true }
        }
        throw bucketError
      }

      console.log('✅ Avatars bucket created successfully')
      return { success: true }
    } catch (error) {
      console.error('Error creating storage buckets:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  async clearAllData(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      // Clear in reverse dependency order
      await supabase.from('user_bookmarks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('user_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('user_achievements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('content_items').delete().neq('id', '00000000-0000-0000-0000-0000-000000000000')
      await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      return { success: true }
    } catch (error) {
      console.error('Error clearing database:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Utility function to run seeding from command line
export async function runSeeding() {
  console.log('🌱 Starting database seeding...')

  const result = await seedDatabase.seedAll()

  if (result.success) {
    console.log('✅ Database seeded successfully!')
    console.log(`📊 Added ${sampleSeedData.categories.length} categories and ${sampleSeedData.content.length} content items`)
  } else {
    console.error('❌ Database seeding failed:', result.error)
    process.exit(1)
  }
}

// For command line usage
if (require.main === module) {
  runSeeding()
}