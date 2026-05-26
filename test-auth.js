// Test authentication directly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAuth() {
  console.log('🔐 Testing authentication...');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    console.log('Attempting to sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testteacher@school.com',
      password: 'password123'
    });

    if (error) {
      console.log('❌ Login failed:', error.message);
      return;
    }

    console.log('✅ Login successful!');
    console.log('User ID:', data.user?.id);
    console.log('User email:', data.user?.email);

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.log('❌ Profile fetch failed:', profileError.message);
    } else {
      console.log('✅ Profile:', profile);
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

testAuth();