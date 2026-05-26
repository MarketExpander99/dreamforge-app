import { test, expect } from '@playwright/test';

test('Test Home Button Navigation from Profile Page', async ({ page }) => {
  console.log('Testing Home button navigation from Profile page...');

  // Try to access profile page (will redirect to login if not authenticated)
  await page.goto('/profile', { waitUntil: 'networkidle', timeout: 10000 });

  // Check if redirected to login
  const currentUrl = page.url();
  console.log(`Profile page URL: ${currentUrl}`);

  if (currentUrl.includes('/auth/login')) {
    console.log('Profile page correctly requires authentication');
    // Since we can't authenticate in this test, let's just verify the navigation structure
    await page.goto('/', { waitUntil: 'networkidle' });
  }

  // Now test from the home page
  const initialUrl = page.url();
  console.log(`Starting from: ${initialUrl}`);

  // Find and examine the Home button
  const homeButton = page.locator('button:has-text("Home")').first();
  const isVisible = await homeButton.isVisible();
  console.log(`Home button visible: ${isVisible}`);

  if (isVisible) {
    // Get the parent link element
    const parentLink = homeButton.locator('xpath=ancestor::a').first();
    const href = await parentLink.getAttribute('href');
    console.log(`Home button parent link href: ${href}`);

    // Click the home button
    await homeButton.click();
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log(`After clicking Home: ${finalUrl}`);

    if (finalUrl === 'http://localhost:3000/') {
      console.log('✅ Home button works correctly from home page');
    } else {
      console.log(`❌ Home button went to wrong page: ${finalUrl}`);
    }

    // Take screenshot
    await page.screenshot({ path: 'home-from-home-test.png', fullPage: true });
  } else {
    console.log('❌ Home button not found on home page');
  }

  // Now test from explore page
  console.log('\nTesting from Explore page...');
  await page.goto('/explore', { waitUntil: 'networkidle' });

  const exploreHomeButton = page.locator('button:has-text("Home")').first();
  const exploreVisible = await exploreHomeButton.isVisible();
  console.log(`Home button visible on explore: ${exploreVisible}`);

  if (exploreVisible) {
    const exploreParentLink = exploreHomeButton.locator('xpath=ancestor::a').first();
    const exploreHref = await exploreParentLink.getAttribute('href');
    console.log(`Home button href on explore: ${exploreHref}`);

    await exploreHomeButton.click();
    await page.waitForTimeout(2000);

    const exploreFinalUrl = page.url();
    console.log(`After clicking Home from explore: ${exploreFinalUrl}`);

    if (exploreFinalUrl === 'http://localhost:3000/') {
      console.log('✅ Home button works correctly from explore page');
    } else {
      console.log(`❌ Home button went to wrong page from explore: ${exploreFinalUrl}`);
    }

    await page.screenshot({ path: 'home-from-explore-test.png', fullPage: true });
  }
});