const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applySeparatePoliciesFix() {
  console.log('🔧 Applying separate RLS policies fix for teacher_classes...\n')

  try {
    // First, drop any existing problematic policies
    console.log('Dropping existing policies...')
    const dropPoliciesSQL = `
      DROP POLICY IF EXISTS "teacher_class_access" ON teacher_classes;
      DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON teacher_classes;
      DROP POLICY IF EXISTS "Teachers can view their own classes" ON teacher_classes;
      DROP POLICY IF EXISTS "Teachers can create their own classes" ON teacher_classes;
      DROP POLICY IF EXISTS "Teachers can update their own classes" ON teacher_classes;
    `

    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: dropPoliciesSQL
    })

    if (dropError) {
      console.log('⚠️  Warning: Could not drop some policies:', dropError.message)
    } else {
      console.log('✅ Existing policies dropped')
    }

    // Create separate policies for different operations
    console.log('\nCreating separate policies...')

    const policies = [
      {
        name: 'teachers_select_own_classes',
        sql: `CREATE POLICY "teachers_select_own_classes" ON teacher_classes FOR SELECT USING (auth.uid() = teacher_id);`
      },
      {
        name: 'teachers_insert_own_classes',
        sql: `CREATE POLICY "teachers_insert_own_classes" ON teacher_classes FOR INSERT WITH CHECK (auth.uid() = teacher_id);`
      },
      {
        name: 'teachers_update_own_classes',
        sql: `CREATE POLICY "teachers_update_own_classes" ON teacher_classes FOR UPDATE USING (auth.uid() = teacher_id);`
      },
      {
        name: 'teachers_delete_own_classes',
        sql: `CREATE POLICY "teachers_delete_own_classes" ON teacher_classes FOR DELETE USING (auth.uid() = teacher_id);`
      }
    ]

    for (const policy of policies) {
      console.log(`Creating policy: ${policy.name}`)
      const { error: policyError } = await supabase.rpc('execute_sql', {
        sql: policy.sql
      })

      if (policyError) {
        console.log(`❌ Error creating ${policy.name}:`, policyError.message)
        return
      } else {
        console.log(`✅ Created ${policy.name}`)
      }
    }

    // Optionally add student access policy (commented out for now to avoid circular reference)
    console.log('\n⚠️  Skipping student access policy to avoid circular reference')
    console.log('   Students can access classes through the join page without direct table access')

    // Verify policies were created
    console.log('\nVerifying policy creation...')
    const { data: newPolicies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'teacher_classes')

    if (verifyError) {
      console.log('❌ Error verifying policies:', verifyError.message)
    } else {
      console.log(`✅ Verification: ${newPolicies.length} policies now exist for teacher_classes`)
      newPolicies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`)
      })
    }

    console.log('\n🎉 Separate RLS policies fix completed!')
    console.log('\n📋 Summary:')
    console.log('✅ Teachers can SELECT their own classes')
    console.log('✅ Teachers can INSERT their own classes')
    console.log('✅ Teachers can UPDATE their own classes')
    console.log('✅ Teachers can DELETE their own classes')
    console.log('⚠️  Student access handled through join page (not direct table access)')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

applySeparatePoliciesFix()