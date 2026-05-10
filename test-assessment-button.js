// Simple test to verify the Submit Assessment button functionality
const { chromium } = require('playwright');

async function testAssessmentButton() {
  console.log('Testing Submit Assessment button...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the assessment page
    console.log('Navigating to assessment page...');
    await page.goto('http://localhost:3000/assessment');

    // Wait for the page to load
    await page.waitForSelector('text=Grade Level Assessment', { timeout: 10000 });

    console.log('Assessment page loaded successfully');

    // Check if questions loaded
    const questions = await page.locator('[data-testid="question"]').count() ||
                     await page.locator('text=Question').count();

    console.log(`Found ${questions} questions`);

    // Try to complete a few questions to get to the review page
    console.log('Attempting to complete assessment questions...');

    // Look for input elements and fill them
    const textInputs = page.locator('textarea');
    const selectInputs = page.locator('select');

    let questionCount = 0;

    // Try to answer questions
    while (questionCount < 5) { // Try up to 5 questions
      try {
        // Check for textarea
        const textareaCount = await textInputs.count();
        if (textareaCount > 0) {
          await textInputs.first().fill('Sample answer for testing');
          console.log('Filled textarea');
        }

        // Check for select dropdown
        const selectCount = await selectInputs.count();
        if (selectCount > 0) {
          await selectInputs.first().selectOption({ index: 0 });
          console.log('Selected option from dropdown');
        }

        // Try to click Next/Finish button
        const nextButton = page.locator('button:has-text("Next")').or(page.locator('button:has-text("Finish")'));
        if (await nextButton.count() > 0) {
          await nextButton.click();
          console.log('Clicked Next/Finish button');
          questionCount++;
          await page.waitForTimeout(500); // Wait for transition
        } else {
          break; // No more next buttons
        }

      } catch (error) {
        console.log('Could not complete question:', error.message);
        break;
      }
    }

    // Wait for review page or check if we're there
    try {
      await page.waitForSelector('text=Review Your Answers', { timeout: 5000 });
      console.log('✅ Reached Review Your Answers page');
    } catch (error) {
      console.log('Did not reach Review Your Answers page, checking current state...');
    }

    // Check if the Submit Assessment button exists
    const submitButton = page.locator('button:has-text("Submit Assessment")');
    const buttonExists = await submitButton.count() > 0;

    if (buttonExists) {
      console.log('✅ Submit Assessment button found');

      // Check if button is clickable
      const isVisible = await submitButton.isVisible();
      const isEnabled = await submitButton.isEnabled();

      console.log(`Button visible: ${isVisible}`);
      console.log(`Button enabled: ${isEnabled}`);

      if (isVisible && isEnabled) {
        console.log('✅ Submit Assessment button is ready to use');

        // Try to click the button to test the API call
        console.log('Testing button click...');
        await submitButton.click();

        // Wait for response or error
        await page.waitForTimeout(2000);

        // Check for success message or error
        const successMessage = page.locator('text=Assessment Complete');
        const errorMessage = page.locator('text=Internal server error');

        if (await successMessage.count() > 0) {
          console.log('✅ Assessment submission successful');
        } else if (await errorMessage.count() > 0) {
          console.log('❌ Assessment submission failed with error');
        } else {
          console.log('⚠️ Assessment submission response unclear');
        }

      } else {
        console.log('❌ Submit Assessment button is not ready');
      }
    } else {
      console.log('❌ Submit Assessment button not found');
      console.log('This is expected if questions are not completed yet');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAssessmentButton();
