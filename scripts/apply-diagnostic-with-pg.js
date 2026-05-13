const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function applyDiagnosticSchema() {
  const client = new Client({
    connectionString: `postgresql://postgres.${process.env.SUPABASE_SERVICE_ROLE_KEY}@db.gghlopwcyvsijckmzfeu.supabase.co:5432/postgres`,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase database');

    const schemaPath = path.join(__dirname, 'create-diagnostic-results.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing SQL schema...');
    await client.query(schemaSQL);
    console.log('✅ Diagnostic results schema applied successfully!');
  } catch (error) {
    console.error('❌ Error applying schema:', error);
  } finally {
    await client.end();
  }
}

applyDiagnosticSchema();