import { NextRequest, NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed-database'

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting database seeding via API...')

    // First create test user
    console.log('👤 Creating test user...')
    const userResult = await seedDatabase.createTestUser()
    if (userResult.success) {
      console.log('✅ Test user created successfully!')
      console.log('📧 Email: test.student@knowfeed.com')
      console.log('🔑 Password: TestPassword123!')
      if (userResult.userId) {
        console.log('🆔 User ID:', userResult.userId)
      }
    } else {
      console.warn('⚠️  Test user creation failed (may already exist):', userResult.error)
    }

    // Then seed database content
    console.log('📚 Seeding database content...')
    const result = await seedDatabase.seedAll()

    if (result.success) {
      console.log('✅ Database seeded successfully!')
      return NextResponse.json({
        success: true,
        message: 'Database seeded successfully!',
        testUser: {
          email: 'test.student@knowfeed.com',
          password: 'TestPassword123!'
        }
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