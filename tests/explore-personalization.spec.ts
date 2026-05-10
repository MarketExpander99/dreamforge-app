import { test, expect } from '@playwright/test'
import { TEST_USERS } from './helpers/test-roles'

test.describe('Explore Page Personalization', () => {
  test('shows grade gate CTA when user has no grade_level', async ({ page }) => {
    // Login as student (who should not have grade_level set for this test)
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', TEST_USERS.student.email)
    await page.fill('input[name="password"]', TEST_USERS.student.password)
    await page.click('button[type="submit"]')

    // Navigate to explore page
    await page.goto('/explore')
    await page.waitForLoadState('networkidle')

    // Check that grade gate CTA is visible
    const gradeGateCTA = page.locator('text=Unlock Your Personalized Learning Path')
    await expect(gradeGateCTA).toBeVisible()

    // Check that the CTA contains the expected text
    await expect(page.locator('text=Complete the quick grade assessment')).toBeVisible()
    await expect(page.locator('text=Take Grade Assessment')).toBeVisible()

    // Check that personalized content sections are NOT visible
    await expect(page.locator('text=Featured Content')).not.toBeVisible()
    await expect(page.locator('text=Recommended for You')).not.toBeVisible()
    await expect(page.locator('text=All Content')).not.toBeVisible()
  })

  test('grade gate CTA button links to curriculum page', async ({ page }) => {
    // Login as student without grade level
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', TEST_USERS.student.email)
    await page.fill('input[name="password"]', TEST_USERS.student.password)
    await page.click('button[type="submit"]')

    // Navigate to explore page
    await page.goto('/explore')
    await page.waitForLoadState('networkidle')

    // Click the grade assessment button
    await page.click('text=Take Grade Assessment')

    // Should navigate to curriculum page
    await page.waitForURL('**/learning/curriculum')
    await expect(page).toHaveURL(/.*\/learning\/curriculum/)
  })

  test('explore page loads categories regardless of grade level', async ({ page }) => {
    // Login as student without grade level
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', TEST_USERS.student.email)
    await page.fill('input[name="password"]', TEST_USERS.student.password)
    await page.click('button[type="submit"]')

    // Navigate to explore page
    await page.goto('/explore')
    await page.waitForLoadState('networkidle')

    // Categories should still be visible
    const categoriesSection = page.locator('text=All Topics')
    await expect(categoriesSection).toBeVisible()

    // Should have at least the "All Topics" category
    const allTopicsBadge = page.locator('text=All Topics').locator('xpath=following::*').locator('text=All Topics')
    await expect(allTopicsBadge).toBeVisible()
  })

  test('graph view works regardless of grade level', async ({ page }) => {
    // Login as student without grade level
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', TEST_USERS.student.email)
    await page.fill('input[name="password"]', TEST_USERS.student.password)
    await page.click('button[type="submit"]')

    // Navigate to explore page
    await page.goto('/explore')
    await page.waitForLoadState('networkidle')

    // Click graph view button
    await page.click('text=Graph')

    // Graph view should be visible
    const graphTitle = page.locator('text=Knowledge Graph')
    await expect(graphTitle).toBeVisible()
  })

  test('learning page shows grade gate for curriculum section', async ({ page }) => {
    // Login as student without grade level
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', TEST_USERS.student.email)
    await page.fill('input[name="password"]', TEST_USERS.student.password)
    await page.click('button[type="submit"]')

    // Navigate to learning page
    await page.goto('/learning')
    await page.waitForLoadState('networkidle')

    // Go to curriculum tab
    await page.click('text=Curriculum')

    // Check that grade gate is visible in curriculum section
    const gradeGateTitle = page.locator('text=Unlock Your Learning Path')
    await expect(gradeGateTitle).toBeVisible()

    // Check that the CTA contains the expected text
    await expect(page.locator('text=Take the quick assessment')).toBeVisible()
  })
})
