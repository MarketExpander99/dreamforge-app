# Admin User Removal Scripts

## ⚠️ IMPORTANT WARNING

These scripts are designed to **completely remove** the admin user (`eben.combrinck@proton.me`) and ALL associated data from the Skill Gain database.

**This action is irreversible and will permanently delete:**
- User account and profile
- All progress, bookmarks, achievements, likes, and comments
- All teacher classes, content, and student enrollments (if user is a teacher)
- All email notifications
- Parent-child relationships (children will be orphaned)

## 📋 Scripts Overview

### 1. `test-remove-admin-user.sql` (SAFE TO RUN)
- **Purpose**: Analyzes what data would be deleted without actually deleting it
- **Use**: Run this first to see exactly what will be removed
- **Safety**: Read-only - no data is modified

### 2. `remove-admin-user.sql` (DESTRUCTIVE - RUN ONLY ONCE)
- **Purpose**: Completely removes the admin user and all related data
- **Use**: Run this in Supabase SQL Editor after testing
- **Safety**: Includes transaction rollback on errors

## 🚀 Usage Instructions

### Step 1: Test What Will Be Deleted
```sql
-- Run this in Supabase SQL Editor first
\i scripts/test-remove-admin-user.sql
```

This will show you:
- Whether the user exists
- User's role (student/teacher/parent)
- Count of all related records that will be deleted
- Any parent-child relationships

### Step 2: Backup Important Data (if needed)
If the test shows important data you want to preserve, back it up before proceeding.

### Step 3: Execute the Removal
```sql
-- Run this in Supabase SQL Editor ONLY AFTER testing
\i scripts/remove-admin-user.sql
```

### Step 4: Verify Removal
The script includes automatic verification that the user was successfully removed.

### Step 5: Recreate Admin User
After successful removal, you can recreate the admin user through the normal signup process on https://skill-gain.com

## 🔧 Script Features

### Safety Features
- **Transaction-based**: Uses BEGIN/COMMIT with ROLLBACK on errors
- **Foreign key aware**: Deletes data in correct order to respect constraints
- **Role-aware**: Handles teacher-specific data appropriately
- **Parent-child safe**: Properly handles orphaned child profiles
- **Verification**: Confirms successful deletion

### Error Handling
- Comprehensive error catching with detailed messages
- Automatic rollback on any failure
- Clear success/failure notifications

### Data Deletion Order
1. Teacher classes and related students
2. Teacher content
3. User activity (progress, bookmarks, achievements, likes, comments)
4. Email notifications
5. Parent-child relationships (orphans children)
6. User profile
7. Auth user account

## 📊 Expected Output

### Test Script Output
```
=== TESTING ADMIN USER REMOVAL ===
Found user ID: [UUID], Role: teacher
=== DATA SUMMARY FOR USER [UUID] ===
Role: teacher
Progress records: 15
Bookmarks: 3
Achievements: 8
Likes: 12
Comments: 2
Email notifications: 5
Teacher classes: 2
Teacher content: 7
Class students: 23
=== TEST COMPLETE ===
```

### Removal Script Output
```
SUCCESS: User eben.combrinck@proton.me and all associated data have been completely removed.
VERIFICATION: User successfully removed from database.
```

## 🛡️ Best Practices

1. **Always test first** using `test-remove-admin-user.sql`
2. **Backup critical data** before running the removal script
3. **Run in production only once** - this script is designed for one-time use
4. **Monitor the output** for any error messages
5. **Verify completion** through the built-in verification checks

## 🔍 Troubleshooting

### User Not Found
If the test script shows "User not found", the admin user may already be removed or never existed.

### Foreign Key Errors
If you get foreign key constraint errors, the script will automatically rollback. This usually indicates the database schema has changed since this script was written.

### Permission Errors
Make sure you're running this in Supabase SQL Editor with appropriate permissions.

## 📞 Support

If you encounter issues:
1. Check the error messages in the SQL output
2. Verify you're using the latest version of these scripts
3. Ensure the database schema matches what the scripts expect

---

**Remember: These scripts are for one-time admin user cleanup only. Use with extreme caution!**