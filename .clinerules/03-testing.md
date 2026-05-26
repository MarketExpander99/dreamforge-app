# Testing & Verification Rules

- After every code change: run `npm run build`
- For UI tasks: also run `npx playwright test` (or the specific test file if mentioned)
- Report the full output of both commands.
- Think about RLS, role-based access (student vs teacher), mobile responsiveness, and the special admin email on every change.
- Graceful degradation only — never break existing flows.