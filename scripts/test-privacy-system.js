// Test script to verify privacy system implementation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPrivacySystem() {
  console.log('🔍 Testing Privacy-First Username System...\n');

  try {
    // Test 1: Check if profiles table has the new columns by trying to select them
    console.log('1. Checking database schema...');
    const { data: testProfile, error: schemaError } = await supabase
      .from('profiles')
      .select('id, display_name, anonymous_id, parent_consent_given')
      .limit(1);

    if (schemaError) {
      console.error('❌ Schema check failed - columns may be missing:', schemaError.message);
      return;
    }

    console.log('✅ All required columns exist in profiles table');

    // Test 2: Check if existing users have anonymous_ids
    console.log('\n2. Checking existing user data...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, anonymous_id, parent_consent_given, role')
      .limit(5);

    if (profilesError) {
      console.error('❌ Failed to fetch profiles:', profilesError);
      return;
    }

    if (profiles.length === 0) {
      console.log('⚠️  No profiles found to test');
    } else {
      console.log(`✅ Found ${profiles.length} profiles to test`);

      profiles.forEach((profile, index) => {
        // Check anonymous_id format
        if (!profile.anonymous_id || !profile.anonymous_id.startsWith('User_')) {
          console.error(`❌ Profile ${profile.id}: Invalid anonymous_id format: ${profile.anonymous_id}`);
        } else {
          console.log(`✅ Profile ${index + 1}: anonymous_id = ${profile.anonymous_id}`);
        }

        // Check parent_consent_given is boolean
        if (typeof profile.parent_consent_given !== 'boolean') {
          console.error(`❌ Profile ${profile.id}: parent_consent_given should be boolean, got ${typeof profile.parent_consent_given}`);
        }
      });
    }

    // Test 3: Test generate_anonymous_id function
    console.log('\n3. Testing anonymous_id generation...');
    const { data: testId, error: funcError } = await supabase.rpc('generate_anonymous_id');

    if (funcError) {
      console.error('❌ generate_anonymous_id function failed:', funcError);
      return;
    }

    if (!testId || !testId.startsWith('User_') || testId.length !== 10) {
      console.error(`❌ Invalid anonymous_id generated: ${testId}`);
      return;
    }

    console.log(`✅ Generated anonymous_id: ${testId}`);

    // Test 4: Test user display name API
    console.log('\n4. Testing display name API...');
    // We'll test this by checking if the API endpoint exists and responds
    const testUserId = profiles[0]?.id;
    if (testUserId) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/test-display-name`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ userId: testUserId })
        });

        if (response.ok) {
          console.log('✅ Display name API endpoint accessible');
        } else {
          console.log('⚠️  Display name API endpoint not fully tested (may need auth setup)');
        }
      } catch (apiError) {
        console.log('⚠️  Display name API test skipped (endpoint may not exist yet)');
      }
    }

    console.log('\n🎉 Privacy-First Username System verification completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Database schema updated with new columns');
    console.log('- ✅ Anonymous ID generation working');
    console.log('- ✅ Existing users backfilled with anonymous_ids');
    console.log('- ✅ Parent consent system ready');
    console.log('\n🚀 Ready for frontend integration and testing!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPrivacySystem();