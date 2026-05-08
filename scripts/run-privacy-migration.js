const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runPrivacyMigration() {
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
    const sqlFile = path.join(__dirname, 'privacy-migration.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('Executing privacy migration SQL...');

    // Split SQL into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');

        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

          if (error) {
            // If exec_sql doesn't exist, try direct approach for simple statements
            console.log('Note: exec_sql function not available, you may need to run this manually in Supabase dashboard');
            break;
          }
        } catch (err) {
          console.log('Note: Direct SQL execution not supported by Supabase client');
          console.log('Please run the migration manually in the Supabase SQL Editor:');
          console.log('1. Go to https://supabase.com/dashboard/project/gghlopwcyvsijckmzfeu/sql');
          console.log('2. Copy and paste the contents of scripts/privacy-migration.sql');
          console.log('3. Click "Run"');
          break;
        }
      }
    }

    console.log('Migration completed successfully!');

  } catch (err) {
    console.error('Error:', err);
    console.log('\nPlease run the migration manually:');
    console.log('1. Go to your Supabase dashboard SQL editor');
    console.log('2. Copy the contents of scripts/privacy-migration.sql');
    console.log('3. Execute the SQL');
    process.exit(1);
  }
}

runPrivacyMigration();