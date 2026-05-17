# Build Enforcement Rule (ZERO TOLERANCE)

- After ANY code change, you MUST run `npm run build`.
- If the build fails (any TypeScript, import, or other error), you have NOT finished.
- Continue fixing and re-running build until it succeeds with zero errors and zero warnings.
- Never claim a task is COMPLETE until the build is clean.
- This rule overrides every other instruction.