// scripts/create-sg-test-users.js
// ============================================================================
// CREATE SG TEST USERS - Official Supabase Admin pattern (matches project scripts)
// Includes full cleanup first to eliminate 500 token errors
// ============================================================================
// Run with: node scripts/create-sg-test-users.js
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables. Check your .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSGTestUsers() {
  console.log('🚀 Starting SG test user creation with full cleanup...\n');

  const testUsers = [
    {
      email: 'sg_test@mail.com',
      password: 'Password01',
      fullName: 'SG Test Student',
      role: 'student'
    },
    {
      email: 'sg_test2_@mail.com',
      password: 'Password02',
      fullName: 'SG Test Parent',
      role: 'parent'
    }
  ];

  for (const user of testUsers) {
    console.log(`Processing ${user.email}...`);

    try {
      // === CLEANUP: Delete user if exists (prevents 500 errors) ===
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers.users.find(u => u.email === user.email);

      if (existing) {
        console.log(`🗑️  Deleting existing user ${user.email} first...`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(existing.id);
        if (deleteError) {
          console.warn(`Warning during delete: ${deleteError.message}`);
        } else {
          console.log('✅ User deleted successfully');
        }
      }

      // === CREATE FRESH USER ===
      console.log(`Creating fresh user: ${user.email}`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.fullName }
      });

      if (authError) {
        console.error(`❌ Auth error for ${user.email}:`, authError.message);
        continue;
      }

      const userId = authData.user.id;
      console.log(`✅ Auth user created (ID: ${userId})`);

      // === ENSURE CORRECT PROFILE ===
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          role: user.role,
          full_name: user.fullName,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError) {
        console.warn(`⚠️ Profile warning for ${user.email}:`, profileError.message);
      } else {
        console.log(`✅ Profile set to role='${user.role}'`);
      }

    } catch (error) {
      console.error(`❌ Unexpected error with ${user.email}:`, error.message);
    }
  }

  console.log('\n🎉 SG test users created successfully!');
  console.log('   Student → sg_test@mail.com / Password01');
  console.log('   Parent  → sg_test2_@mail.com / Password02');
  console.log('\nPlease test login now.');
}

createSGTestUsers();