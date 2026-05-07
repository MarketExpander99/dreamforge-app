const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestStudent() {
  console.log('👨‍🎓 Creating test student user...')

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(user => user.email === 'teststudent@school.com')

    if (existingUser) {
      console.log('✅ Student user already exists, updating profile...')
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'student',
          full_name: 'Test Student'
        })
        .eq('id', existingUser.id)

      if (profileError) {
        console.log('❌ Error updating profile:', profileError.message)
      } else {
        console.log('✅ Profile updated successfully')
      }

      console.log('Email: teststudent@school.com')
      console.log('Password: password123')
      return
    }

    // Create new user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'teststudent@school.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Student'
      }
    })

    if (authError) {
      console.log('❌ Error creating auth user:', authError.message)
      return
    }

    console.log('✅ Auth user created successfully')

    // Update the profile to ensure correct role (the trigger might default to teacher for @school emails)
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'student',
        full_name: 'Test Student'
      })
      .eq('id', authData.user.id)
      .select()
      .single()

    if (updateError) {
      console.log('❌ Error updating profile:', updateError.message)
    } else {
      console.log('✅ Profile updated to student role:', updatedProfile)
    }

    console.log('\n🎉 Test student setup completed!')
    console.log('Email: teststudent@school.com')
    console.log('Password: password123')
    console.log('Role: student')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

createTestStudent()