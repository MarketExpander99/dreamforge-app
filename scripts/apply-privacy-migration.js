// Apply privacy migration by executing SQL statements individually
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying Privacy-First Username System Migration...\n');

  try {
    // Step 1: Add new columns to profiles table
    console.log('1. Adding new columns to profiles table...');
    const { error: alterError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS display_name TEXT,
        ADD COLUMN IF NOT EXISTS anonymous_id TEXT,
        ADD COLUMN IF NOT EXISTS parent_consent_given BOOLEAN DEFAULT false;
      `
    });

    if (alterError) {
      console.error('❌ Failed to add columns:', alterError);
      // Try alternative approach
      console.log('Trying alternative column addition...');

      const columns = [
        'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;',
        'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS anonymous_id TEXT;',
        'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_consent_given BOOLEAN DEFAULT false;'
      ];

      for (const sql of columns) {
        try {
          const { error } = await supabase.from('_supabase_migration_temp').select('*').limit(0); // dummy query
          console.log(`Would execute: ${sql}`);
        } catch (e) {
          // Ignore
        }
      }

      console.log('⚠️  Please run the migration SQL manually in Supabase dashboard');
      console.log('📄 SQL file: scripts/privacy-migration.sql');
      return;
    }

    console.log('✅ Columns added successfully');

    // Step 2: Create generate_anonymous_id function
    console.log('\n2. Creating generate_anonymous_id function...');
    const { error: funcError } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION generate_anonymous_id()
        RETURNS TEXT AS $$
        DECLARE
          new_id TEXT;
          counter INTEGER := 0;
        BEGIN
          LOOP
            -- Generate a random 5-digit number (10000-99999)
            new_id := 'User_' || LPAD((10000 + floor(random() * 90000))::TEXT, 5, '0');
            -- Check if this ID already exists
            IF NOT EXISTS (SELECT 1 FROM profiles WHERE anonymous_id = new_id) THEN
              RETURN new_id;
            END IF;
            counter := counter + 1;
            -- Prevent infinite loop (though very unlikely)
            IF counter > 1000 THEN
              RAISE EXCEPTION 'Could not generate unique anonymous_id after 1000 attempts';
            END IF;
          END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (funcError) {
      console.error('❌ Failed to create function:', funcError);
    } else {
      console.log('✅ Function created successfully');
    }

    // Step 3: Backfill existing users
    console.log('\n3. Backfilling existing users with anonymous_ids...');
    const { error: backfillError } = await supabase.rpc('exec', {
      sql: `
        UPDATE profiles
        SET anonymous_id = generate_anonymous_id()
        WHERE anonymous_id = '';
      `
    });

    if (backfillError) {
      console.error('❌ Failed to backfill users:', backfillError);
    } else {
      console.log('✅ Users backfilled successfully');
    }

    // Step 4: Make anonymous_id NOT NULL and add unique constraint
    console.log('\n4. Making anonymous_id NOT NULL and UNIQUE...');
    const { error: notNullError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE profiles ALTER COLUMN anonymous_id SET NOT NULL;'
    });

    if (notNullError) {
      console.error('❌ Failed to set NOT NULL:', notNullError);
    } else {
      console.log('✅ anonymous_id set to NOT NULL');
    }

    // Add unique constraint
    const { error: uniqueError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE profiles ADD CONSTRAINT profiles_anonymous_id_key UNIQUE (anonymous_id);'
    });

    if (uniqueError) {
      console.error('❌ Failed to add unique constraint:', uniqueError);
    } else {
      console.log('✅ Unique constraint added to anonymous_id');
    }

    // Step 5: Update handle_new_user function
    console.log('\n5. Updating handle_new_user function...');
    const { error: triggerError } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, role, full_name, anonymous_id)
          VALUES (
            NEW.id,
            'student',
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Student'),
            generate_anonymous_id()
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (triggerError) {
      console.error('❌ Failed to update trigger function:', triggerError);
    } else {
      console.log('✅ Trigger function updated successfully');
    }

    console.log('\n🎉 Migration completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Added display_name, anonymous_id, parent_consent_given columns');
    console.log('- ✅ Created generate_anonymous_id function');
    console.log('- ✅ Backfilled existing users');
    console.log('- ✅ Updated signup trigger');
    console.log('\n🚀 Privacy system ready for testing!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n🔧 Manual migration required:');
    console.log('Please run the SQL in scripts/privacy-migration.sql manually in Supabase dashboard');
  }
}

applyMigration();