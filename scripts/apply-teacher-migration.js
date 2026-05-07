const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function applyTeacherMigration() {
  console.log('🔄 Applying teacher role migration...\n');

  // Use direct PostgreSQL connection for schema changes
  const { Client } = require('pg');

  const client = new Client({
    connectionString: process.env.DATABASE_URL || `postgresql://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@db.${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]?.split('.')[0]}.supabase.co:5432/postgres`
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('1. Dropping old role constraint...');
    await client.query('ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;');
    console.log('✅ Constraint dropped');

    console.log('2. Adding new role constraint with teacher support...');
    await client.query("ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('parent', 'student', 'teacher'));");
    console.log('✅ Constraint added');

    console.log('3. Adding teacher_onboarding_completed column...');
    await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS teacher_onboarding_completed BOOLEAN DEFAULT false;');
    console.log('✅ Column added');

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.log('❌ Error during migration:', error.message);
  } finally {
    await client.end();
  }
}

applyTeacherMigration();