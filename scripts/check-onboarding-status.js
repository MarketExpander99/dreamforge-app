const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkOnboardingStatus() {
  console.log('🔍 Checking teacher onboarding status...\n');

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
    // Find the test teacher user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.log('❌ Error listing users:', listError.message);
      return;
    }

    const testUser = users.users.find(u => u.email === 'testteacher@school.com');
    if (!testUser) {
      console.log('❌ Test teacher user not found');
      return;
    }

    console.log(`Found test teacher user: ${testUser.id}`);

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.id)
      .single();

    if (profileError) {
      console.log('❌ Error fetching profile:', profileError.message);
      return;
    }

    console.log('\n📋 Profile Data:');
    console.log(`- ID: ${profile.id}`);
    console.log(`- Role: ${profile.role}`);
    console.log(`- Full Name: ${profile.full_name}`);
    console.log(`- Teacher Onboarding Completed: ${profile.teacher_onboarding_completed}`);
    console.log(`- Created At: ${profile.created_at}`);
    console.log(`- Updated At: ${profile.updated_at}`);

    if (profile.teacher_onboarding_completed) {
      console.log('\n✅ Teacher onboarding is marked as completed in database');
    } else {
      console.log('\n❌ Teacher onboarding is NOT completed in database');
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

checkOnboardingStatus();