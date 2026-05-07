const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies for teacher_classes...\n')

  try {
    // Check current policies
    const { data: policies, error } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
          FROM pg_policies
          WHERE tablename = 'teacher_classes'
          ORDER BY policyname;
        `
      })

    if (error) {
      console.log('❌ Error fetching policies:', error.message)
      return
    }

    console.log('Current RLS policies for teacher_classes:')
    policies.forEach(policy => {
      console.log(`- ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`)
      console.log(`  Roles: ${policy.roles || 'ALL'}`)
      console.log(`  Qual: ${policy.qual || 'NONE'}`)
      console.log('')
    })

    // Try to identify the issue - let's check if there are any circular references
    console.log('🔍 Analyzing potential issues...')

    // Check if the policies might be causing infinite recursion
    const insertPolicies = policies.filter(p => p.cmd === 'INSERT')
    const selectPolicies = policies.filter(p => p.cmd === 'SELECT')

    console.log(`Found ${insertPolicies.length} INSERT policies and ${selectPolicies.length} SELECT policies`)

    // The issue might be that the SELECT policy for students references class_students
    // but when inserting into teacher_classes, it might be trying to check this policy
    console.log('\n⚠️  Potential Issue: The "Students can view classes they\'re enrolled in" policy')
    console.log('   references class_students table, which might cause issues during INSERT operations.')
    console.log('   INSERT operations should not be affected by SELECT policies, but there might be')
    console.log('   a circular reference or policy conflict.')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkRLSPolicies()