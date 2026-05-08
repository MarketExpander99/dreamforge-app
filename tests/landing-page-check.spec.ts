import { test, expect } from '@playwright/test';

test('Check Landing Page Buttons Visibility', async ({ page }) => {
  console.log('Checking landing page button visibility...');

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'landing-page-full.png', fullPage: true });

  // Check all buttons
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log(`Found ${buttonCount} buttons`);

  for (let i = 0; i < buttonCount; i++) {
    const button = buttons.nth(i);
    const isVisible = await button.isVisible();
    const text = await button.textContent();
    const classes = await button.getAttribute('class');

    console.log(`Button ${i}: "${text?.trim()}" - Visible: ${isVisible} - Classes: ${classes}`);
  }

  // Check all links
  const links = page.locator('a');
  const linkCount = await links.count();
  console.log(`Found ${linkCount} links`);

  for (let i = 0; i < Math.min(linkCount, 20); i++) {
    const link = links.nth(i);
    const isVisible = await link.isVisible();
    const text = await link.textContent();
    const href = await link.getAttribute('href');

    console.log(`Link ${i}: "${text?.trim()}" - Visible: ${isVisible} - Href: ${href}`);
  }
});