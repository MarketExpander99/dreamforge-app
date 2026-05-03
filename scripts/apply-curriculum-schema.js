#!/usr/bin/env node

// Apply curriculum database schema script
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function applyCurriculumSchema() {
  console.log('🏗️  Applying curriculum database schema...')

  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Read the curriculum schema file
    const schemaPath = path.join(__dirname, '..', 'database-curriculum.sql')
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
          // Try using the SQL editor approach
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
          if (error) {
            console.warn(`⚠️  Statement ${i + 1} warning:`, error.message)
          }
        } catch (err) {
          console.log(`ℹ️  Statement ${i + 1} may need manual execution: ${statement.substring(0, 50)}...`)
        }
      }
    }

    console.log('✅ Curriculum schema application completed!')
    console.log('🔍 Note: Some statements may need manual execution in Supabase dashboard')

  } catch (error) {
    console.error('❌ Error applying curriculum schema:', error.message)
    process.exit(1)
  }
}

applyCurriculumSchema()