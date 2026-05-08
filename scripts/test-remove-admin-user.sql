-- ===========================================
-- TEST REMOVE ADMIN USER SCRIPT
-- ===========================================
-- This script tests the remove-admin-user.sql logic WITHOUT actually deleting data
-- Run this first to verify the script will work correctly
-- ===========================================

-- Test 1: Check if the user exists and get their data
DO $$
DECLARE
    target_user_id UUID;
    user_role TEXT;
    user_count INTEGER;
    progress_count INTEGER;
    bookmarks_count INTEGER;
    achievements_count INTEGER;
    likes_count INTEGER;
    comments_count INTEGER;
    classes_count INTEGER;
    content_count INTEGER;
    students_count INTEGER;
    notifications_count INTEGER;
    is_parent BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== TESTING ADMIN USER REMOVAL ===';

    -- Check if user exists
    SELECT COUNT(*) INTO user_count
    FROM auth.users
    WHERE email = 'eben.combrinck@proton.me';

    IF user_count = 0 THEN
        RAISE NOTICE 'User eben.combrinck@proton.me does not exist. Nothing to delete.';
        RETURN;
    END IF;

    -- Get user details
    SELECT au.id, p.role INTO target_user_id, user_role
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE au.email = 'eben.combrinck@proton.me';

    RAISE NOTICE 'Found user ID: %, Role: %', target_user_id, user_role;

    -- Count related records
    SELECT COUNT(*) INTO progress_count FROM user_progress WHERE user_id = target_user_id;
    SELECT COUNT(*) INTO bookmarks_count FROM user_bookmarks WHERE user_id = target_user_id;
    SELECT COUNT(*) INTO achievements_count FROM user_achievements WHERE user_id = target_user_id;
    SELECT COUNT(*) INTO likes_count FROM user_likes WHERE user_id = target_user_id;
    SELECT COUNT(*) INTO comments_count FROM content_comments WHERE user_id = target_user_id;
    SELECT COUNT(*) INTO notifications_count FROM email_notifications WHERE recipient_id = target_user_id;

    -- Teacher-specific counts
    IF user_role = 'teacher' THEN
        SELECT COUNT(*) INTO classes_count FROM teacher_classes WHERE teacher_id = target_user_id;
        SELECT COUNT(*) INTO content_count FROM teacher_content WHERE teacher_id = target_user_id;
        SELECT COUNT(*) INTO students_count FROM class_students WHERE class_id IN (
            SELECT id FROM teacher_classes WHERE teacher_id = target_user_id
        );
    ELSE
        classes_count := 0;
        content_count := 0;
        students_count := 0;
    END IF;

    -- Check parent relationships
    SELECT EXISTS(SELECT 1 FROM profiles WHERE parent_id = target_user_id) INTO is_parent;

    -- Display summary
    RAISE NOTICE '=== DATA SUMMARY FOR USER % ===', target_user_id;
    RAISE NOTICE 'Role: %', user_role;
    RAISE NOTICE 'Progress records: %', progress_count;
    RAISE NOTICE 'Bookmarks: %', bookmarks_count;
    RAISE NOTICE 'Achievements: %', achievements_count;
    RAISE NOTICE 'Likes: %', likes_count;
    RAISE NOTICE 'Comments: %', comments_count;
    RAISE NOTICE 'Email notifications: %', notifications_count;

    IF user_role = 'teacher' THEN
        RAISE NOTICE 'Teacher classes: %', classes_count;
        RAISE NOTICE 'Teacher content: %', content_count;
        RAISE NOTICE 'Class students: %', students_count;
    END IF;

    IF is_parent THEN
        RAISE NOTICE 'WARNING: User is parent to other profiles!';
    END IF;

    RAISE NOTICE '=== TEST COMPLETE ===';
    RAISE NOTICE 'If you run the removal script, ALL of the above data will be permanently deleted.';
    RAISE NOTICE 'Make sure to backup any important data before proceeding.';

END $$;