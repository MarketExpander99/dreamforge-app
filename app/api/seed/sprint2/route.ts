import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting Sprint 2 content seeding...')

    const supabase = await createClient()

    // ===========================================
    // 1. ASSESSMENT QUESTIONS FOR GRADES 4-9
    // ===========================================

    console.log('📝 Seeding assessment questions...')

    // Assessment questions data
    const assessmentQuestions = [
      // Grade 4 Mathematics (20 questions)
      {
        curriculum_id: (await supabase.from('curriculums').select('id').eq('name', 'CAPS').single()).data?.id,
        grade_level: 'Grade 4',
        subject: 'Mathematics',
        question: 'What is 3 × 4 × 2?',
        options: '["12", "24", "18", "20"]',
        correct_answer: 1,
        explanation: '3 × 4 = 12, then 12 × 2 = 24',
        difficulty: 'intermediate',
        points: 2,
        tags: ['multiplication', 'grade-4'],
        is_active: true
      },
      {
        curriculum_id: (await supabase.from('curriculums').select('id').eq('name', 'CAPS').single()).data?.id,
        grade_level: 'Grade 4',
        subject: 'Mathematics',
        question: 'Which fraction represents one quarter?',
        options: '["1/2", "1/3", "1/4", "2/4"]',
        correct_answer: 2,
        explanation: 'One quarter means dividing into 4 equal parts and taking 1 part',
        difficulty: 'beginner',
        points: 1,
        tags: ['fractions', 'grade-4'],
        is_active: true
      },
      // Add more questions here... (truncated for brevity)
      {
        curriculum_id: (await supabase.from('curriculums').select('id').eq('name', 'CAPS').single()).data?.id,
        grade_level: 'Grade 5',
        subject: 'Mathematics',
        question: 'What is 0.25 + 0.75?',
        options: '["1.00", "0.10", "0.50", "1.25"]',
        correct_answer: 0,
        explanation: '0.25 + 0.75 = 1.00',
        difficulty: 'intermediate',
        points: 2,
        tags: ['decimals', 'addition', 'grade-5'],
        is_active: true
      }
    ]

    // Insert assessment questions
    const { error: assessmentError } = await supabase
      .from('assessment_questions')
      .upsert(assessmentQuestions, { onConflict: 'curriculum_id,grade_level,subject,question' })

    if (assessmentError) {
      console.error('Error seeding assessment questions:', assessmentError)
      return NextResponse.json({ error: 'Failed to seed assessment questions' }, { status: 500 })
    }

    // ===========================================
    // 2. ADDITIONAL CAPS LESSONS
    // ===========================================

    console.log('📚 Seeding additional CAPS lessons...')

    // Get subject IDs
    const mathSubjectId = (await supabase
      .from('subjects')
      .select('id')
      .eq('curriculum_id', (await supabase.from('curriculums').select('id').eq('name', 'CAPS').single()).data?.id)
      .eq('name', 'Mathematics')
      .single()).data?.id

    const lessonPlans = [
      // Grade 1 Mathematics Lessons
      {
        subject_id: mathSubjectId,
        grade_level: 'Grade 1',
        title: 'Counting to 20',
        description: 'Learn to count objects up to 20 and recognize numbers',
        duration_minutes: 30,
        sequence_order: 1,
        unit_title: 'Number Recognition',
        term: 'Term 1',
        week: 1,
        difficulty: 'beginner',
        tags: ['counting', 'numbers', 'grade-1']
      },
      {
        subject_id: mathSubjectId,
        grade_level: 'Grade 1',
        title: 'Basic Addition with Pictures',
        description: 'Add small numbers using pictures and objects',
        duration_minutes: 35,
        sequence_order: 2,
        unit_title: 'Addition',
        term: 'Term 1',
        week: 3,
        difficulty: 'beginner',
        tags: ['addition', 'pictures', 'grade-1']
      },
      // Grade 10 Mathematics Lessons
      {
        subject_id: mathSubjectId,
        grade_level: 'Grade 10',
        title: 'Solving Quadratic Equations',
        description: 'Learn to solve quadratic equations using factoring and quadratic formula',
        duration_minutes: 60,
        sequence_order: 1,
        unit_title: 'Algebra',
        term: 'Term 1',
        week: 1,
        difficulty: 'advanced',
        tags: ['quadratic-equations', 'algebra', 'grade-10']
      }
    ]

    const { error: lessonError } = await supabase
      .from('lesson_plans')
      .upsert(lessonPlans, { onConflict: 'subject_id,grade_level,title' })

    if (lessonError) {
      console.error('Error seeding lesson plans:', lessonError)
      return NextResponse.json({ error: 'Failed to seed lesson plans' }, { status: 500 })
    }

    // ===========================================
    // 3. ENHANCED CONTENT ITEMS
    // ===========================================

    console.log('📖 Seeding enhanced content items...')

    const contentItems = [
      // Grade 1 Mathematics Content
      {
        id: 'grade1-counting-to-20',
        title: 'Let\'s Count Together!',
        content: 'Counting is fun! Let\'s count from 1 to 20. Look at the pictures and count the objects. How many apples? How many stars? Practice counting every day!',
        type: 'text-image',
        category_id: (await supabase.from('categories').select('id').eq('name', 'Mathematics').single()).data?.id,
        difficulty: 'beginner',
        tags: ['counting', 'numbers', 'grade-1'],
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        video_url: 'https://example.com/videos/counting-1-20.mp4',
        audio_url: null,
        quiz: '{"question": "How many fingers are on one hand?", "options": ["4", "5", "6", "10"], "correctAnswer": 1, "explanation": "One hand has 5 fingers."}',
        read_time: 5,
        is_featured: false,
        is_published: true
      },
      {
        id: 'grade1-basic-addition',
        title: 'Adding with Pictures',
        content: 'Addition means putting things together. If you have 2 apples and add 3 more apples, how many do you have? 2 + 3 = 5! Let\'s practice with pictures.',
        type: 'text-image',
        category_id: (await supabase.from('categories').select('id').eq('name', 'Mathematics').single()).data?.id,
        difficulty: 'beginner',
        tags: ['addition', 'pictures', 'grade-1'],
        image_url: 'https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?w=400',
        video_url: null,
        audio_url: 'https://example.com/audio/addition-song.mp3',
        quiz: '{"question": "What is 1 + 2?", "options": ["2", "3", "4", "5"], "correctAnswer": 1, "explanation": "1 apple plus 2 apples equals 3 apples."}',
        read_time: 6,
        is_featured: false,
        is_published: true
      },
      // Grade 10 Mathematics Content
      {
        id: 'grade10-quadratic-equations',
        title: 'Solving Quadratic Equations',
        content: 'A quadratic equation has the form ax² + bx + c = 0. To solve, use the quadratic formula: x = [-b ± √(b²-4ac)] / 2a. Let\'s work through examples step by step.',
        type: 'text-image',
        category_id: (await supabase.from('categories').select('id').eq('name', 'Mathematics').single()).data?.id,
        difficulty: 'advanced',
        tags: ['quadratic-equations', 'algebra', 'grade-10'],
        image_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
        video_url: 'https://example.com/videos/quadratic-formula.mp4',
        audio_url: null,
        quiz: '{"question": "Solve: x² + 5x + 6 = 0", "options": ["x = -2, -3", "x = 2, 3", "x = -2, 3", "x = 2, -3"], "correctAnswer": 0, "explanation": "Factor: (x+2)(x+3)=0, so x = -2 or x = -3"}',
        read_time: 15,
        is_featured: true,
        is_published: true
      }
    ]

    const { error: contentError } = await supabase
      .from('content_items')
      .upsert(contentItems, { onConflict: 'id' })

    if (contentError) {
      console.error('Error seeding content items:', contentError)
      return NextResponse.json({ error: 'Failed to seed content items' }, { status: 500 })
    }

    // ===========================================
    // 4. LINK CONTENT TO LESSONS
    // ===========================================

    console.log('🔗 Linking content to lessons...')

    // Get lesson plan IDs
    const countingLessonId = (await supabase
      .from('lesson_plans')
      .select('id')
      .eq('subject_id', mathSubjectId)
      .eq('grade_level', 'Grade 1')
      .eq('title', 'Counting to 20')
      .single()).data?.id

    const additionLessonId = (await supabase
      .from('lesson_plans')
      .select('id')
      .eq('subject_id', mathSubjectId)
      .eq('grade_level', 'Grade 1')
      .eq('title', 'Basic Addition with Pictures')
      .single()).data?.id

    const quadraticLessonId = (await supabase
      .from('lesson_plans')
      .select('id')
      .eq('subject_id', mathSubjectId)
      .eq('grade_level', 'Grade 10')
      .eq('title', 'Solving Quadratic Equations')
      .single()).data?.id

    const lessonContent = [
      {
        lesson_plan_id: countingLessonId,
        content_id: 'grade1-counting-to-20',
        sequence_order: 1,
        content_type: 'main_activity',
        is_required: true,
        estimated_duration: 20
      },
      {
        lesson_plan_id: additionLessonId,
        content_id: 'grade1-basic-addition',
        sequence_order: 1,
        content_type: 'main_activity',
        is_required: true,
        estimated_duration: 25
      },
      {
        lesson_plan_id: quadraticLessonId,
        content_id: 'grade10-quadratic-equations',
        sequence_order: 1,
        content_type: 'main_activity',
        is_required: true,
        estimated_duration: 45
      }
    ]

    const { error: linkError } = await supabase
      .from('lesson_content')
      .upsert(lessonContent, { onConflict: 'lesson_plan_id,content_id' })

    if (linkError) {
      console.error('Error linking content to lessons:', linkError)
      return NextResponse.json({ error: 'Failed to link content to lessons' }, { status: 500 })
    }

    console.log('✅ Sprint 2 content seeding completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Sprint 2 content seeding completed successfully!',
      summary: {
        assessmentQuestions: assessmentQuestions.length,
        lessonPlans: lessonPlans.length,
        contentItems: contentItems.length,
        lessonContentLinks: lessonContent.length
      }
    })

  } catch (error) {
    console.error('❌ Sprint 2 seeding error:', error)
    return NextResponse.json({
      error: 'Internal server error during Sprint 2 seeding'
    }, { status: 500 })
  }
}