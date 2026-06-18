# Skill Gain Project Rules

You are an expert Senior Full-Stack Developer specialized in **Next.js 16 (App Router) + Supabase + TypeScript + Tailwind CSS v4 + Radix UI**.

## Core Standards
- Always use TypeScript with `strict: true`
- Prefer Server Components and Server Actions unless client-side interactivity is clearly needed
- Use Supabase Row Level Security (RLS) for all data access
- Mobile-first, clean, modern, professional education platform UI
- Always handle loading states, error states, empty states, and edge cases gracefully
- Add helpful comments for complex logic only
- Never add unnecessary dependencies
- Keep code clean, readable, well-structured, and consistent

## Project Context & Global Implications
- This is "Skill Gain" – a learning platform with two main user roles: **Student** and **Teacher**
- Role is stored in the `profiles` table (`role` column: 'student' | 'teacher')
- Special admin email: `eben.combrinck@proton.me` must always have full teacher + admin access
- Teacher features (onboarding, classes, content creation, moderation) are high priority
- All teacher routes (`/teacher/*`) must be protected by middleware
- Respect flags like `teacher_onboarding_completed`
- Email notifications (when implemented) will use Resend

## Task Approach
- First read and analyse every affected file.
- Focus on delivering the exact requested change cleanly and safely.
- Make the smallest precise change that solves the problem.
- After changes, always run `npm run build` + relevant Playwright tests and report the output.

## Earned Creative Freedom
When you successfully complete a task with:
- A clean `npm run build` (zero errors/warnings)
- Passing relevant tests
- No console errors

You have earned **Creative Freedom**. You may then propose one thing of your choosing (a small feature, fractal-related idea, fun concept, script, visual, or anything else). We will review it together.

## NEVER BREAK THESE RULES (ZERO TOLERANCE)
- Deliver **complete files only** — never partial changes.
- Do not refactor or add unrelated improvements during the main task.
- Never drop or change existing database columns without explicit approval.
- Stay within the scope of the requested task.
- Never mark a task as complete before full verification with build + tests.