import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Executing Sprint 2 content seeding...')

    const supabase = await createClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'sprint2-content-seeding.sql')
    const sql = fs.readFileSync(sqlFilePath, 'utf8')

    // Parse INSERT statements for assessment_questions
    const assessmentQuestions: any[] = []
    const lessonPlans: any[] = []
    const contentItems: any[] = []
    const lessonContentLinks: any[] = []

    // Simple parsing of INSERT statements
    const lines = sql.split('\n')
    let currentTable = ''
    let currentInsert = ''

    for (const line of lines) {
      if (line.includes('INSERT INTO assessment_questions')) {
        currentTable = 'assessment_questions'
        currentInsert = line
      } else if (line.includes('INSERT INTO lesson_plans')) {
        currentTable = 'lesson_plans'
        currentInsert = line
      } else if (line.includes('INSERT INTO content_items')) {
        currentTable = 'content_items'
        currentInsert = line
      } else if (line.includes('INSERT INTO lesson_content')) {
        currentTable = 'lesson_content'
        currentInsert = line
      } else if (line.trim() && currentInsert && !line.includes('ON CONFLICT') && !line.includes('VALUES')) {
        currentInsert += ' ' + line.trim()
      } else if (line.includes('VALUES') && currentInsert) {
        currentInsert += ' ' + line.trim()
      } else if (line.includes(');') && currentInsert) {
        currentInsert += ' ' + line.trim()

        // Parse the INSERT statement
        try {
          if (currentTable === 'assessment_questions') {
            const valuesMatch = currentInsert.match(/VALUES\s*\(([^)]+)\)/)
            if (valuesMatch) {
              const values = valuesMatch[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''))
              if (values.length >= 10) {
                assessmentQuestions.push({
                  curriculum_id: values[0].replace(/^\(|\)$/g, ''),
                  subject: values[1].replace(/'/g, ''),
                  grade_level: values[2].replace(/'/g, ''),
                  question_type: values[3].replace(/'/g, ''),
                  question: values[4].replace(/'/g, ''),
                  options: values[5],
                  correct_answer: values[6].replace(/'/g, ''),
                  difficulty: values[7].replace(/'/g, ''),
                  points: parseInt(values[8]),
                  is_active: values[9] === 'true'
                })
              }
            }
          } else if (currentTable === 'lesson_plans') {
            const valuesMatch = currentInsert.match(/VALUES\s*\(([^)]+)\)/)
            if (valuesMatch) {
              const values = valuesMatch[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''))
              if (values.length >= 10) {
                lessonPlans.push({
                  subject_id: values[0].replace(/^\(|\)$/g, ''),
                  grade_level: values[1].replace(/'/g, ''),
                  title: values[2].replace(/'/g, ''),
                  description: values[3].replace(/'/g, ''),
                  duration_minutes: parseInt(values[4]),
                  sequence_order: parseInt(values[5]),
                  unit_title: values[6].replace(/'/g, ''),
                  term: values[7].replace(/'/g, ''),
                  week: parseInt(values[8]),
                  difficulty: values[9].replace(/'/g, ''),
                  tags: values[10]
                })
              }
            }
          }
        } catch (parseError) {
          console.log('Parse error for:', currentInsert.substring(0, 100))
        }

        currentInsert = ''
        currentTable = ''
      }
    }

    console.log(`Parsed ${assessmentQuestions.length} assessment questions`)
    console.log(`Parsed ${lessonPlans.length} lesson plans`)

    // Insert assessment questions
    if (assessmentQuestions.length > 0) {
      console.log('Inserting assessment questions...')
      const { error: assessmentError } = await supabase
        .from('assessment_questions')
        .upsert(assessmentQuestions, {
          onConflict: 'curriculum_id,subject,grade_level,question',
          ignoreDuplicates: true
        })

      if (assessmentError) {
        console.error('Error inserting assessment questions:', assessmentError)
        return NextResponse.json({
          success: false,
          message: 'Failed to insert assessment questions',
          error: assessmentError.message
        }, { status: 500 })
      }
    }

    // Insert lesson plans
    if (lessonPlans.length > 0) {
      console.log('Inserting lesson plans...')
      const { error: lessonError } = await supabase
        .from('lesson_plans')
        .upsert(lessonPlans, { onConflict: 'subject_id,grade_level,title' })

      if (lessonError) {
        console.error('Error inserting lesson plans:', lessonError)
        return NextResponse.json({
          success: false,
          message: 'Failed to insert lesson plans',
          error: lessonError.message
        }, { status: 500 })
      }
    }

    console.log('✅ Successfully executed Sprint 2 content seeding')

    return NextResponse.json({
      success: true,
      message: 'Successfully executed Sprint 2 content seeding',
      assessmentQuestionsCount: assessmentQuestions.length,
      lessonPlansCount: lessonPlans.length
    })

  } catch (err: any) {
    console.error('Error executing SQL:', err)
    return NextResponse.json({
      success: false,
      message: 'Failed to execute SQL file',
      error: err.message
    }, { status: 500 })
  }
}
