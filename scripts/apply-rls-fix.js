const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyRLSFix() {
  console.log('🔧 Applying RLS policy fix for teacher_classes...\n')

  try {
    // First, let's check current policies
    console.log('Checking current policies...')
    const { data: currentPolicies, error: checkError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'teacher_classes')

    if (checkError) {
      console.log('❌ Error checking policies:', checkError.message)
    } else {
      console.log(`Found ${currentPolicies.length} existing policies`)
      currentPolicies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`)
      })
    }

    console.log('\nApplying policy fixes...')

    // Drop existing policies one by one
    const policiesToDrop = [
      "Students can view classes they're enrolled in",
      "Teachers can view their own classes",
      "Teachers can create their own classes",
      "Teachers can update their own classes"
    ]

    for (const policyName of policiesToDrop) {
      console.log(`Dropping policy: ${policyName}`)
      const { error: dropError } = await supabase.rpc('execute_sql', {
        sql: `DROP POLICY IF EXISTS "${policyName}" ON teacher_classes;`
      })

      if (dropError) {
        console.log(`⚠️  Could not drop policy "${policyName}":`, dropError.message)
      } else {
        console.log(`✅ Dropped policy: ${policyName}`)
      }
    }

    // Create the new comprehensive policy
    console.log('\nCreating new comprehensive policy...')
    const createPolicySQL = `
      CREATE POLICY "teacher_class_access" ON teacher_classes
      FOR ALL USING (
        auth.uid() = teacher_id OR
        EXISTS (
          SELECT 1 FROM class_students cs
          WHERE cs.class_id = teacher_classes.id
          AND cs.student_id = auth.uid()
          AND cs.status = 'active'
        )
      )
      WITH CHECK (auth.uid() = teacher_id);
    `

    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: createPolicySQL
    })

    if (createError) {
      console.log('❌ Error creating new policy:', createError.message)
      console.log('Policy SQL:', createPolicySQL)
      return
    }

    console.log('✅ New comprehensive policy created successfully!')

    // Verify the policy was created
    console.log('\nVerifying policy creation...')
    const { data: newPolicies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'teacher_classes')

    if (verifyError) {
      console.log('❌ Error verifying policies:', verifyError.message)
    } else {
      console.log(`✅ Verification: ${newPolicies.length} policies now exist`)
      newPolicies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`)
      })
    }

    console.log('\n🎉 RLS policy fix completed!')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

applyRLSFix()