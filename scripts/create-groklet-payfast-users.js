const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables (need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const accounts = [
  {
    email: 'groklet@skillgain.dev',
    password: 'GrokletTest2026!',
    full_name: 'Groklet Explorer',
    role: 'student',
    grade_level: 'Grade 7',
  },
  {
    email: 'payfast-test@skillgain.dev',
    password: 'PayFastTest2026!',
    full_name: 'PayFast Tester',
    role: 'parent',
  },
];

async function createOrUpdateUser(account) {
  console.log(`\n=== Processing ${account.email} ===`);

  try {
    // List users to check existence
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Failed to list users:', listError.message);
      return;
    }

    const existing = listData.users.find(u => u.email === account.email);

    let userId;

    if (existing) {
      console.log('User already exists in auth, updating password and confirmation...');

      // Update password and confirm email
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existing.id,
        {
          password: account.password,
          email_confirm: true,
          user_metadata: { full_name: account.full_name },
        }
      );

      if (updateError) {
        console.error('❌ Failed to update user:', updateError.message);
        return;
      }

      userId = existing.id;
      console.log('✅ Auth user updated');
    } else {
      console.log('Creating new auth user via Admin API...');

      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: account.full_name,
        },
      });

      if (createError) {
        console.error('❌ Error creating auth user:', createError.message);
        return;
      }

      userId = createData.user.id;
      console.log('✅ Auth user created');
    }

    // Ensure profile row with correct role etc.
    const profileData = {
      id: userId,
      role: account.role,
      full_name: account.full_name,
      updated_at: new Date().toISOString(),
    };

    if (account.grade_level) {
      profileData.grade_level = account.grade_level;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (profileError) {
      console.error('❌ Profile upsert error:', profileError.message);
    } else {
      console.log('✅ Profile upserted with role:', account.role);
    }

    console.log(`🎉 Ready: ${account.email} / ${account.password} (role=${account.role})`);

  } catch (err) {
    console.error('Unexpected error for', account.email, ':', err.message);
  }
}

async function main() {
  console.log('Using service role to manage test accounts properly...');

  for (const account of accounts) {
    await createOrUpdateUser(account);
  }

  console.log('\n✅ All test accounts processed.');
  console.log('Try logging in now with the credentials above.');
}

main().catch(console.error);