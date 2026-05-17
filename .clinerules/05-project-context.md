# 05-full-context.md — Skill Gain Full Project Context (May 2026)

You are working on **Skill Gain** (live at skill-gain.com) — a modern, gamified learning platform.

## Current Product Reality (NOT just the old docs)
- Two primary user roles: **Student** and **Teacher** (profiles.role = 'student' | 'teacher')
- Special admin email `eben.combrinck@proton.me` must ALWAYS have full teacher + admin access
- Teacher features are the **current high-priority area**: onboarding, dashboard, class creation, content creation, moderation, students tab
- Teacher routes (`/teacher/*`) are protected by middleware.ts
- Respect flags like `teacher_onboarding_completed`
- Student side is mature (feed, explore, learning, progress, achievements)
- Core platform is production-ready; we are now polishing and expanding teacher capabilities

## Tech Stack (exact versions from package.json + config)
- Next.js 16.2.4 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4 + Radix UI + Lucide icons + shadcn-style components
- Supabase (PostgreSQL + RLS + Server Components/Actions)
- Playwright for E2E tests
- Mobile-first, clean, professional education UI

## Core Database Tables (relevant excerpts)
- `profiles`: id, role ('student' | 'teacher'), full_name, avatar_url, bio, grade_level (for students), interests, etc.
- `categories`, `content_items` (type: text/video/quiz/etc.), `user_progress`, `user_bookmarks`, `user_achievements`
- RLS is enforced everywhere — never bypass it

## Implemented & Mature Areas (do not break these)
- Full auth + onboarding flow
- Student dashboard, explore, my-learning, profile
- Progress tracking, achievements, bookmarks
- Responsive navigation (sidebar + mobile bottom nav)
- Content cards, search, categories
- Middleware protection for teacher routes

## Active Focus Areas (Teacher Side)
- Teacher dashboard with tabs: Overview, Classes, Content, Moderation, Students
- Create Class form
- Create Content form
- Teacher onboarding flow
- Moderation tools
- Class management and student assignment