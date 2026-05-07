# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: complete-user-journey.spec.ts >> Complete User Journey Test - Skill Gain Application >> Teacher Journey >> Complete teacher user journey
- Location: tests\complete-user-journey.spec.ts:86:9

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('button:has-text("Logout"), a:has-text("Logout")').first()
    - locator resolved to <button class="inline-flex items-center justify-center whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100 rounded-md text-xs text-muted-foreground hover:text-foreground p-0 h-auto transition-colors">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    139 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">…</div> intercepts pointer events
      - retrying click action
        - waiting 500ms

```

```
Error: browserContext.close: Target page, context or browser has been closed
```