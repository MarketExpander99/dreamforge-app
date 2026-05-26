import { test, expect } from '@playwright/test'
import { createTestStudent, createTestTeacher, cleanTestUser } from './helpers/test-roles'

test.describe('Authentication & Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.afterEach(async ({ page }) => {
    await cleanTestUser(page)
  })

  test('Happy path: Student signup, confirmation, login, onboarding redirect', async ({ page }) => {
    // Signup as student
    await page.click('text=Start Teaching Free') // or Get Started
    await page.waitForURL('**/auth/signup')
    await page.click('text=Student (13+ years old)')
    await page.fill('input[placeholder="Enter your email"]', 'teststudent@example.com')
    await page.fill('input[placeholder="Create a password"]', 'password123')
    await page.fill('input[placeholder="Enter your full name"]', 'Test Student')
    await page.selectOption('select#grade', '10')
    await page.click('button:has-text("Create Account")')
    await expect(page).toHaveURL('**/auth/confirm')

    // Simulate email confirmation (in real test, would use API or mock)
    await page.goto('/auth/confirm?token_hash=mock_token&type=signup')
    await expect(page.locator('text=Email confirmed successfully')).toBeVisible()

    // Login
    await page.goto('/auth/login')
    await page.fill('input[placeholder="Enter your email"]', 'teststudent@example.com')
    await page.fill('input[placeholder="Enter your password"]', 'password123')
    await page.click('button:has-text("Sign In")')
    await expect(page).toHaveURL('**/student/onboarding') // Assuming onboarding page exists

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('button')).toBeVisible() // Check responsive
  })

  test('Happy path: Teacher signup, login, teacher onboarding', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.click('text=Teacher')
    await page.fill('input[placeholder="Enter your email"]', 'testteacher@example.com')
    await page.fill('input[placeholder="Create a password"]', 'password123')
    await page.fill('input[placeholder="Enter your full name"]', 'Test Teacher')
    await page.fill('input[placeholder="Enter your school name"]', 'Test School')
    await page.click('button:has-text("Create Account")')

    // Confirmation
    await page.goto('/auth/confirm?token_hash=mock_token&type=signup')
    await expect(page.locator('text=Email confirmed successfully')).toBeVisible()

    // Login
    await page.goto('/auth/login')
    await page.fill('input[placeholder="Enter your email"]', 'testteacher@example.com')
    await page.fill('input[placeholder="Enter your password"]', 'password123')
    await page.click('button:has-text("Sign In")')
    await expect(page).toHaveURL('**/teacher/onboarding')

    // Complete onboarding (simulate)
    await page.click('button:has-text("Complete Setup")')
    await expect(page).toHaveURL('**/teacher')
  })

  test('Parent signup and family dashboard access', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.click('text=Parent registering a child')
    await page.fill('input[placeholder="Enter your email"]', 'testparent@example.com')
    await page.fill('input[placeholder="Create a password"]', 'password123')
    await page.fill('input[placeholder="Enter your full name"]', 'Test Parent')
    await page.fill('input[placeholder="Enter your child\'s full name"]', 'Test Child')
    await page.fill('input[placeholder="Enter your child\'s age"]', '14')
    await page.click('button:has-text("Create Account")')

    // Confirmation and login
    await page.goto('/auth/confirm?token_hash=mock_token&type=signup')
    await page.goto('/auth/login')
    await page.fill('input[placeholder="Enter your email"]', 'testparent@example.com')
    await page.fill('input[placeholder="Enter your password"]', 'password123')
    await page.click('button:has-text("Sign In")')
    await expect(page).toHaveURL('**/family')

    // Role protection: Try accessing teacher route
    await page.goto('/teacher')
    await expect(page).toHaveURL('**/?') // Redirected to home
  })

  test('Edge case: Wrong password', async ({ page }) => {
    await createTestStudent(page) // Assume helper creates user

    await page.goto('/auth/login')
    await page.fill('input[placeholder="Enter your email"]', 'teststudent@example.com')
    await page.fill('input[placeholder="Enter your password"]', 'wrongpass')
    await page.click('button:has-text("Sign In")')

    // Should show reset modal
    await expect(page.locator('text=Reset Password')).toBeVisible()
    await page.click('button:has-text("Reset Password Now")')
    await expect(page.locator('text=Password reset email sent')).toBeVisible({ timeout: 5000 })
  })

  test('Edge case: Unconfirmed email login', async ({ page }) => {
    // Assume user signed up but not confirmed
    await page.goto('/auth/login')
    await page.fill('input[placeholder="Enter your email"]', 'unconfirmed@example.com')
    await page.fill('input[placeholder="Enter your password"]', 'password123')
    await page.click('button:has-text("Sign In")')

    // Should prompt resend confirmation
    await page.click('button:has-text("OK")') // Confirm dialog
    await expect(page.locator('text=Confirmation email has been resent')).toBeVisible()
  })

  test('Role switching protection', async ({ page }) => {
    await createTestStudent(page)

    await page.goto('/auth/login')
    await page.fill('input[placeholder="Enter your email"]', 'teststudent@example.com')
    await page.fill('input[placeholder="Enter your password"]', 'password123')
    await page.click('button:has-text("Sign In")')
    await expect(page).toHaveURL('**/student*')

    // Try accessing teacher route
    await page.goto('/teacher')
    await expect(page).toHaveURL('**/?') // Redirected

    // Logout and login as teacher
    await page.click('button:has-text("Sign Out")') // Assume logout button
    await createTestTeacher(page)
    await page.goto('/auth/login')
    await page.fill('input[placeholder="Enter your email"]', 'testteacher@example.com')
    await page.fill('input[placeholder="Enter your password"]', 'password123')
    await page.click('button:has-text("Sign In")')
    await expect(page).toHaveURL('**/teacher*')
  })

  test('Mobile responsiveness for auth flows', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/auth/signup')
    await expect(page.locator('button[role="role"]')).toBeVisible() // Role buttons
    await page.click('text=Student (13+ years old)')
    await expect(page.locator('input[placeholder="Enter your email"]')).toBeVisible()
    await page.click('button:has-text("Create Account")')

    await page.goto('/auth/login')
    await expect(page.locator('input[placeholder="Enter your email"]')).toBeVisible({ timeout: 5000 })
  })
})