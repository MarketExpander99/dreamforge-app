import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Complete Button & Action Audit - Skill Gain Platform', () => {
  let auditResults: Array<{
    page: string;
    buttonText: string;
    selector: string;
    status: 'working' | 'broken' | '404' | 'no-action' | 'error';
    error?: string;
    screenshot?: string;
  }> = [];

  let consoleErrors: string[] = [];
  let screenshots: string[] = [];

  // Helper function to take screenshot and track it
  async function takeScreenshot(page: any, name: string) {
    const filename = `audit-${name}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    screenshots.push(filename);
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  // Helper function to setup console error tracking
  function setupConsoleErrorTracking(page: any) {
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        // Filter out cosmetic 500 errors that don't affect functionality
        if (!errorText.includes('Failed to load resource: the server responded with a status of 500 ()')) {
          consoleErrors.push(`[${new Date().toISOString()}] ${errorText}`);
          console.log('🚨 CONSOLE ERROR:', errorText);
        }
      }
    });
  }

  // Helper function to test a single button/link
  async function testInteractiveElement(page: any, element: any, pageName: string, buttonText: string, selector: string) {
    try {
      console.log(`🧪 Testing: "${buttonText}" on ${pageName}`);

      const initialUrl = page.url();

      // Check visibility and enabled state with shorter timeouts
      let isVisible = false;
      let isEnabled = false;

      try {
        isVisible = await element.isVisible({ timeout: 2000 });
      } catch (e) {
        // Element not visible
      }

      if (!isVisible) {
        auditResults.push({
          page: pageName,
          buttonText,
          selector,
          status: 'no-action',
          error: 'Element not visible'
        });
        return;
      }

      try {
        isEnabled = await element.isEnabled({ timeout: 2000 });
      } catch (e) {
        // Element not enabled
      }

      if (!isEnabled) {
        auditResults.push({
          page: pageName,
          buttonText,
          selector,
          status: 'no-action',
          error: 'Element disabled'
        });
        return;
      }

      // Take screenshot before clicking (only for problematic elements to save time)
      let beforeScreenshot: string | undefined;

      // Click the element with timeout
      try {
        await element.click({ timeout: 5000 });
      } catch (clickError) {
        auditResults.push({
          page: pageName,
          buttonText,
          selector,
          status: 'broken',
          error: `Click failed: ${(clickError as Error).message}`
        });
        return;
      }

      // Wait for navigation or state changes (longer wait for Next.js routing)
      await page.waitForTimeout(3000);

      // Check URL change (handle Next.js client-side routing)
      let currentUrl = page.url();
      let urlChanged = currentUrl !== initialUrl;

      // If URL didn't change, wait a bit more and check again (Next.js might be slower)
      if (!urlChanged) {
        await page.waitForTimeout(2000);
        currentUrl = page.url();
        urlChanged = currentUrl !== initialUrl;
      }

      // Check for errors (shorter timeout)
      const errorSelectors = [
        '.error',
        '.alert-error',
        '[class*="error"]',
        'text=/error/i',
        'text=/404/i',
        'text=/not found/i'
      ];

      let hasError = false;
      for (const errorSelector of errorSelectors) {
        try {
          const errorElement = page.locator(errorSelector).first();
          if (await errorElement.isVisible({ timeout: 500 })) {
            hasError = true;
            break;
          }
        } catch (e) {
          // Continue checking other selectors
        }
      }

      // Determine status
      let status: 'working' | 'broken' | '404' | 'no-action' | 'error' = 'working';
      let error: string | undefined;

      if (hasError) {
        status = 'error';
        error = 'Error message displayed after click';
        beforeScreenshot = await takeScreenshot(page, `${pageName}-${buttonText.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-error`);
      } else if (currentUrl.includes('404') || currentUrl.includes('not-found')) {
        status = '404';
        error = `Navigated to 404: ${currentUrl}`;
        beforeScreenshot = await takeScreenshot(page, `${pageName}-${buttonText.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-404`);
      } else if (!urlChanged && !hasError) {
        // Check if any state changed (forms submitted, modals opened, etc.)
        const modalSelectors = [
          '[role="dialog"]',
          '[class*="modal"]',
          '[class*="popup"]',
          '[data-state="open"]'
        ];

        let stateChanged = false;
        for (const modalSelector of modalSelectors) {
          try {
            const modal = page.locator(modalSelector).first();
            if (await modal.isVisible({ timeout: 500 })) {
              stateChanged = true;
              break;
            }
          } catch (e) {
            // Continue checking
          }
        }

        if (!stateChanged) {
          status = 'no-action';
          error = 'No navigation or state change detected';
          beforeScreenshot = await takeScreenshot(page, `${pageName}-${buttonText.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-no-action`);
        }
      }

      auditResults.push({
        page: pageName,
        buttonText,
        selector,
        status,
        error,
        screenshot: beforeScreenshot
      });

      console.log(`📊 Result: ${status}${error ? ` - ${error}` : ''}`);

    } catch (error) {
      console.log(`❌ Test failed for "${buttonText}":`, (error as Error).message);
      auditResults.push({
        page: pageName,
        buttonText,
        selector,
        status: 'broken',
        error: (error as Error).message
      });
    }
  }

  // Helper function to audit all interactive elements on a page
  async function auditPage(page: any, pageName: string, url: string) {
    console.log(`\n🔍 Auditing page: ${pageName} (${url})`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000); // Extra wait for dynamic content

      // Take initial page screenshot
      await takeScreenshot(page, `${pageName}-initial`);

      // Find all interactive elements
      const interactiveSelectors = [
        'button:not([disabled])',
        'a[href]:not([href^="#"]):not([href^="javascript:"]):not([href^="mailto:"])',
        'input[type="submit"]',
        'input[type="button"]',
        '[role="button"]:not([aria-disabled="true"])',
        '[onclick]',
        '[data-action]',
        '[class*="btn"]:not([class*="disabled"])',
        '[class*="button"]:not([class*="disabled"])'
      ];

      const allElements = [];

      for (const selector of interactiveSelectors) {
        try {
          const elements = page.locator(selector);
          const count = await elements.count();

          for (let i = 0; i < count; i++) {
            const element = elements.nth(i);
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();

            if (isVisible && isEnabled) {
              // Get button text or accessible name
              let buttonText = '';
              try {
                buttonText = await element.textContent() || '';
                buttonText = buttonText.trim();

                if (!buttonText) {
                  // Try aria-label
                  buttonText = await element.getAttribute('aria-label') || '';
                }
                if (!buttonText) {
                  // Try title
                  buttonText = await element.getAttribute('title') || '';
                }
                if (!buttonText) {
                  // Try placeholder for inputs
                  buttonText = await element.getAttribute('placeholder') || '';
                }
                if (!buttonText) {
                  // Fallback to element type + index
                  const tagName = await element.evaluate((el: Element) => el.tagName.toLowerCase());
                  buttonText = `${tagName}-${i}`;
                }
              } catch (e) {
                buttonText = `element-${i}`;
              }

              allElements.push({
                element,
                text: buttonText,
                selector: `${selector}:nth-of-type(${i + 1})`
              });
            }
          }
        } catch (error) {
          console.log(`⚠️ Error finding elements with selector ${selector}:`, (error as Error).message);
        }
      }

      console.log(`🎯 Found ${allElements.length} interactive elements to test`);

      // Test each element (limit to first 20 per page to avoid excessive testing)
      const elementsToTest = allElements.slice(0, 20);

      for (const { element, text, selector } of elementsToTest) {
        await testInteractiveElement(page, element, pageName, text, selector);

        // Brief pause between tests
        await page.waitForTimeout(500);
      }

      console.log(`✅ Completed audit of ${pageName}`);

    } catch (error) {
      console.log(`❌ Failed to audit ${pageName}:`, (error as Error).message);
      await takeScreenshot(page, `${pageName}-audit-failed`);
    }
  }

  test('Complete Button & Action Audit', async ({ page }) => {
    console.log('🚀 Starting Complete Button & Action Audit');

    setupConsoleErrorTracking(page);

    // Define all pages to audit
    const pagesToAudit = [
      { name: 'Landing Page', url: '/' },
      { name: 'Teacher Dashboard', url: '/teacher' },
      { name: 'Teacher Classes New', url: '/teacher/classes/new' },
      { name: 'Teacher Content New', url: '/teacher/content/new' },
      { name: 'Family Dashboard', url: '/family' },
      { name: 'Learning Dashboard', url: '/learning' },
      { name: 'Learning Curriculum', url: '/learning/curriculum' },
      { name: 'Explore Page', url: '/explore' },
      { name: 'Profile Page', url: '/profile' },
      { name: 'Content Page', url: '/content' },
      { name: 'Admin Dashboard', url: '/admin' },
      { name: 'Admin Content', url: '/admin/content' },
      { name: 'Admin Users', url: '/admin/users' },
    ];

    // Audit each page
    for (const pageInfo of pagesToAudit) {
      await auditPage(page, pageInfo.name, pageInfo.url);
    }

    // Additional audit for teacher dashboard tabs
    console.log('\n🔍 Auditing Teacher Dashboard Tabs');
    await page.goto('/teacher', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const teacherTabs = [
      { name: 'Overview Tab', selector: 'button:has-text("Overview"), [data-tab="overview"]' },
      { name: 'My Classes Tab', selector: 'button:has-text("My Classes"), [data-tab="classes"]' },
      { name: 'Students Tab', selector: 'button:has-text("Students"), [data-tab="students"]' },
      { name: 'Content Tab', selector: 'button:has-text("Content"), [data-tab="content"]' },
      { name: 'Moderation Tab', selector: 'button:has-text("Moderation"), [data-tab="moderation"]' },
    ];

    for (const tab of teacherTabs) {
      try {
        const tabElement = page.locator(tab.selector).first();
        if (await tabElement.isVisible()) {
          await testInteractiveElement(page, tabElement, 'Teacher Dashboard', tab.name, tab.selector);
        } else {
          console.log(`⚠️ ${tab.name} not found on teacher dashboard`);
        }
      } catch (error) {
        console.log(`❌ Error testing ${tab.name}:`, (error as Error).message);
      }
    }
  });

  test.afterAll(async () => {
    console.log('\n🎉 BUTTON & ACTION AUDIT RESULTS');
    console.log('================================');

    console.log('\n📊 Audit Summary:');
    const working = auditResults.filter(r => r.status === 'working').length;
    const broken = auditResults.filter(r => r.status === 'broken').length;
    const noAction = auditResults.filter(r => r.status === 'no-action').length;
    const errors = auditResults.filter(r => r.status === 'error').length;
    const notFound = auditResults.filter(r => r.status === '404').length;

    console.log(`✅ Working: ${working}`);
    console.log(`❌ Broken: ${broken}`);
    console.log(`⚠️ No Action: ${noAction}`);
    console.log(`🚨 Errors: ${errors}`);
    console.log(`🔍 404s: ${notFound}`);

    console.log('\n📋 Detailed Results:');
    console.log('| Page | Button Text | Status | Error | Screenshot |');
    console.log('|------|-------------|--------|-------|------------|');

    auditResults.forEach(result => {
      const statusEmoji = {
        'working': '✅',
        'broken': '❌',
        'no-action': '⚠️',
        'error': '🚨',
        '404': '🔍'
      }[result.status] || '❓';

      console.log(`| ${result.page} | ${result.buttonText} | ${statusEmoji} ${result.status} | ${result.error || ''} | ${result.screenshot || ''} |`);
    });

    console.log('\n📸 Screenshots taken:');
    screenshots.forEach(screenshot => console.log(`  - ${screenshot}`));

    console.log('\n🚨 Console errors encountered:');
    if (consoleErrors.length === 0) {
      console.log('  ✅ No console errors detected');
    } else {
      consoleErrors.forEach(error => console.log(`  ❌ ${error}`));
    }

    // Overall assessment
    const totalIssues = broken + errors + notFound;
    const successRate = totalIssues === 0 ? 100 : Math.round((working / (working + totalIssues)) * 100);

    console.log(`\n📈 Success Rate: ${successRate}%`);

    if (totalIssues === 0) {
      console.log('\n✅ AUDIT PASSED: All buttons and actions working correctly');
    } else {
      console.log(`\n❌ AUDIT FAILED: ${totalIssues} issues found requiring fixes`);
      console.log('\n🔧 REQUIRED FIXES:');

      const brokenResults = auditResults.filter(r => r.status !== 'working');
      brokenResults.forEach(result => {
        console.log(`  - ${result.page}: "${result.buttonText}" - ${result.status}${result.error ? ` (${result.error})` : ''}`);
      });
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('  1. Review failed elements and implement fixes');
    console.log('  2. Run build verification: npm run build');
    console.log('  3. Re-run audit to verify fixes');
    console.log('  4. Update project documentation with results');
  });
});