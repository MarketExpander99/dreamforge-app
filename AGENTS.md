<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Skill-Gain Agent Operating System

**Primary source of truth: `/personas/`**

Before doing any work on this project, load the relevant persona files:

1. Always start with `personas/00-BASE.md` (mission spine + non-negotiables).
2. Then load the specialist that matches the task:
   - Frontend / React / Next → `02-FRONTEND.md`
   - UI / Tailwind / design → `03-UI-CSS.md`
   - Database / Supabase / RLS → `04-BACKEND-DB.md`
   - Tests / Playwright → `05-TESTER.md`
   - Content / curriculum → `06-CONTENT.md`
   - Safety / trust → `07-SAFETY-TRUST.md`
   - Security → `08-SECURITY.md`
3. For any cross-cutting or architectural work, also load `01-OVERWATCH.md`.

See `personas/README.md` for the full index and doctrine.

The older `.clinerules/` files are legacy and are being superseded by the personas system. Prefer `/personas/` in all new work.
