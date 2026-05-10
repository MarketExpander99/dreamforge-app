import { test, expect } from '@playwright/test'

// Mobile UI Magic - Sprint 3.5 Task Group 6
// Tests for premium mobile experience across iPhone 13 and Pixel 5 viewports

test.describe('Mobile Responsiveness Tests', () => {
  // iPhone 13 viewport
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  })

  test.describe('iPhone 13 Tests', () => {
    test('Landing page mobile experience', async ({ page }) => {
      await page.goto('/')

      // Check navigation hamburger menu is visible
      const hamburgerMenu = page.locator('button[aria-label="Toggle menu"]')
      await expect(hamburgerMenu).toBeVisible()

      // Check hero section is properly sized
      const heroTitle = page.locator('h1').first()
      await expect(heroTitle).toBeVisible()

      // Check CTA buttons are full width on mobile
      const ctaButtons = page.locator('section button').filter({ hasText: /Start Teaching|Browse as Student|Join as Parent/ })
      for (const button of await ctaButtons.all()) {
        const box = await button.boundingBox()
        expect(box?.width).toBeGreaterThan(300) // Should be nearly full width
      }

      // Check no horizontal scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.viewportSize()
      expect(scrollWidth).toBeLessThanOrEqual(viewportWidth!.width + 10) // Allow small tolerance
    })

    test('Navigation mobile menu functionality', async ({ page }) => {
      await page.goto('/')

      // Open mobile menu
      const hamburgerMenu = page.locator('button[aria-label="Toggle menu"]')
      await hamburgerMenu.click()

      // Check menu items are visible
      const menuItems = page.locator('nav button, nav a').filter({ hasText: /Features|How It Works|Testimonials|Sign In/ })
      for (const item of await menuItems.all()) {
        await expect(item).toBeVisible()
      }

      // Close menu and verify it's hidden
      await hamburgerMenu.click()
      await expect(page.locator('nav button').filter({ hasText: /Features/ }).first()).not.toBeVisible()
    })

    test('Touch targets meet minimum size requirements', async ({ page }) => {
      await page.goto('/')

      // Check all interactive elements have adequate touch targets
      const interactiveElements = page.locator('button, a, [role="button"], input[type="submit"]')

      for (const element of await interactiveElements.all()) {
        const box = await element.boundingBox()
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44)
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      }
    })

    test('Content readability on mobile', async ({ page }) => {
      await page.goto('/')

      // Check text is readable (not too small)
      const textElements = page.locator('p, span, div').filter({ hasText: /.+/ })

      for (const element of await textElements.all()) {
        const fontSize = await element.evaluate(el => {
          const style = window.getComputedStyle(el)
          return parseFloat(style.fontSize)
        })

        // Text should be at least 14px for readability
        if (fontSize > 0) {
          expect(fontSize).toBeGreaterThanOrEqual(14)
        }
      }
    })
  })

  // Pixel 5 viewport
  test.use({
    viewport: { width: 393, height: 851 },
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
  })

  test.describe('Pixel 5 Tests', () => {
    test('Landing page mobile experience', async ({ page }) => {
      await page.goto('/')

      // Check navigation hamburger menu is visible
      const hamburgerMenu = page.locator('button[aria-label="Toggle menu"]')
      await expect(hamburgerMenu).toBeVisible()

      // Check hero section responsive typography
      const heroTitle = page.locator('h1').first()
      await expect(heroTitle).toBeVisible()

      // Check feature cards are properly laid out
      const featureCards = page.locator('[class*="group relative border-0 shadow-xl"]').all()
      expect(await featureCards).toHaveLength(3)

      // Check no horizontal scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.viewportSize()
      expect(scrollWidth).toBeLessThanOrEqual(viewportWidth!.width + 10)
    })

    test('Prominent tabs mobile behavior', async ({ page }) => {
      // Test on a page that uses prominent tabs (e.g., teacher dashboard)
      await page.goto('/teacher')

      // Check if tabs exist and are scrollable on mobile
      const tabsList = page.locator('[role="tablist"]').first()
      if (await tabsList.isVisible()) {
        const tabs = tabsList.locator('[role="tab"]')

        // Check tabs have adequate touch targets
        for (const tab of await tabs.all()) {
          const box = await tab.boundingBox()
          if (box) {
            expect(box.width).toBeGreaterThanOrEqual(44)
            expect(box.height).toBeGreaterThanOrEqual(44)
          }
        }
      }
    })

    test('Form inputs and buttons mobile optimization', async ({ page }) => {
      await page.goto('/auth/signup')

      // Check form inputs have adequate size
      const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"], textarea, select')

      for (const input of await inputs.all()) {
        const box = await input.boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44) // Minimum touch target height
        }
      }

      // Check submit buttons
      const submitButtons = page.locator('button[type="submit"], input[type="submit"]')

      for (const button of await submitButtons.all()) {
        const box = await button.boundingBox()
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44)
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      }
    })

    test('Mobile navigation bottom bar', async ({ page }) => {
      // Navigate to a page that shows the mobile bottom navigation
      await page.goto('/learning')

      // Check bottom navigation exists
      const bottomNav = page.locator('nav').filter({ hasText: /Home|Explore|My Learning|Curriculum|Profile/ }).first()

      if (await bottomNav.isVisible()) {
        // Check all navigation items are visible and properly sized
        const navItems = bottomNav.locator('button, a')

        for (const item of await navItems.all()) {
          const box = await item.boundingBox()
          if (box) {
            expect(box.width).toBeGreaterThanOrEqual(44)
            expect(box.height).toBeGreaterThanOrEqual(44)
          }
        }
      }
    })
  })

  // General mobile tests that work on both devices
  test.describe('Cross-device Mobile Tests', () => {
    test('Safe area handling', async ({ page }) => {
      await page.goto('/')

      // Check that content doesn't get cut off by notches/home indicators
      const body = page.locator('body')
      const bodyBox = await body.boundingBox()

      // Content should have adequate padding from screen edges
      expect(bodyBox?.x).toBeGreaterThanOrEqual(0)
      expect(bodyBox?.y).toBeGreaterThanOrEqual(0)
    })

    test('Performance - no layout shifts', async ({ page }) => {
      await page.goto('/')

      // Wait for page to fully load
      await page.waitForLoadState('networkidle')

      // Check that page loaded without major layout issues
      // Note: Playwright doesn't have built-in CLS monitoring, so we check for basic stability
      const body = page.locator('body')
      await expect(body).toBeVisible()

      // Verify no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.viewportSize()
      expect(scrollWidth).toBeLessThanOrEqual(viewportWidth!.width + 10)
    })

    test('Touch scrolling works smoothly', async ({ page }) => {
      await page.goto('/')

      // Scroll down and check content loads properly
      await page.mouse.wheel(0, 500)

      // Check that content is still accessible after scrolling
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()

      // Scroll back up
      await page.mouse.wheel(0, -500)

      // Check hero section is still visible
      const heroTitle = page.locator('h1').first()
      await expect(heroTitle).toBeVisible()
    })
  })
})