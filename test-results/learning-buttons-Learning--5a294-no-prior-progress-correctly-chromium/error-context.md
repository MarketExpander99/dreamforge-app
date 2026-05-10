# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-buttons.spec.ts >> Learning Buttons >> Start Learning button handles no prior progress correctly
- Location: tests\learning-buttons.spec.ts:55:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Welcome Back" [level=3] [ref=e5]
      - paragraph [ref=e6]: Sign in to continue your learning journey
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - text: Email
          - textbox "Email" [ref=e10]:
            - /placeholder: Enter your email
        - generic [ref=e11]:
          - text: Password
          - textbox "Password" [ref=e12]:
            - /placeholder: Enter your password
        - button "Sign In" [ref=e13]
      - generic [ref=e14]:
        - text: Don't have an account?
        - link "Sign up" [ref=e15] [cursor=pointer]:
          - /url: /auth/signup
  - button "Open Next.js Dev Tools" [ref=e21] [cursor=pointer]:
    - img [ref=e22]
  - alert [ref=e25]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Learning Buttons', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Login as a student user
  6  |     await page.goto('/auth/login')
> 7  |     await page.fill('input[name="email"]', 'student@example.com')
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  8  |     await page.fill('input[name="password"]', 'password123')
  9  |     await page.click('button[type="submit"]')
  10 |     await page.waitForURL('/learning')
  11 |   })
  12 | 
  13 |   test('Continue Learning button navigates to content detail page', async ({ page }) => {
  14 |     // Navigate to learning page
  15 |     await page.goto('/learning')
  16 | 
  17 |     // Find the first Continue Learning button
  18 |     const continueButton = page.locator('button').filter({ hasText: /^Continue$/ }).first()
  19 | 
  20 |     // Click the button
  21 |     await continueButton.click()
  22 | 
  23 |     // Should navigate to content detail page
  24 |     await expect(page).toHaveURL(/\/content\/.+/)
  25 |   })
  26 | 
  27 |   test('Start Learning button updates progress and stays on page', async ({ page }) => {
  28 |     // First, navigate to explore page and find a content item
  29 |     await page.goto('/explore')
  30 | 
  31 |     // Click on the first "View Details" button
  32 |     const viewDetailsButton = page.locator('button').filter({ hasText: 'View Details' }).first()
  33 |     await viewDetailsButton.click()
  34 | 
  35 |     // Should be on content detail page
  36 |     await expect(page).toHaveURL(/\/content\/.+/)
  37 | 
  38 |     // Find and click the "Start Learning" button
  39 |     const startButton = page.locator('button').filter({ hasText: 'Start Learning' })
  40 |     await expect(startButton).toBeVisible()
  41 | 
  42 |     // Click the button
  43 |     await startButton.click()
  44 | 
  45 |     // Button should show loading state
  46 |     await expect(page.locator('button').filter({ hasText: 'Starting...' })).toBeVisible()
  47 | 
  48 |     // After loading, progress should be updated (10%)
  49 |     await expect(page.locator('text=10%')).toBeVisible()
  50 | 
  51 |     // Should still be on the same page
  52 |     await expect(page).toHaveURL(/\/content\/.+/)
  53 |   })
  54 | 
  55 |   test('Start Learning button handles no prior progress correctly', async ({ page }) => {
  56 |     // Navigate to a content item that hasn't been started
  57 |     await page.goto('/explore')
  58 | 
  59 |     // Click on a content item
  60 |     const viewDetailsButton = page.locator('button').filter({ hasText: 'View Details' }).first()
  61 |     await viewDetailsButton.click()
  62 | 
  63 |     // Verify we're on content detail page
  64 |     await expect(page).toHaveURL(/\/content\/.+/)
  65 | 
  66 |     // Progress should start at 0%
  67 |     await expect(page.locator('text=0%')).toBeVisible()
  68 | 
  69 |     // Start Learning button should be visible
  70 |     const startButton = page.locator('button').filter({ hasText: 'Start Learning' })
  71 |     await expect(startButton).toBeVisible()
  72 |     await expect(startButton).not.toBeDisabled()
  73 |   })
  74 | 
  75 |   test('Continue Learning button shows correct text based on progress', async ({ page }) => {
  76 |     // Navigate to learning page
  77 |     await page.goto('/learning')
  78 | 
  79 |     // Check that buttons show appropriate text
  80 |     const startButtons = page.locator('button').filter({ hasText: 'Start' })
  81 |     const continueButtons = page.locator('button').filter({ hasText: 'Continue' })
  82 |     const reviewButtons = page.locator('button').filter({ hasText: 'Review' })
  83 | 
  84 |     // At least one of these button types should exist
  85 |     const buttonCount = await startButtons.count() + await continueButtons.count() + await reviewButtons.count()
  86 |     expect(buttonCount).toBeGreaterThan(0)
  87 |   })
  88 | })
```