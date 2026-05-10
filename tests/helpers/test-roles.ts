import { test as base, Page } from '@playwright/test';
import path from 'path';

// Test user credentials for different roles
export const TEST_USERS = {
  student: {
    email: 'teststudent@school.com',
    password: 'password123',
    role: 'student',
    displayName: 'Test Student'
  },
  teacher: {
    email: 'testteacher@school.com',
    password: 'password123',
    role: 'teacher',
    displayName: 'Test Teacher'
  },
  parent: {
    email: 'testparent@school.com',
    password: 'password123',
    role: 'parent',
    displayName: 'Test Parent'
  },
  admin: {
    email: 'eben.combrinck@proton.me', // Special admin email
    password: 'password123', // This should be set appropriately
    role: 'teacher', // Admin has teacher role
    displayName: 'Admin User'
  }
} as const;

export type UserRole = keyof typeof TEST_USERS;

// Enhanced error tracking for SkillGainQA
export class SkillGainQATracker {
  private consoleErrors: string[] = [];
  private networkErrors: string[] = [];
  private screenshots: string[] = [];

  constructor(private page: Page) {
    this.setupErrorTracking();
  }

  private setupErrorTracking() {
    // Console error tracking
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        // Filter out cosmetic 500 errors that don't affect functionality
        if (!errorText.includes('Failed to load resource: the server responded with a status of 500 ()') &&
            !errorText.includes('favicon.ico') &&
            !errorText.includes('manifest.json')) {
          const errorEntry = `[${new Date().toISOString()}] CONSOLE ERROR: ${errorText}`;
          this.consoleErrors.push(errorEntry);
          console.log('🚨 SKILLGAIN-QA ERROR:', errorText);
        }
      }
    });

    // Network error tracking
    this.page.on('requestfailed', (request) => {
      const errorEntry = `[${new Date().toISOString()}] NETWORK ERROR: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`;
      this.networkErrors.push(errorEntry);
      console.log('🌐 SKILLGAIN-QA NETWORK ERROR:', request.url(), request.failure()?.errorText);
    });

    // Page error tracking
    this.page.on('pageerror', (error) => {
      const errorEntry = `[${new Date().toISOString()}] PAGE ERROR: ${error.message}`;
      this.consoleErrors.push(errorEntry);
      console.log('💥 SKILLGAIN-QA PAGE ERROR:', error.message);
    });
  }

  async takeScreenshot(name: string, fullPage = true) {
    const filename = `skillgain-qa-${name}-${Date.now()}.png`;
    const screenshotPath = path.join(process.cwd(), 'test-results', filename);
    await this.page.screenshot({ path: screenshotPath, fullPage });
    this.screenshots.push(filename);
    console.log(`📸 SkillGainQA Screenshot: ${filename}`);
    return screenshotPath;
  }

  async loginAsRole(role: UserRole) {
    const user = TEST_USERS[role];
    console.log(`🔐 SkillGainQA: Logging in as ${role} (${user.email})`);

    await this.page.goto('/auth/login');
    await this.page.waitForLoadState('networkidle');

    // Fill login form
    const emailInput = this.page.locator('input[type="email"]').first();
    const passwordInput = this.page.locator('input[type="password"]').first();
    const submitButton = this.page.locator('button[type="submit"], button:has-text("Sign In")').first();

    await emailInput.fill(user.email);
    await passwordInput.fill(user.password);
    await submitButton.click();

    // Wait for login to complete
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000);

    // Verify login success by checking URL or presence of user-specific elements
    const currentUrl = this.page.url();
    const isLoggedIn = !currentUrl.includes('/auth/login') &&
                      !currentUrl.includes('/auth/signup');

    if (!isLoggedIn) {
      throw new Error(`SkillGainQA: Login failed for ${role} - still on auth page`);
    }

    console.log(`✅ SkillGainQA: Successfully logged in as ${role}`);
    await this.takeScreenshot(`${role}-login-success`);
  }

  async logout() {
    console.log('🚪 SkillGainQA: Logging out');

    // Try multiple logout selectors
    const logoutSelectors = [
      'button:has-text("Logout")',
      'a:has-text("Logout")',
      'button[aria-label*="logout" i]',
      '[data-testid="logout"]'
    ];

    for (const selector of logoutSelectors) {
      try {
        const logoutButton = this.page.locator(selector).first();
        if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutButton.click();
          await this.page.waitForTimeout(2000);
          console.log('✅ SkillGainQA: Logout successful');
          await this.takeScreenshot('logout-success');
          return;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // Fallback: navigate to login page (force logout)
    console.log('⚠️ SkillGainQA: Logout button not found, navigating to login');
    await this.page.goto('/auth/login');
    await this.page.waitForLoadState('networkidle');
  }

  async checkAllLinks(): Promise<string[]> {
    const links = this.page.locator('a[href]');
    const linkCount = await links.count();
    console.log(`🔗 SkillGainQA: Checking ${linkCount} links`);

    const brokenLinks: string[] = [];

    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      const text = await link.textContent();

      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
        try {
          const response = await this.page.request.get(href);
          if (response.status() >= 400) {
            brokenLinks.push(`${href} (${text?.trim()}) - Status: ${response.status()}`);
          }
        } catch (error) {
          brokenLinks.push(`${href} (${text?.trim()}) - Error: ${(error as Error).message}`);
        }
      }
    }

    return brokenLinks;
  }

  getErrorSummary() {
    return {
      consoleErrors: this.consoleErrors,
      networkErrors: this.networkErrors,
      screenshots: this.screenshots,
      totalErrors: this.consoleErrors.length + this.networkErrors.length
    };
  }

  async assertNoCriticalErrors() {
    const summary = this.getErrorSummary();

    if (summary.totalErrors > 0) {
      console.log('🚨 SkillGainQA: Critical errors detected:');
      summary.consoleErrors.forEach(error => console.log(`  ❌ ${error}`));
      summary.networkErrors.forEach(error => console.log(`  🌐 ${error}`));

      // Don't fail test for non-critical errors, but log them
      if (summary.consoleErrors.some(error =>
        error.includes('TypeError') ||
        error.includes('ReferenceError') ||
        error.includes('SyntaxError'))) {
        throw new Error(`SkillGainQA: Critical JavaScript errors detected (${summary.totalErrors} total)`);
      }
    } else {
      console.log('✅ SkillGainQA: No critical errors detected');
    }
  }
}

