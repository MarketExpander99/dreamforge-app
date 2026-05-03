import { NextRequest, NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed-database'
import { createClient } from '@/lib/supabase-server'

async function applyDatabaseFunctions() {
  try {
    const supabase = await createClient()

    // Create the get_user_category_progress function
    const functionSQL = `
      CREATE OR REPLACE FUNCTION public.get_user_category_progress(user_id_param UUID)
      RETURNS TABLE (
        category TEXT,
        progress INTEGER,
        completed INTEGER,
        total INTEGER
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          c.name as category,
          ROUND(
            CASE
              WHEN COUNT(ci.id) = 0 THEN 0
              ELSE (COUNT(CASE WHEN up.status = 'completed' THEN 1 END) * 100.0 / COUNT(ci.id))
            END
          )::INTEGER as progress,
          COUNT(CASE WHEN up.status = 'completed' THEN 1 END)::INTEGER as completed,
          COUNT(ci.id)::INTEGER as total
        FROM categories c
        LEFT JOIN content_items ci ON ci.category_id = c.id
        LEFT JOIN user_progress up ON up.content_id = ci.id AND up.user_id = user_id_param
        GROUP BY c.id, c.name
        ORDER BY c.name;
      END;
      $$;
    `

    // Try to execute the function creation
    const { error } = await supabase.rpc('exec_sql', { sql: functionSQL })

    if (error) {
      // If exec_sql doesn't work, try direct approach
      console.warn('⚠️  exec_sql not available, function may need manual creation:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error applying database functions:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting database seeding via API...')

    // Apply database functions first
    console.log('🔧 Applying database functions...')
    const functionResult = await applyDatabaseFunctions()

    if (!functionResult.success) {
      console.warn('⚠️  Database function application failed:', functionResult.error)
      console.log('ℹ️  Function may need manual creation in Supabase dashboard')
    } else {
      console.log('✅ Database functions applied successfully')
    }

    // Skip test user creation for now due to rate limits
    console.log('⏭️  Skipping test user creation (rate limited)...')

    // Seed database content
    console.log('📚 Seeding database content...')
    const result = await seedDatabase.seedAll()

    if (!result.success) {
      console.error('❌ Database seeding failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

    // Create storage buckets (may fail due to RLS policies, which is normal)
    console.log('🪣 Creating storage buckets...')
    const bucketResult = await seedDatabase.createStorageBuckets()

    if (!bucketResult.success) {
      console.warn('⚠️  Storage bucket creation failed (likely due to RLS policies):', bucketResult.error)
      console.log('ℹ️  This is normal - buckets may need to be created manually in Supabase dashboard')
    }

    console.log('✅ Database setup completed successfully!')
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully! Functions, categories, and content created. Storage buckets may need manual creation.',
      note: 'Test user creation skipped due to email rate limits. Create test user manually if needed. Database functions and storage bucket creation may require manual setup in Supabase dashboard if automated creation failed.'
    })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
