import { test, expect } from '@playwright/test'

test.describe('Landing Page Branding', () => {
  test('should display new Skill-Gain logo and branding', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/')

    // Check that the new SVG logo is present
    const logo = page.locator('img[alt="Skill-Gain"]')
    await expect(logo).toBeVisible()

    // Verify the logo source is correct
    await expect(logo).toHaveAttribute('src', '/logo.svg')

    // Check that old branding text is not present
    await expect(page.locator('text=DreamForge')).toHaveCount(0)
    await expect(page.locator('text=Dream Forge')).toHaveCount(0)
    await expect(page.locator('text=South Africa')).toHaveCount(0)
    await expect(page.locator('text=SA')).toHaveCount(0)
    await expect(page.locator('text=Cape')).toHaveCount(0)

    // Check that new branding text is present
    await expect(page.locator('text=skill-gain')).toBeVisible()

    // Verify the page title contains the new branding
    await expect(page).toHaveTitle(/Skill-Gain/)
  })

  test('should have updated metadata', async ({ page }) => {
    await page.goto('/')

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', /Skill-Gain/)

    // Check Open Graph title
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /Skill-Gain/)

    // Check Twitter title
    const twitterTitle = page.locator('meta[name="twitter:title"]')
    await expect(twitterTitle).toHaveAttribute('content', /Skill-Gain/)
  })

  test('should display dark theme with hexagonal network aesthetic', async ({ page }) => {
    await page.goto('/')

    // Check that the page has dark background styling
    const heroSection = page.locator('section').first()
    const backgroundColor = await heroSection.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(backgroundColor).toMatch(/rgba?\(15, 23, 42|30, 41, 59|51, 65, 85/) // Dark navy/slate colors
  })
})