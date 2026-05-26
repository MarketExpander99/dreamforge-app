import { test, expect } from '@playwright/test';

test('Test Home Button Navigation', async ({ page }) => {
  console.log('Testing Home button navigation...');

  // Start on explore page to test Home button
  await page.goto('/explore', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const initialUrl = page.url();
  console.log(`Started on: ${initialUrl}`);

  // Find and click the Home button
  const homeButton = page.locator('button:has-text("Home")').first();
  const isVisible = await homeButton.isVisible();
  console.log(`Home button visible: ${isVisible}`);

  if (isVisible) {
    // Get the button's parent link to see what href it has
    const parentLink = homeButton.locator('xpath=ancestor::a').first();
    const href = await parentLink.getAttribute('href');
    console.log(`Home button href: ${href}`);

    await homeButton.click();
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log(`After clicking Home: ${finalUrl}`);

    if (finalUrl === 'http://localhost:3000/') {
      console.log('✅ Home button works correctly');
    } else {
      console.log(`❌ Home button went to wrong page: ${finalUrl}`);
    }

    // Take screenshot
    await page.screenshot({ path: 'home-button-test.png', fullPage: true });
  } else {
    console.log('❌ Home button not found');
  }
});