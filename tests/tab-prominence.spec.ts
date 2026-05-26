import { test, expect } from '@playwright/test'

test.describe('Tab Prominence', () => {
  test('should display prominent tabs in curriculum browser', async ({ page }) => {
    // Navigate to curriculum page
    await page.goto('/learning/curriculum')

    // Check that prominent tabs are present
    const tabsList = page.locator('[role="tablist"]')
    await expect(tabsList).toBeVisible()

    // Check tab styling - should have rounded-xl background and shadow
    await expect(tabsList).toHaveClass(/rounded-xl/)
    await expect(tabsList).toHaveClass(/shadow-lg/)

    // Check individual tabs
    const curriculumTab = page.locator('[role="tab"]').filter({ hasText: 'Curriculum Browser' })
    const pathTab = page.locator('[role="tab"]').filter({ hasText: 'My Path' })
    const lessonsTab = page.locator('[role="tab"]').filter({ hasText: 'Lesson Plans' })
    const progressTab = page.locator('[role="tab"]').filter({ hasText: 'My Progress' })

    await expect(curriculumTab).toBeVisible()
    await expect(pathTab).toBeVisible()
    await expect(lessonsTab).toBeVisible()
    await expect(progressTab).toBeVisible()

    // Check that tabs have proper padding and minimum touch targets
    const tabStyles = await curriculumTab.evaluate(el => {
      const computedStyle = window.getComputedStyle(el)
      return {
        paddingX: computedStyle.paddingLeft,
        paddingY: computedStyle.paddingTop,
        minHeight: computedStyle.minHeight,
        minWidth: computedStyle.minWidth
      }
    })

    // Should have px-6 py-3 padding (24px horizontal, 12px vertical)
    expect(tabStyles.paddingX).toBe('24px')
    expect(tabStyles.paddingY).toBe('12px')

    // Should have minimum touch targets of 44px
    expect(tabStyles.minHeight).toBe('44px')
    expect(tabStyles.minWidth).toBe('44px')
  })

  test('should display prominent tabs in teacher dashboard', async ({ page }) => {
    // Navigate to teacher dashboard (assuming logged in as teacher)
    await page.goto('/teacher')

    // Check that prominent tabs are present
    const tabsList = page.locator('[role="tablist"]')
    await expect(tabsList).toBeVisible()

    // Check individual tabs
    const overviewTab = page.locator('[role="tab"]').filter({ hasText: 'Overview' })
    const classesTab = page.locator('[role="tab"]').filter({ hasText: 'My Classes' })
    const studentsTab = page.locator('[role="tab"]').filter({ hasText: 'Students' })
    const contentTab = page.locator('[role="tab"]').filter({ hasText: 'Content' })
    const moderationTab = page.locator('[role="tab"]').filter({ hasText: 'Moderation' })

    await expect(overviewTab).toBeVisible()
    await expect(classesTab).toBeVisible()
    await expect(studentsTab).toBeVisible()
    await expect(contentTab).toBeVisible()
    await expect(moderationTab).toBeVisible()
  })

  test('should display prominent tabs in admin dashboard', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin')

    // Check that prominent tabs are present
    const tabsList = page.locator('[role="tablist"]')
    await expect(tabsList).toBeVisible()

    // Check individual tabs
    const overviewTab = page.locator('[role="tab"]').filter({ hasText: 'Overview' })
    const contentTab = page.locator('[role="tab"]').filter({ hasText: 'Content' })
    const usersTab = page.locator('[role="tab"]').filter({ hasText: 'Users' })
    const analyticsTab = page.locator('[role="tab"]').filter({ hasText: 'Analytics' })

    await expect(overviewTab).toBeVisible()
    await expect(contentTab).toBeVisible()
    await expect(usersTab).toBeVisible()
    await expect(analyticsTab).toBeVisible()
  })

  test('should have proper active/inactive states', async ({ page }) => {
    await page.goto('/learning/curriculum')

    // Check initial active state
    const curriculumTab = page.locator('[role="tab"]').filter({ hasText: 'Curriculum Browser' })
    await expect(curriculumTab).toHaveAttribute('data-state', 'active')

    // Check that active tab has brand colors
    const activeTabClasses = await curriculumTab.getAttribute('class')
    expect(activeTabClasses).toContain('bg-brand-slate-900')
    expect(activeTabClasses).toContain('text-white')

    // Click on another tab
    const pathTab = page.locator('[role="tab"]').filter({ hasText: 'My Path' })
    await pathTab.click()

    // Check that the new tab is now active
    await expect(pathTab).toHaveAttribute('data-state', 'active')
    await expect(curriculumTab).toHaveAttribute('data-state', 'inactive')

    // Check inactive tab styling
    const inactiveTabClasses = await curriculumTab.getAttribute('class')
    expect(inactiveTabClasses).toContain('hover:bg-slate-200')
    expect(inactiveTabClasses).toContain('dark:hover:bg-slate-700')
  })

  test('should be accessible with keyboard navigation', async ({ page }) => {
    await page.goto('/learning/curriculum')

    // Focus on first tab
    const curriculumTab = page.locator('[role="tab"]').filter({ hasText: 'Curriculum Browser' })
    await curriculumTab.focus()

    // Check focus styling
    await expect(curriculumTab).toHaveAttribute('data-state', 'active')

    // Tab to next tab
    await page.keyboard.press('ArrowRight')
    const pathTab = page.locator('[role="tab"]').filter({ hasText: 'My Path' })
    await expect(pathTab).toBeFocused()

    // Activate with Enter
    await page.keyboard.press('Enter')
    await expect(pathTab).toHaveAttribute('data-state', 'active')
  })

  test('should be mobile-friendly with proper touch targets', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/learning/curriculum')

    // Check that tabs are still properly sized on mobile
    const curriculumTab = page.locator('[role="tab"]').filter({ hasText: 'Curriculum Browser' })

    const boundingBox = await curriculumTab.boundingBox()
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44) // Minimum touch target
    expect(boundingBox!.width).toBeGreaterThanOrEqual(44)
  })
})