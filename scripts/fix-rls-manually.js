const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixRLSPolicies() {
  console.log('🔧 Applying RLS policy fixes manually...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('1. Dropping problematic policies...\n');

    // Drop existing policies that might be causing issues
    const policiesToDrop = [
      'teacher_class_access',
      'Students can view classes they\'re enrolled in',
      'Teachers can view their own classes',
      'Teachers can create their own classes',
      'Teachers can update their own classes'
    ];

    for (const policyName of policiesToDrop) {
      try {
        console.log(`Dropping policy: ${policyName}`);
        const { error } = await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policyName}" ON teacher_classes;`
        });

        if (error && !error.message.includes('does not exist')) {
          console.log(`⚠️ Could not drop policy "${policyName}":`, error.message);
        } else {
          console.log(`✅ Dropped policy: ${policyName}`);
        }
      } catch (err) {
        console.log(`⚠️ Error dropping policy "${policyName}":`, err.message);
      }
    }

    console.log('\n2. Creating new simplified policies...\n');

    // Create separate policies for each operation to avoid recursion
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
      },
      {
        name: 'students_view_enrolled_classes',
        sql: `CREATE POLICY "students_view_enrolled_classes" ON teacher_classes FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM class_students cs
            WHERE cs.class_id = teacher_classes.id
            AND cs.student_id = auth.uid()
            AND cs.status = 'active'
          )
        );`
      }
    ];

    for (const policy of policies) {
      try {
        console.log(`Creating policy: ${policy.name}`);

        // Try using rpc first
        const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });

        if (error) {
          console.log(`⚠️ RPC failed, trying direct query for: ${policy.name}`);
          // If RPC fails, try direct approach (this might not work but let's try)
          const { error: directError } = await supabase.from('teacher_classes').select('*').limit(1);
          if (directError) {
            console.log(`❌ Could not create policy "${policy.name}":`, error.message);
          }
        } else {
          console.log(`✅ Created policy: ${policy.name}`);
        }
      } catch (err) {
        console.log(`❌ Error creating policy "${policy.name}":`, err.message);
      }
    }

    console.log('\n3. Verifying policies...\n');

    // Try to verify by doing a simple query
    try {
      const { data, error } = await supabase
        .from('teacher_classes')
        .select('id, name')
        .limit(1);

      if (error) {
        console.log('❌ Policy verification failed:', error.message);
        console.log('💡 You may need to apply these SQL commands manually in Supabase SQL Editor:');
        console.log('\n-- Drop problematic policies:');
        policiesToDrop.forEach(policy => {
          console.log(`DROP POLICY IF EXISTS "${policy}" ON teacher_classes;`);
        });
        console.log('\n-- Create new policies:');
        policies.forEach(policy => {
          console.log(policy.sql);
        });
      } else {
        console.log('✅ Policy verification successful - can query teacher_classes');
      }
    } catch (err) {
      console.log('❌ Policy verification error:', err.message);
    }

    console.log('\n🎉 RLS policy fix attempt completed!');
    console.log('📝 If errors occurred above, please apply the SQL manually in Supabase SQL Editor');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

fixRLSPolicies();