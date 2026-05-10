import { test, expect } from '@playwright/test'

test.describe('Diagnostic Assessment', () => {
  test('should complete diagnostic assessment and save results', async ({ page }) => {
    // Navigate to diagnostic assessment page
    await page.goto('/learning/curriculum/assessment')

    // Wait for assessment to load
    await page.waitForSelector('text=Diagnostic Assessment')

    // Wait for questions to be generated (may take a moment)
    await page.waitForSelector('text=Question 1 of 12', { timeout: 30000 })

    // Answer all 12 questions
    for (let i = 0; i < 12; i++) {
      // Wait for question to be visible
      await page.waitForSelector(`text=Question ${i + 1} of 12`)

      // Check question type and answer accordingly
      const multipleChoiceButtons = page.locator('button').filter({ hasText: /^[A-D]\./ })
      const textArea = page.locator('textarea').first()

      if (await multipleChoiceButtons.first().isVisible()) {
        // Multiple choice question - click first option
        await multipleChoiceButtons.first().click()
      } else if (await textArea.isVisible()) {
        // Short answer question
        await textArea.fill('Sample answer for testing')
      }

      // Click next button (or finish on last question)
      const nextButton = page.getByRole('button', { name: i === 11 ? 'Finish' : 'Next' })
      await nextButton.click()
    }

    // Wait for review page
    await page.waitForSelector('text=Review Your Answers')

    // Submit assessment
    const submitButton = page.getByRole('button', { name: 'Submit Assessment' })
    await submitButton.click()

    // Wait for assessment result with celebration
    await page.waitForSelector('text=Assessment Complete!', { timeout: 60000 })

    // Verify results are displayed
    await expect(page.locator('text=Recommended Grade Level')).toBeVisible()
    await expect(page.locator('text=Subject Proficiency Breakdown')).toBeVisible()
    await expect(page.locator('text=Your Strengths')).toBeVisible()
    await expect(page.locator('text=Areas for Growth')).toBeVisible()

    // Check that a grade is recommended
    const gradeElement = page.locator('text=Grade').first()
    await expect(gradeElement).toBeVisible()

    // Navigate to curriculum page to verify assessment completion
    const startLearningButton = page.getByRole('button', { name: 'Start Learning' })
    await startLearningButton.click()

    // Wait for curriculum page to load
    await page.waitForURL('/learning/curriculum')

    // Verify curriculum page loads successfully
    await page.waitForSelector('text=CAPS Curriculum Browser')

    // Navigate to profile page to verify results are saved
    await page.goto('/profile')

    // Wait for profile to load
    await page.waitForSelector('text=Profile Information')

    // Check that grade level is displayed and assessment is marked complete
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