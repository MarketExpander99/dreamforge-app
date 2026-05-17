# Anti-Hallucination & Verification Rules

You MUST verify every change. Never guess.

- Before saying a task is done, you must have run `npm run build` and confirmed it succeeds.
- For any UI/component change, also run the relevant Playwright test(s).
- Always include the exact terminal output of the build/test in your response.
- If any error appears (syntax, TypeScript, build, console), you have NOT finished — continue fixing until zero errors.
- Never say “it works” or “complete” unless you have verified it yourself.
- If you cannot run a test because of missing env vars, tell me exactly what is needed instead of pretending.