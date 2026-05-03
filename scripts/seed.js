#!/usr/bin/env node

// Database seeding script
const { seedDatabase } = require('../lib/seed-database')

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // First create test user
    console.log('👤 Creating test user...')
    const userResult = await seedDatabase.createTestUser()
    if (userResult.success) {
      console.log('✅ Test user created successfully!')
      console.log('📧 Email: test.student@skillgain.com')
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
      console.log('📊 Ready for testing!')
      console.log('')
      console.log('🚀 To test the application:')
      console.log('1. Start the dev server: npm run dev')
      console.log('2. Visit http://localhost:3001')
      console.log('3. Sign in with: test.student@skillgain.com / TestPassword123!')
      console.log('4. Explore the personalized Grade 3 learning content!')
    } else {
      console.error('❌ Database seeding failed:', result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

main()
