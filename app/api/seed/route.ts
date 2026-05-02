import { NextRequest, NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed-database'

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting database seeding via API...')

    // Skip test user creation for now due to rate limits
    console.log('⏭️  Skipping test user creation (rate limited)...')

    // Seed database content
    console.log('📚 Seeding database content...')
    const result = await seedDatabase.seedAll()

    if (result.success) {
      console.log('✅ Database seeded successfully!')
      return NextResponse.json({
        success: true,
        message: 'Database seeded successfully! Categories and content added.',
        note: 'Test user creation skipped due to email rate limits. Create test user manually if needed.'
      })
    } else {
      console.error('❌ Database seeding failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
