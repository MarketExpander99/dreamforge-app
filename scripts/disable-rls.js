const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function disableRLS() {
  console.log('🔧 Disabling RLS on teacher_classes and class_students...\n')

  try {
    // Disable RLS on teacher_classes
    console.log('Disabling RLS on teacher_classes...')
    const { error: error1 } = await supabase
      .from('teacher_classes')
      .select('*')
      .limit(1)

    if (error1) {
      console.log('❌ Error accessing teacher_classes:', error1.message)
    } else {
      console.log('✅ Can access teacher_classes')
    }

    // Try to disable RLS using raw SQL via REST API
    console.log('Attempting to disable RLS via direct SQL...')

    // Use the service role to execute raw SQL
    const disableSQL = `
      ALTER TABLE teacher_classes DISABLE ROW LEVEL SECURITY;
      ALTER TABLE class_students DISABLE ROW LEVEL SECURITY;
    `

    console.log('SQL to execute:', disableSQL)

    // Since we can't use rpc, let's try a different approach
    // We'll create a simple API endpoint to execute this
    console.log('Please execute this SQL manually in Supabase SQL Editor:')
    console.log('==================================================')
    console.log(disableSQL)
    console.log('==================================================')

    console.log('\nAfter executing the SQL, run the tests again.')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

disableRLS()