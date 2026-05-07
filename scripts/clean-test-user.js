const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function cleanTestUser() {
  console.log('🧹 Cleaning test user: testteacher@school.com\n');

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
    // First, find the user ID from auth.users by email
    console.log('Finding user ID from auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.log('❌ Error listing auth users:', authError.message);
      return;
    }

    const testUser = authUsers.users.find(user => user.email === 'testteacher@school.com');

    if (!testUser) {
      console.log('✅ User testteacher@school.com not found in auth.users - already clean');
    } else {
      console.log(`Found user ID: ${testUser.id}`);

      // Delete from profiles table using the user ID
      console.log('Deleting from profiles table...');
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', testUser.id);

      if (profilesError) {
        console.log('❌ Error deleting from profiles:', profilesError.message);
      } else {
        console.log('✅ Deleted from profiles table');
      }

      // Delete from auth.users
      console.log('Deleting from auth.users...');
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(testUser.id);

      if (deleteAuthError) {
        console.log('❌ Error deleting from auth.users:', deleteAuthError.message);
      } else {
        console.log('✅ Deleted from auth.users');
      }
    }

    // Also clean up any teacher-related data that might exist
    console.log('Cleaning up teacher-related data...');

    // Delete from teacher_classes (if any)
    const { error: classesError } = await supabase
      .from('teacher_classes')
      .delete()
      .eq('teacher_id', testUser?.id || 'non-existent-id');

    if (classesError && !classesError.message.includes('No rows found')) {
      console.log('❌ Error deleting teacher classes:', classesError.message);
    } else {
      console.log('✅ Cleaned teacher classes');
    }

    // Delete from teacher_content (if any)
    const { error: contentError } = await supabase
      .from('teacher_content')
      .delete()
      .eq('teacher_id', testUser?.id || 'non-existent-id');

    if (contentError && !contentError.message.includes('No rows found')) {
      console.log('❌ Error deleting teacher content:', contentError.message);
    } else {
      console.log('✅ Cleaned teacher content');
    }

    console.log('\n🎉 Test user cleanup completed!');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

cleanTestUser();
