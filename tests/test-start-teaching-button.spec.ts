import { test, expect } from '@playwright/test';

test('Test Start Teaching Free Button', async ({ page }) => {
  console.log('Testing Start Teaching Free button...');

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Find the Start Teaching Free button
  const startTeachingButton = page.locator('button:has-text("Start Teaching Free")').first();
  const isVisible = await startTeachingButton.isVisible();
  console.log(`Button visible: ${isVisible}`);

  if (isVisible) {
    const initialUrl = page.url();
    console.log(`Initial URL: ${initialUrl}`);

    // Click the button
    await startTeachingButton.click();
    console.log('Button clicked');

    // Wait for navigation
    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);

    const urlChanged = finalUrl !== initialUrl;
    console.log(`URL changed: ${urlChanged}`);

    if (urlChanged) {
      console.log('✅ Button works - navigation successful');
    } else {
      console.log('❌ Button does not work - no navigation');
    }

    // Take screenshot
    await page.screenshot({ path: 'start-teaching-test.png', fullPage: true });
  } else {
    console.log('❌ Button not found');
  }
});