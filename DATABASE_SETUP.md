# Database Setup Guide

This guide will help you set up the Supabase database for the Skill Gain learning platform.

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Supabase CLI** (optional): Install the CLI for advanced database management

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: `knowfeed` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
4. Click "Create new project"

## Step 2: Get Database Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**
   - **anon/public key**

## Step 3: Configure Environment Variables

1. Create/update your `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace the placeholder values with your actual Supabase credentials.

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase-schema.sql`
3. Click **Run** to execute the schema

This will create all necessary tables, indexes, and relationships.

## Step 5: Seed Initial Data

After setting up the schema, seed the database with initial content:

```bash
npm run seed
```

This will populate your database with:
- 8 learning categories (Science, History, Geography, etc.)
- 8 sample learning content items
- Sample quiz content

## Step 6: Verify Setup

1. Start the development server:
```bash
npm run dev
```

2. Visit `http://localhost:3000` in your browser
3. Try signing up for a new account
4. Check that content loads properly
5. Test bookmarking and progress tracking features

## Database Tables Created

### Core Tables
- **`categories`**: Learning categories (Science, History, etc.)
- **`content_items`**: Learning content (articles, videos, quizzes)
- **`profiles`**: User profiles and preferences

### User Interaction Tables
- **`user_progress`**: Learning progress tracking
- **`user_bookmarks`**: Saved/bookmarked content
- **`user_achievements`**: Achievement system

## Troubleshooting

### Database Connection Issues
- **Error**: "Could not find the table 'public.content_items'"
- **Solution**: Make sure you've run the schema SQL in Supabase

### Authentication Issues
- **Error**: "Email not confirmed"
- **Solution**: Check your Supabase email confirmation settings in Authentication → Settings

### Seeding Issues
- **Error**: "Database seeding failed"
- **Solution**: Ensure your environment variables are correct and the database is accessible

## Advanced Setup (Optional)

### Using Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Push schema changes:
```bash
supabase db push
```

### Local Development

For local development with Supabase:

```bash
supabase start
```

This starts a local Supabase instance for development.

## Next Steps

Once your database is set up:

1. **Content Management**: Add more learning content
2. **User Testing**: Test all features with real data
3. **Performance**: Monitor and optimize database queries
4. **Backup**: Set up automated database backups

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your environment variables are correct
3. Ensure the database schema was created successfully
4. Check Supabase dashboard for any service issues

For more help, refer to the [Supabase Documentation](https://supabase.com/docs).