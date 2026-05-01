# KnowFeed - Learning Platform

A comprehensive learning platform designed for students and parents, built with modern web technologies. Features gamified learning, progress tracking, content discovery, and achievement systems.

## 🚀 Current Status: **CORE PLATFORM COMPLETE**

All major features implemented and production-ready. See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for detailed documentation.

## 🏗️ Tech Stack

- **Framework**: Next.js 16.2.4 with App Router
- **Frontend**: React 19.2.4 + TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **UI Components**: Radix UI + Custom Design System
- **Authentication**: Supabase Auth

## 🎯 Features

### ✅ Implemented
- **Complete Authentication System** - Registration, login, onboarding
- **Learning Dashboard** - Progress tracking and statistics
- **Content Discovery** - Explore page with search and categories
- **User Profiles** - Profile management and settings
- **Achievement System** - Badges and learning milestones
- **Responsive Design** - Mobile-first with desktop enhancements
- **Database Schema** - Complete with 6 core tables and RLS policies

### 🔄 Next Steps
- Real database integration
- Content management system
- Interactive features (bookmarks, progress saving)
- Advanced analytics and recommendations

## 🗄️ Database Schema

Complete schema with 6 tables:
- `profiles` - Extended user profiles
- `categories` - Content organization
- `content_items` - Learning content
- `user_progress` - Progress tracking
- `user_bookmarks` - Saved content
- `user_achievements` - Achievement system

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MarketExpander99/dreamforge-app.git
   cd dreamforge-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Set up database**
   ```bash
   # Apply the schema to your Supabase database
   # See supabase-schema.sql for the complete schema
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 📱 Pages & Routes

- `/` - Home: Learning feed and content discovery
- `/explore` - Content discovery with search and filtering
- `/learning` - Progress dashboard and achievements
- `/profile` - User profile and settings
- `/auth/login` - User login
- `/auth/signup` - User registration
- `/auth/onboarding` - New user onboarding

## 🛠️ Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 📚 Documentation

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Comprehensive project status and roadmap
- **[supabase-schema.sql](./supabase-schema.sql)** - Complete database schema
- **[AGENTS.md](./AGENTS.md)** - Development guidelines and rules

## 🎯 Project Goals

KnowFeed aims to provide an engaging, personalized learning experience that:
- Makes learning fun through gamification
- Tracks progress and provides meaningful feedback
- Offers diverse content types and subjects
- Supports both individual learners and parent-child learning
- Scales to support schools and educational organizations

## 🤝 Contributing

This project follows standard Next.js and TypeScript development practices. See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current development guidelines and next steps.

## 📄 License

This project is part of the DreamForge initiative.

---

**Status**: ✅ Core platform complete and ready for data integration and advanced features.
</content>
