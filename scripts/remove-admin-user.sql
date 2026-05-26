-- ===========================================
-- REMOVE ADMIN USER SCRIPT
-- ===========================================
-- This script safely removes the admin user (eben.combrinck@proton.me)
-- and ALL related data from the database.
--
-- IMPORTANT: This script should only be run ONCE in production
-- to clean up the admin user before recreating it properly.
--
-- WARNING: This will permanently delete all data associated with this user!
-- ===========================================

-- Start transaction for safety
BEGIN;

-- Step 1: Find the user ID by email
DO $$
DECLARE
    target_user_id UUID;
    user_role TEXT;
    is_parent BOOLEAN := FALSE;
BEGIN
    -- Get the user ID and role
    SELECT au.id, p.role INTO target_user_id, user_role
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE au.email = 'eben.combrinck@proton.me';

    -- Check if user exists
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User eben.combrinck@proton.me not found. Nothing to delete.';
        RETURN;
    END IF;

    RAISE NOTICE 'Found user ID: %, Role: %', target_user_id, user_role;

    -- Check if this user is a parent to other users
    SELECT EXISTS(
        SELECT 1 FROM profiles
        WHERE parent_id = target_user_id
    ) INTO is_parent;

    IF is_parent THEN
        RAISE NOTICE 'WARNING: This user is a parent to other users. Child profiles will be orphaned.';
    END IF;

    -- Step 2: Delete teacher-specific data (if user is a teacher)
    IF user_role = 'teacher' THEN
        RAISE NOTICE 'Deleting teacher-specific data...';

        -- Delete class_students records for classes owned by this teacher
        DELETE FROM class_students
        WHERE class_id IN (
            SELECT id FROM teacher_classes WHERE teacher_id = target_user_id
        );

        -- Delete teacher_content records
        DELETE FROM teacher_content WHERE teacher_id = target_user_id;

        -- Delete teacher_classes (this will cascade to class_students)
        DELETE FROM teacher_classes WHERE teacher_id = target_user_id;

        RAISE NOTICE 'Teacher data deleted successfully.';
    END IF;

    -- Step 3: Delete user activity data (in correct order due to foreign keys)
    RAISE NOTICE 'Deleting user activity data...';

    -- Delete email notifications
    DELETE FROM email_notifications WHERE recipient_id = target_user_id;

    -- Delete content comments
    DELETE FROM content_comments WHERE user_id = target_user_id;

    -- Delete user likes
    DELETE FROM user_likes WHERE user_id = target_user_id;

    -- Delete user achievements
    DELETE FROM user_achievements WHERE user_id = target_user_id;

    -- Delete user bookmarks
    DELETE FROM user_bookmarks WHERE user_id = target_user_id;

    -- Delete user progress (this has foreign key to content_items)
    DELETE FROM user_progress WHERE user_id = target_user_id;

    RAISE NOTICE 'User activity data deleted successfully.';

    -- Step 4: Handle parent-child relationships
    IF is_parent THEN
        RAISE NOTICE 'Updating child profiles to remove parent reference...';
        UPDATE profiles SET parent_id = NULL WHERE parent_id = target_user_id;
    END IF;

    -- Step 5: Delete the profile
    RAISE NOTICE 'Deleting user profile...';
    DELETE FROM profiles WHERE id = target_user_id;

    -- Step 6: Delete the auth user (this should cascade if properly configured)
    RAISE NOTICE 'Deleting auth user...';
    DELETE FROM auth.users WHERE id = target_user_id;

    RAISE NOTICE 'SUCCESS: User eben.combrinck@proton.me and all associated data have been completely removed.';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'ERROR: Failed to delete user. Details: %', SQLERRM;
        ROLLBACK;
END $$;

-- Commit the transaction
COMMIT;

-- Verification: Check that the user is gone
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'eben.combrinck@proton.me'
    ) THEN
        RAISE EXCEPTION 'ERROR: User still exists after deletion attempt!';
    ELSE
        RAISE NOTICE 'VERIFICATION: User successfully removed from database.';
    END IF;
END $$;

-- ===========================================
-- CLEANUP COMPLETE
-- ===========================================
-- The admin user has been completely removed.
-- You can now recreate the admin user through the normal signup process.
-- ===========================================