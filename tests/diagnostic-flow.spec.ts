import { test, expect } from '@playwright/test';
import { createTestStudent, createTestTeacher, createTestParent, linkStudentToParent, cleanTestUser } from './helpers/test-roles';

test.describe('Diagnostic Assessment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clean up previous test data
    await cleanTestUser(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean up
    await cleanTestUser(page);
  });

  test('Complete diagnostic assessment flow end-to-end', async ({ page }) => {
    let consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('🚀 Starting Diagnostic Assessment E2E Test');

    // Step 1: Create and login as test student
    console.log('👤 Step 1: Creating and logging in as test student');
    const studentEmail = 'teststudent@example.com';
    await createTestStudent(page);
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');

    // Login with accurate locators
    await page.getByLabel('Email').fill(studentEmail);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify load time
    const loadTime = await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart);
    expect(loadTime).toBeLessThan(5000);

    // Step 2: Complete onboarding to trigger diagnostic
    console.log('📝 Step 2: Completing onboarding to trigger diagnostic');
    await page.goto('http://localhost:3000/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Complete onboarding steps
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(1500);
    }

    await page.getByRole('button', { name: 'Complete Onboarding' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 3: Navigate to diagnostic assessment
    console.log('📍 Step 3: Navigating to diagnostic assessment');
    await page.goto('http://localhost:3000/learning/curriculum/assessment');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify load time
    const assessmentLoadTime = await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart);
    expect(assessmentLoadTime).toBeLessThan(5000);

    // Step 4: Take screenshot of diagnostic start (desktop)
    console.log('📸 Step 4: Taking screenshot of diagnostic start (desktop)');
    await page.screenshot({ path: './screenshots/diagnostic-start-desktop.png', fullPage: true });

    // Verify page loaded
    await expect(page.getByRole('heading', { name: 'Diagnostic Assessment' })).toBeVisible();

    // Intercept API calls
    let apiCalls = 0;
    page.route('**/api/assessment/diagnostic', route => {
      apiCalls++;
      route.continue();
    });

    // Step 5: Complete the diagnostic quiz
    console.log('🎯 Step 5: Completing diagnostic quiz');
    for (let q = 0; q < 5; q++) { // Answer first 5 for speed
      console.log(`Answering question ${q + 1}`);

      // For multiple choice - click first option
      const option = page.getByRole('button', { name: /A\./ });
      if (await option.isVisible()) {
        await option.click();
      } else {
        // Short answer
        await page.getByRole('textbox').fill('Sample answer');
      }

      // Click next
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(1000);
    }

    // Take in-progress screenshot
    await page.screenshot({ path: './screenshots/diagnostic-question-in-progress-desktop.png', fullPage: true });

    // Finish remaining
    for (let q = 5; q < 10; q++) {
      await page.getByRole('button', { name: /A\./ }).click();
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(500);
    }

    // Step 6: Submit assessment
    console.log('📤 Step 6: Submitting assessment');
    await page.getByRole('button', { name: 'Submit Assessment' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify API call
    expect(apiCalls).toBeGreaterThan(0);

    // Step 7: Take screenshot of results (desktop)
    console.log('📸 Step 7: Taking screenshot of results (desktop)');
    await page.screenshot({ path: './screenshots/diagnostic-results-desktop.png', fullPage: true });

    // Step 8: Verify results displayed
    console.log('✅ Step 8: Verifying results displayed');
    await expect(page.getByRole('heading', { name: 'Assessment Complete!' })).toBeVisible();

    const recommendedGradeLocator = page.locator('[class*="text-6xl"]');
    const recommendedGrade = await recommendedGradeLocator.textContent();
    console.log('📊 Recommended grade:', recommendedGrade);

    const overallScoreLocator = page.locator('[class*="Overall Proficiency"]');
    const overallScore = await overallScoreLocator.textContent();
    console.log('📊 Overall score:', overallScore);

    // Verify profile updated
    await page.reload();
    await expect(page.getByText(recommendedGrade)).toBeVisible();

    // Step 9: Link student to parent for parent view
    await linkStudentToParent(page, studentEmail, 'testparent@example.com');

    // Step 10: Test teacher view
    console.log('👨‍🎓 Step 10: Testing teacher view');
    // Logout student
    await page.goto('http://localhost:3000/auth/logout');
    await page.waitForLoadState('networkidle');

    // Create and login as teacher
    await createTestTeacher(page);
    await page.goto('http://localhost:3000/auth/login');
    await page.getByLabel('Email').fill('testteacher@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to students page
    await page.goto('http://localhost:3000/teacher/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify diagnostic summary visible
    await expect(page.getByText('Diagnostic')).toBeVisible();

    // Take screenshot of teacher view
    console.log('📸 Taking screenshot of teacher-parent summary (desktop)');
    await page.screenshot({ path: './screenshots/teacher-parent-summary-desktop.png', fullPage: true });

    // Step 11: Test parent view
    console.log('👨‍👩‍👧 Step 11: Testing parent view');
    // Logout teacher
    await page.goto('http://localhost:3000/auth/logout');
    await page.waitForLoadState('networkidle');

    // Create and login as parent
    await createTestParent(page);
    await page.goto('http://localhost:3000/auth/login');
    await page.getByLabel('Email').fill('testparent@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to family dashboard
    await page.goto('http://localhost:3000/family');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify diagnostic summary visible in parent view
    await expect(page.getByText('Grade Assessment')).toBeVisible();
    await expect(page.getByText('Completed')).toBeVisible();

    // Take screenshot of parent view
    console.log('📸 Taking screenshot of parent view (desktop)');
    await page.screenshot({ path: './screenshots/teacher-parent-summary-desktop.png', fullPage: true }); // Reuse for both

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);

    console.log('🎉 Diagnostic Assessment E2E Test completed successfully!');
  });

  test('API error handling', async ({ page }) => {
    let consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const studentEmail = 'teststudent@example.com';
    await createTestStudent(page);
    await page.goto('http://localhost:3000/auth/login');
    await page.getByLabel('Email').fill(studentEmail);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Complete onboarding quickly
    await page.goto('http://localhost:3000/onboarding');
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(500);
    }
    await page.getByRole('button', { name: 'Complete Onboarding' }).click();
    await page.waitForTimeout(2000);

    // Navigate to assessment
    await page.goto('http://localhost:3000/learning/curriculum/assessment');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take start screenshot
    await page.screenshot({ path: './screenshots/diagnostic-start-desktop.png', fullPage: true });

    // Answer a few questions
    for (let q = 0; q < 5; q++) {
      await page.getByRole('button', { name: /A\./ }).click();
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(500);
    }

    // Take in-progress screenshot
    await page.screenshot({ path: './screenshots/diagnostic-question-in-progress-desktop.png', fullPage: true });

    // Intercept and abort POST for error
    page.route('**/api/assessment/diagnostic', route => {
      if (route.request().method() === 'POST') {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Submit to trigger error
    await page.getByRole('button', { name: 'Submit Assessment' }).click();
    await page.waitForTimeout(2000);

    // Verify error shown
    await expect(page.locator('[class*="bg-red-50"]')).toBeVisible();

    // Take error screenshot
    await page.screenshot({ path: './screenshots/api-error-screen.png', fullPage: true });

    // Verify retry button and click
    await expect(page.getByRole('button', { name: 'Retry Assessment' })).toBeVisible();
    await page.getByRole('button', { name: 'Retry Assessment' }).click();
    await page.waitForTimeout(3000);

    // Verify results after retry (assume second call succeeds)
    await expect(page.getByRole('heading', { name: 'Assessment Complete!' })).toBeVisible();

    // Take results screenshot
    await page.screenshot({ path: './screenshots/diagnostic-results-desktop.png', fullPage: true });

    expect(consoleErrors.length).toBe(0);

    console.log('🎉 API Error Handling Test completed successfully!');
  });

  test('RLS and route protection', async ({ page }) => {
    const studentEmail = 'teststudent@example.com';
    await createTestStudent(page);
    await page.goto('http://localhost:3000/auth/login');
    await page.getByLabel('Email').fill(studentEmail);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to access teacher route as student - should redirect
    await page.goto('http://localhost:3000/teacher/students');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/learning|profile|auth/);

    console.log('🎉 RLS and Route Protection Test completed successfully!');
  });

  test('Mobile responsiveness test', async ({ page }) => {
    let consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('📱 Starting Mobile Responsiveness Test');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const studentEmail = 'teststudent@example.com';
    await createTestStudent(page);
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Email').fill(studentEmail);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Complete onboarding (simplified for mobile)
    await page.goto('http://localhost:3000/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(1000);
    }

    await page.getByRole('button', { name: 'Complete Onboarding' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to assessment
    await page.goto('http://localhost:3000/learning/curriculum/assessment');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take mobile screenshot of start
    console.log('📸 Taking mobile screenshot of diagnostic start');
    await page.screenshot({ path: './screenshots/diagnostic-start-mobile.png', fullPage: true });

    // Answer first few questions on mobile
    await page.getByRole('button', { name: /A\./ }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(1000);

    // Take mobile screenshot of in-progress
    console.log('📸 Taking mobile screenshot of diagnostic in-progress');
    await page.screenshot({ path: './screenshots/diagnostic-question-in-progress-mobile.png', fullPage: true });

    // Complete quiz and submit
    for (let q = 1; q < 5; q++) {
      await page.getByRole('button', { name: /A\./ }).click();
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(500);
    }

    await page.getByRole('button', { name: 'Submit Assessment' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take mobile screenshot of results
    console.log('📸 Taking mobile screenshot of diagnostic results');
    await page.screenshot({ path: './screenshots/diagnostic-results-mobile.png', fullPage: true });

    // Verify mobile layout - no overflow
    const hasOverflow = await page.evaluate(() => document.body.scrollHeight > window.innerHeight * 2);
    expect(hasOverflow).toBeFalsy();

    // Verify teacher/parent summary on mobile
    await createTestTeacher(page);
    await page.goto('http://localhost:3000/auth/login');
    await page.getByLabel('Email').fill('testteacher@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForTimeout(2000);

    await page.goto('http://localhost:3000/teacher/students');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './screenshots/teacher-parent-summary-mobile.png', fullPage: true });

    await createTestParent(page);
    await page.goto('http://localhost:3000/auth/logout');
    await page.goto('http://localhost:3000/auth/login');
    await page.getByLabel('Email').fill('testparent@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForTimeout(2000);

    await page.goto('http://localhost:3000/family');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './screenshots/teacher-parent-summary-mobile.png', fullPage: true }); // Reuse

    expect(consoleErrors.length).toBe(0);

    console.log('📱 Mobile responsiveness test completed successfully!');
  });
});


