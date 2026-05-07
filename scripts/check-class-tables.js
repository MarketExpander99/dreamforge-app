const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('🔍 Checking if teacher_classes and class_students tables exist...')

  try {
    // Check teacher_classes table
    const { data: classesData, error: classesError } = await supabase
      .from('teacher_classes')
      .select('count', { count: 'exact', head: true })

    if (classesError) {
      console.log('❌ teacher_classes table does not exist or is not accessible')
      console.log('Error:', classesError.message)
    } else {
      console.log('✅ teacher_classes table exists')
    }

    // Check class_students table
    const { data: studentsData, error: studentsError } = await supabase
      .from('class_students')
      .select('count', { count: 'exact', head: true })

    if (studentsError) {
      console.log('❌ class_students table does not exist or is not accessible')
      console.log('Error:', studentsError.message)
    } else {
      console.log('✅ class_students table exists')
    }

    // Check profiles table has teacher role
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('role')
      .limit(1)

    if (profilesError) {
      console.log('❌ profiles table check failed')
      console.log('Error:', profilesError.message)
    } else {
      console.log('✅ profiles table exists and is accessible')
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
  }
}

checkTables()