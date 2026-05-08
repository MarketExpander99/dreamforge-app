import { test, expect } from '@playwright/test';

test.describe('Quick Button & Action Audit - Critical Issues Only', () => {
  let auditResults: Array<{
    page: string;
    buttonText: string;
    status: 'working' | 'broken' | 'no-action';
    error?: string;
  }> = [];

  test('Audit Critical Navigation & CTA Buttons', async ({ page }) => {
    console.log('🚀 Starting Quick Button Audit');

    // Test landing page CTAs
    console.log('\n🔍 Testing Landing Page CTAs');
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const criticalButtons = [
      { name: 'Start Teaching Free', selector: 'button:has-text("Start Teaching Free")' },
      { name: 'Browse as Student', selector: 'button:has-text("Browse as Student")' },
      { name: 'Join as Parent', selector: 'button:has-text("Join as Parent")' },
      { name: 'Get Started (nav)', selector: 'nav button:has-text("Get Started")' },
      { name: 'Sign In (nav)', selector: 'nav button:has-text("Sign In")' },
    ];

    for (const button of criticalButtons) {
      try {
        const element = page.locator(button.selector).first();
        const isVisible = await element.isVisible({ timeout: 2000 });

        if (!isVisible) {
          auditResults.push({
            page: 'Landing Page',
            buttonText: button.name,
            status: 'no-action',
            error: 'Element not visible'
          });
          continue;
        }

        const initialUrl = page.url();
        await element.click({ timeout: 3000 });
        await page.waitForTimeout(4000); // Wait for navigation

        const finalUrl = page.url();
        const urlChanged = finalUrl !== initialUrl;

        auditResults.push({
          page: 'Landing Page',
          buttonText: button.name,
          status: urlChanged ? 'working' : 'no-action',
          error: urlChanged ? undefined : 'No navigation detected'
        });

        console.log(`${button.name}: ${urlChanged ? '✅' : '❌'}`);

        // Go back to landing page for next test
        if (urlChanged) {
          await page.goto('/', { waitUntil: 'networkidle' });
          await page.waitForTimeout(1000);
        }

      } catch (error) {
        auditResults.push({
          page: 'Landing Page',
          buttonText: button.name,
          status: 'broken',
          error: (error as Error).message
        });
        console.log(`${button.name}: ❌ ${(error as Error).message}`);
      }
    }

    // Test navigation buttons
    console.log('\n🔍 Testing Navigation Buttons');
    const navButtons = [
      { name: 'Home', selector: 'button:has-text("Home")' },
      { name: 'Explore', selector: 'button:has-text("Explore")' },
      { name: 'My Learning', selector: 'button:has-text("My Learning")' },
      { name: 'Curriculum', selector: 'button:has-text("Curriculum")' },
    ];

    for (const button of navButtons) {
      try {
        const element = page.locator(button.selector).first();
        const isVisible = await element.isVisible({ timeout: 2000 });

        if (!isVisible) {
          auditResults.push({
            page: 'Navigation',
            buttonText: button.name,
            status: 'no-action',
            error: 'Element not visible'
          });
          continue;
        }

        const initialUrl = page.url();
        await element.click({ timeout: 3000 });
        await page.waitForTimeout(4000);

        const finalUrl = page.url();
        const urlChanged = finalUrl !== initialUrl;

        auditResults.push({
          page: 'Navigation',
          buttonText: button.name,
          status: urlChanged ? 'working' : 'no-action',
          error: urlChanged ? undefined : 'No navigation detected'
        });

        console.log(`${button.name}: ${urlChanged ? '✅' : '❌'}`);

        // Go back to landing page for next test
        if (urlChanged) {
          await page.goto('/', { waitUntil: 'networkidle' });
          await page.waitForTimeout(1000);
        }

      } catch (error) {
        auditResults.push({
          page: 'Navigation',
          buttonText: button.name,
          status: 'broken',
          error: (error as Error).message
        });
        console.log(`${button.name}: ❌ ${(error as Error).message}`);
      }
    }
  });

  test.afterAll(async () => {
    console.log('\n🎉 QUICK AUDIT RESULTS');
    console.log('======================');

    const working = auditResults.filter(r => r.status === 'working').length;
    const broken = auditResults.filter(r => r.status === 'broken').length;
    const noAction = auditResults.filter(r => r.status === 'no-action').length;

    console.log(`✅ Working: ${working}`);
    console.log(`❌ Broken: ${broken}`);
    console.log(`⚠️ No Action: ${noAction}`);

    console.log('\n📋 Detailed Results:');
    auditResults.forEach(result => {
      const status = result.status === 'working' ? '✅' : result.status === 'broken' ? '❌' : '⚠️';
      console.log(`${status} ${result.page} - ${result.buttonText}: ${result.error || 'OK'}`);
    });

    const successRate = Math.round((working / auditResults.length) * 100);
    console.log(`\n📈 Success Rate: ${successRate}%`);

    if (broken === 0 && noAction === 0) {
      console.log('\n✅ AUDIT PASSED: All critical buttons working');
    } else {
      console.log(`\n❌ ISSUES FOUND: ${broken + noAction} buttons need attention`);
    }
  });
});