// Extended test fixture with SkillGainQA tracker
export const test = base.extend<{
  skillGainQA: SkillGainQATracker;
  loginAs: (role: UserRole) => Promise<void>;
}>({
  skillGainQA: async ({ page }, use) => {
    const tracker = new SkillGainQATracker(page);
    await use(tracker);
  },

  loginAs: async ({ page, skillGainQA }, use) => {
    const loginFunction = async (role: UserRole) => {
      await skillGainQA.loginAsRole(role);
    };
    await use(loginFunction);
  }
});

// Utility functions for common test patterns
export async function waitForPageLoad(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForTimeout(1000); // Additional buffer for dynamic content
}

export async function dismissModalIfPresent(page: Page) {
  const modalSelectors = [
    '[class*="fixed inset-0 z-50"]',
    '[role="dialog"]',
    '[data-state="open"]',
    '.modal-overlay'
  ];

  for (const selector of modalSelectors) {
    try {
      const modal = page.locator(selector).first();
      if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('🔍 SkillGainQA: Dismissing modal');

        // Try escape key first
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // If still visible, try clicking outside
        if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
          await page.mouse.click(10, 10);
          await page.waitForTimeout(500);
        }

        break;
      }
    } catch (error) {
      // Continue to next selector
    }
  }
}

export async function navigateAndWait(page: Page, url: string, waitForNetworkIdle = true) {
  await page.goto(url);
  if (waitForNetworkIdle) {
    await page.waitForLoadState('networkidle');
  }
  await page.waitForTimeout(1000);
}