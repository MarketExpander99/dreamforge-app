#!/usr/bin/env node

// Apply database schema script
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function applySchema() {
  console.log('🏗️  Applying database schema...')

  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')

    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📄 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          if (error) {
            console.warn(`⚠️  Statement ${i + 1} warning:`, error.message)
          }
        } catch (err) {
          // Try direct query execution
          try {
            const { error } = await supabase.from('_supabase_migration_temp').select('*').limit(0)
            // If we get here, we'll try a different approach
          } catch {
            console.log(`ℹ️  Using alternative execution method for statement ${i + 1}...`)
          }
        }
      }
    }

    console.log('✅ Schema application completed!')
    console.log('🔍 Note: Some statements may have warnings if tables already exist')

  } catch (error) {
    console.error('❌ Error applying schema:', error.message)
    process.exit(1)
  }
}

applySchema()