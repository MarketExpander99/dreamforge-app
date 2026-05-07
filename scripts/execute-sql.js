const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function executeSQL() {
  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase environment variables not found');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('Connected to Supabase...');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'sprint2-content-seeding.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('Executing SQL file...');

    // Since we can't execute raw SQL with Supabase client, let's try a different approach
    // We'll parse the SQL and execute the inserts using the client

    // For now, let's just try to execute a simple test query
    const { data, error } = await supabase.from('curriculums').select('id, name').limit(1);

    if (error) {
      console.error('Database connection test failed:', error);
      process.exit(1);
    }

    console.log('Database connection successful!');
    console.log('Found curriculum:', data);

    // Since raw SQL execution isn't supported, let's inform the user
    console.log('\nNote: The SQL file has been fixed (difficulty values updated from beginner/advanced to easy/hard)');
    console.log('To execute the SQL file, you can:');
    console.log('1. Copy the SQL content to the Supabase SQL Editor in the dashboard');
    console.log('2. Or use psql with the connection string:');
    console.log(`   psql "postgresql://postgres:${serviceRoleKey}@db.gghlopwcyvsijckmzfeu.supabase.co:5432/postgres" -f scripts/sprint2-content-seeding.sql`);

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

executeSQL();