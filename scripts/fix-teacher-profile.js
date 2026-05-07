const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixTeacherProfile() {
  console.log('🔧 Fixing teacher profile...\n');

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
    // First, let's check the current profile
    console.log('Checking current profile...');
    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'b4c4584f-6f9c-468f-ae2a-cbb12ca932a5')
      .single();

    if (selectError) {
      console.log('❌ Error fetching profile:', selectError.message);
      return;
    }

    console.log('Current profile:', profile);

    // Try to update the profile
    console.log('Updating profile...');
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'teacher',
        teacher_onboarding_completed: true
      })
      .eq('id', 'b4c4584f-6f9c-468f-ae2a-cbb12ca932a5')
      .select();

    if (updateError) {
      console.log('❌ Error updating profile:', updateError.message);
      console.log('This might be due to RLS policies or schema constraints');
    } else {
      console.log('✅ Profile updated successfully:', data);
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

fixTeacherProfile();