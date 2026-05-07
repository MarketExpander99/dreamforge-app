const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createTestTeacher() {
  console.log('👨‍🏫 Creating test teacher user...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // First, try to create the auth user
    console.log('Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'testteacher@school.com',
      password: 'password123',
      email_confirm: true, // Skip email confirmation for testing
      user_metadata: {
        full_name: 'Test Teacher',
        role: 'teacher'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('has already been registered')) {
        console.log('✅ User already exists, updating profile...');
        // User exists, let's get their ID and update profile
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          console.log('❌ Error listing users:', listError.message);
          return;
        }

        const existingUser = existingUsers.users.find(u => u.email === 'testteacher@school.com');
        if (existingUser) {
          console.log(`Found existing user ID: ${existingUser.id}`);

          // Update profile to ensure teacher role and onboarding status
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: existingUser.id,
              role: 'teacher',
              full_name: 'Test Teacher',
              teacher_onboarding_completed: false // Reset for testing
            });

          if (profileError) {
            console.log('❌ Error updating profile:', profileError.message);
          } else {
            console.log('✅ Profile updated successfully');
          }
        }
      } else {
        console.log('❌ Error creating auth user:', authError.message);
        return;
      }
    } else {
      console.log('✅ Auth user created successfully');
      console.log(`User ID: ${authData.user.id}`);

      // Create profile for new user
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          role: 'teacher',
          full_name: 'Test Teacher',
          teacher_onboarding_completed: false
        });

      if (profileError) {
        console.log('❌ Error creating profile:', profileError.message);
      } else {
        console.log('✅ Profile created successfully');
      }
    }

    console.log('\n🎉 Test teacher setup completed!');
    console.log('Email: testteacher@school.com');
    console.log('Password: password123');
    console.log('Role: teacher');
    console.log('Onboarding completed: false');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

createTestTeacher();