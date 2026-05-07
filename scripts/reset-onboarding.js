const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function resetOnboarding() {
  console.log('🔄 Resetting teacher onboarding status...\n');

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
    const { data, error } = await supabase
      .from('profiles')
      .update({ teacher_onboarding_completed: false })
      .eq('id', 'b4c4584f-6f9c-468f-ae2a-cbb12ca932a5')
      .select();

    if (error) {
      console.log('❌ Error resetting onboarding:', error.message);
    } else {
      console.log('✅ Onboarding reset successfully:', data);
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

resetOnboarding();