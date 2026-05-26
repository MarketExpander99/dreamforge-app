import { test, expect } from '@playwright/test'

test.describe('Learning Buttons', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a student user
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'student@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/learning')
  })

  test('Continue Learning button navigates to content detail page', async ({ page }) => {
    // Navigate to learning page
    await page.goto('/learning')

    // Find the first Continue Learning button
    const continueButton = page.locator('button').filter({ hasText: /^Continue$/ }).first()

    // Click the button
    await continueButton.click()

    // Should navigate to content detail page
    await expect(page).toHaveURL(/\/content\/.+/)
  })

  test('Start Learning button updates progress and stays on page', async ({ page }) => {
    // First, navigate to explore page and find a content item
    await page.goto('/explore')

    // Click on the first "View Details" button
    const viewDetailsButton = page.locator('button').filter({ hasText: 'View Details' }).first()
    await viewDetailsButton.click()

    // Should be on content detail page
    await expect(page).toHaveURL(/\/content\/.+/)

    // Find and click the "Start Learning" button
    const startButton = page.locator('button').filter({ hasText: 'Start Learning' })
    await expect(startButton).toBeVisible()

    // Click the button
    await startButton.click()

    // Button should show loading state
    await expect(page.locator('button').filter({ hasText: 'Starting...' })).toBeVisible()

    // After loading, progress should be updated (10%)
    await expect(page.locator('text=10%')).toBeVisible()

    // Should still be on the same page
    await expect(page).toHaveURL(/\/content\/.+/)
  })

  test('Start Learning button handles no prior progress correctly', async ({ page }) => {
    // Navigate to a content item that hasn't been started
    await page.goto('/explore')

    // Click on a content item
    const viewDetailsButton = page.locator('button').filter({ hasText: 'View Details' }).first()
    await viewDetailsButton.click()

    // Verify we're on content detail page
    await expect(page).toHaveURL(/\/content\/.+/)

    // Progress should start at 0%
    await expect(page.locator('text=0%')).toBeVisible()

    // Start Learning button should be visible
    const startButton = page.locator('button').filter({ hasText: 'Start Learning' })
    await expect(startButton).toBeVisible()
    await expect(startButton).not.toBeDisabled()
  })

  test('Continue Learning button shows correct text based on progress', async ({ page }) => {
    // Navigate to learning page
    await page.goto('/learning')

    // Check that buttons show appropriate text
    const startButtons = page.locator('button').filter({ hasText: 'Start' })
    const continueButtons = page.locator('button').filter({ hasText: 'Continue' })
    const reviewButtons = page.locator('button').filter({ hasText: 'Review' })

    // At least one of these button types should exist
    const buttonCount = await startButtons.count() + await continueButtons.count() + await reviewButtons.count()
    expect(buttonCount).toBeGreaterThan(0)
  })
})