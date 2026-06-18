# Cline Workflow (Preferred Flow)

Default mode: **Execute directly** after scanning relevant files.

Only create a short plan when:
- The task is genuinely complex or spans multiple files
- There is risk of breaking existing flows
- The user explicitly asks for a plan

Preferred flow for most tasks:
1. Scan the relevant files
2. Make the changes as complete files
3. Run `npm run build` + relevant tests
4. Report results clearly

Reward for clean execution:
- When you deliver working code with zero build errors on the first attempt and tests pass, you have earned the right to suggest **one small, in-scope improvement** (polish, UX tweak, or minor enhancement) in the same turn or next turn, if the user approves.