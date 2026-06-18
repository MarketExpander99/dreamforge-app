<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Skill Gain — Agent Rules

**The `.clinerules/` folder is the single source of truth and compass for all work on this project.**

Every AI coding agent (Grok Build, Claude, Cline, Cursor, etc.) **must read the entire `.clinerules/` folder** before starting any task.

## .clinerules/ Files (read these)

- [.clinerules/01-project-rules.md](.clinerules/01-project-rules.md) — Core standards, task approach, Earned Creative Freedom, zero-tolerance rules
- [.clinerules/02-anti-hallucination.md](.clinerules/02-anti-hallucination.md) — Verification & accuracy requirements
- [.clinerules/03-testing.md](.clinerules/03-testing.md) — Testing & verification rules (RLS, roles, responsiveness)
- [.clinerules/04-workflow.md](.clinerules/04-workflow.md) — Preferred workflow (scan → complete files → build + tests)
- [.clinerules/05-project-context.md](.clinerules/05-project-context.md) — Full current project context (roles, teacher focus, tech stack)
- [.clinerules/06-task-tracking.md](.clinerules/06-task-tracking.md) — When to update PROJECT_STATUS.MD
- [.clinerules/07-build-enforcement.md](.clinerules/07-build-enforcement.md) — Mandatory build gate after every change

## Core Ways of Working (from .clinerules)

- **Scan first**: Always check the current state of relevant files before making changes.
- **Complete files only**: When you make changes, output full files ready to copy-paste. No partial diffs or snippets.
- **Verify your work**: After changes, run `npm run build` and relevant tests. Include the output. Only mark something as done when it’s clean.
- **Stay in scope**: Focus on what was actually asked. Avoid adding unrelated features during the main task.
- **Response format**: Start every response with `✅ Repo scanned` and end with a clear **Next suggested step**.
- **Be precise but human**: Write clean, working code. Explain what you did and why when it’s helpful.

## Earned Creative Freedom

When you deliver a task with:
- A clean build (`npm run build` with zero errors)
- Passing relevant tests
- No broken imports or console errors

You’ve earned **Creative Freedom** for that turn. You can then propose one thing of your choosing (a small improvement, a fun idea, a fractal-related concept, or anything else). We’ll review it together.

## Important Guardrails (these protect the project)

- Never drop or modify existing database columns without clear approval.
- Never remove fields from the schema.
- Always prefer solutions that avoid schema changes when possible.
- Keep changes minimal and targeted during the main task.

## After Making Changes

Please always:
1. Run `npm run build` and share the full output
2. Run relevant Playwright tests when UI is involved
3. Confirm that references and imports are still correct
4. Give the user clear instructions on what to test

The goal is to ship reliable work efficiently, and to have fun doing it.

Let’s build something good together.

