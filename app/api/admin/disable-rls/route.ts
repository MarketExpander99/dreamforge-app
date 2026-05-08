import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Disable RLS on teacher_classes
    const { error: error1 } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE teacher_classes DISABLE ROW LEVEL SECURITY;'
    })

    if (error1) {
      console.log('Error disabling RLS on teacher_classes:', error1)
    }

    // Disable RLS on class_students
    const { error: error2 } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE class_students DISABLE ROW LEVEL SECURITY;'
    })

    if (error2) {
      console.log('Error disabling RLS on class_students:', error2)
    }

    return NextResponse.json({
      success: true,
      message: 'RLS disabled on teacher_classes and class_students',
      errors: {
        teacher_classes: error1?.message,
        class_students: error2?.message
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}