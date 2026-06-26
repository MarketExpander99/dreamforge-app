// Temporary test script to debug login with the known test accounts
// Run with: node scripts/test-login.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars. Set them before running:');
  console.error('  $env:NEXT_PUBLIC_SUPABASE_URL="..." ; $env:NEXT_PUBLIC_SUPABASE_ANON_KEY="..." ; node scripts/test-login.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const testAccounts = [
  { email: 'groklet@skillgain.dev', password: 'GrokletTest2026!' },
  { email: 'payfast-test@skillgain.dev', password: 'PayFastTest2026!' },
];

async function testLogin(email, password) {
  console.log(`\n=== Testing login for ${email} ===`);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login FAILED');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    console.log('✅ Login SUCCESS');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Email confirmed at:', data.user?.email_confirmed_at);
    console.log('Has session:', !!data.session);

    // Clean up
    await supabase.auth.signOut();
    console.log('(Signed out after test)');

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected JS error:', err);
    return { success: false, error: err };
  }
}

async function main() {
  console.log('Supabase URL (prefix):', SUPABASE_URL ? SUPABASE_URL.substring(0, 35) + '...' : 'MISSING');
  console.log('Testing direct signInWithPassword...\n');

  for (const account of testAccounts) {
    await testLogin(account.email, account.password);
  }

  console.log('\n=== All tests completed ===');
}

main().catch(console.error);