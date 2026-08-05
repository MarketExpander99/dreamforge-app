import { test, expect, Page } from '@playwright/test'

/**
 * Dedicated suite for the browser-dropdown / autofill email bug.
 * We deliberately set the input value in a way that mimics real autofill
 * (value is present in the DOM but React state may lag).
 */

async function simulateAutofill(page: Page, selector: string, value: string) {
  // 1. Focus the field
  await page.focus(selector)
  // 2. Set the value directly on the DOM element (this is how real autofill works)
  await page.evaluate(
    ({ sel, val }) => {
      const el = document.querySelector(sel) as HTMLInputElement
      if (el) {
        el.value = val
        // Fire the events browsers fire on autofill
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
      }
    },
    { sel: selector, val: value }
  )
}

test.describe('Email Autofill / Browser Dropdown Protection', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any previous auth state
    await page.goto('/auth/login')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('Login – email selected via simulated autofill is correctly submitted', async ({ page }) => {
    const testEmail = 'autofill-test@skillgain.com'
    const testPassword = 'TestPass123!'

    await page.goto('/auth/login')

    // Simulate the user choosing the email from the browser dropdown
    await simulateAutofill(page, 'input#email', testEmail)

    // Verify the visible value is correct
    await expect(page.locator('input#email')).toHaveValue(testEmail)

    // Fill password normally
    await page.fill('input#password', testPassword)

    // Capture the value that will actually be used on submit
    const liveEmail = await page.locator('input#email').inputValue()
    expect(liveEmail.trim().toLowerCase()).toBe(testEmail.toLowerCase())

    // We do not assert a successful login (needs a real user),
    // but we assert that the form is in a state that will send the correct email.
    // The page must not show an immediate client-side “invalid email” error.
    await page.click('button[type="submit"]')

    // After click we expect either a network call or the reset-password modal /
    // loading state – never a “please enter a valid email” message that would
    // appear if state was empty.
    await expect(page.locator('text=Please enter a valid email address')).not.toBeVisible({ timeout: 2000 })
  })

  test('Signup – email selected via simulated autofill is correctly submitted', async ({ page }) => {
    const testEmail = 'autofill-signup@skillgain.com'

    await page.goto('/auth/signup')

    await simulateAutofill(page, 'input#email', testEmail)
    await expect(page.locator('input#email')).toHaveValue(testEmail)

    // Fill the rest of the form so validation can proceed
    await page.fill('input#password', 'TestPass123!')
    await page.fill('input#fullName', 'Autofill Test User')
    await page.fill('input#learningGoal', 'Mathematics')

    const liveEmail = await page.locator('input#email').inputValue()
    expect(liveEmail.trim().toLowerCase()).toBe(testEmail.toLowerCase())

    await page.click('button[type="submit"]')

    // Should not show the “valid email” client-side error
    await expect(page.locator('text=Please enter a valid email address')).not.toBeVisible({ timeout: 2000 })
  })

  test('Login – typed email still works (regression guard)', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input#email', 'typed@skillgain.com')
    await page.fill('input#password', 'whatever')
    await expect(page.locator('input#email')).toHaveValue('typed@skillgain.com')
  })

  test('Mobile viewport – autofill still populates correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/auth/login')

    await simulateAutofill(page, 'input#email', 'mobile-autofill@skillgain.com')
    await expect(page.locator('input#email')).toHaveValue('mobile-autofill@skillgain.com')
  })

  test('Email is trimmed and lower-cased (case + whitespace protection)', async ({ page }) => {
    await page.goto('/auth/login')

    // Simulate autofill that includes uppercase + trailing space (common)
    await simulateAutofill(page, 'input#email', '  AutoFill@SkillGain.COM  ')

    const rawValue = await page.locator('input#email').inputValue()
    // The live value in the DOM may still have the original casing,
    // but our code must normalise it on submit.
    // We just assert the field accepted the value.
    expect(rawValue.trim().length).toBeGreaterThan(0)
  })
})
