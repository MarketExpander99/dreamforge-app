import { test, expect } from '@playwright/test'

test.describe('Assessment Grade Persistence', () => {
  test('should save grade to profile after completing assessment', async ({ page }) => {
    // Navigate to assessment page
    await page.goto('/assessment')

    // Wait for questions to load
    await page.waitForSelector('text=Grade Level Assessment')

    // Get initial question count
    const questionText = await page.locator('text=Question').first().textContent()
    const totalQuestions = questionText?.match(/of (\d+)/)?.[1]

    if (!totalQuestions) {
      throw new Error('Could not determine total number of questions')
    }

    // Answer all questions
    for (let i = 0; i < parseInt(totalQuestions); i++) {
      // Wait for question to be visible
      await page.waitForSelector('text=Question')

      // Check question type and answer accordingly
      const multipleChoiceSelect = page.locator('select').first()
      const textArea = page.locator('textarea').first()

      if (await multipleChoiceSelect.isVisible()) {
        // Multiple choice question - select first option
        await multipleChoiceSelect.selectOption({ index: 0 })
      } else if (await textArea.isVisible()) {
        // Text input question
        await textArea.fill('Sample answer for testing')
      }

      // Click next/finish button
      const nextButton = page.getByRole('button', { name: i === parseInt(totalQuestions) - 1 ? 'Finish' : 'Next' })
      await nextButton.click()
    }

    // Wait for review page
    await page.waitForSelector('text=Review Your Answers')

    // Submit assessment
    const submitButton = page.getByRole('button', { name: 'Submit Assessment' })
    await submitButton.click()

    // Wait for assessment result
    await page.waitForSelector('text=Assessment Complete!')

    // Verify grade is displayed
    const gradeElement = page.locator('text=Grade').first()
    await expect(gradeElement).toBeVisible()

    // Navigate to curriculum page to verify grade is saved
    const exploreButton = page.getByRole('button', { name: 'Explore Curriculum' })
    await exploreButton.click()

    // Wait for curriculum page to load
    await page.waitForURL('/learning/curriculum')

    // Check if grade is displayed in the curriculum selector (for parents) or if the page loads successfully
    await page.waitForSelector('text=CAPS Curriculum Browser')

    // Navigate to profile page to verify grade is saved
    await page.goto('/profile')

    // Wait for profile to load
    await page.waitForSelector('text=Profile Information')

    // Check that grade level is displayed and not "Not specified"
    const gradeBadge = page.locator('text=Grade').first()
    await expect(gradeBadge).toBeVisible()

    // Verify it's not the default "Not specified"
    const gradeText = await gradeBadge.textContent()
    expect(gradeText).not.toBe('Not specified')
    expect(gradeText).toMatch(/Grade \d+/)
  })

  test('should handle assessment submission errors gracefully', async ({ page }) => {
    // Navigate to assessment page
    await page.goto('/assessment')

    // Wait for questions to load
    await page.waitForSelector('text=Grade Level Assessment')

    // Get initial question count
    const questionText = await page.locator('text=Question').first().textContent()
    const totalQuestions = questionText?.match(/of (\d+)/)?.[1]

    if (!totalQuestions) {
      throw new Error('Could not determine total number of questions')
    }

    // Answer all questions
    for (let i = 0; i < parseInt(totalQuestions); i++) {
      // Wait for question to be visible
      await page.waitForSelector('text=Question')

      // Check question type and answer accordingly
      const multipleChoiceSelect = page.locator('select').first()
      const textArea = page.locator('textarea').first()

      if (await multipleChoiceSelect.isVisible()) {
        // Multiple choice question - select first option
        await multipleChoiceSelect.selectOption({ index: 0 })
      } else if (await textArea.isVisible()) {
        // Text input question
        await textArea.fill('Sample answer for testing')
      }

      // Click next/finish button
      const nextButton = page.getByRole('button', { name: i === parseInt(totalQuestions) - 1 ? 'Finish' : 'Next' })
      await nextButton.click()
    }

    // Wait for review page
    await page.waitForSelector('text=Review Your Answers')

    // Mock a network error by intercepting the API call
    await page.route('/api/assessment/grade', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    // Submit assessment
    const submitButton = page.getByRole('button', { name: 'Submit Assessment' })
    await submitButton.click()

    // Verify error message is displayed
    await page.waitForSelector('text=Internal server error')
    const errorMessage = page.locator('text=Internal server error')
    await expect(errorMessage).toBeVisible()
  })
})