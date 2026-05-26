import { chromium, FullConfig } from '@playwright/test';
import { TEST_USERS, UserRole } from './helpers/test-roles';
import path from 'path';

/**
 * SkillGainQA Global Setup
 * Authenticates all test users and saves their auth states for reuse
 * This runs once before all tests to avoid repeated logins
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 SkillGainQA Global Setup: Starting authentication for all roles');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: 'https://skill-gain.com',
    extraHTTPHeaders: {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br, identity',
      'Accept-Language': 'en-US,en;q=0.9,*;q=0.5',
      'User-Agent': 'Mozilla/5.0 (compatible; SkillGainQA/1.0)',
    },
  });

  const roles: UserRole[] = ['student', 'teacher', 'parent', 'admin'];

  for (const role of roles) {
    console.log(`🔐 SkillGainQA: Setting up auth state for ${role}`);

    try {
      const page = await context.newPage();

      // Navigate to login page
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      // Fill login form
      const user = TEST_USERS[role];
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();

      await emailInput.fill(user.email);
      await passwordInput.fill(user.password);
      await submitButton.click();

      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Verify login success
      const currentUrl = page.url();
      const isLoggedIn = !currentUrl.includes('/auth/login') &&
                        !currentUrl.includes('/auth/signup');

      if (!isLoggedIn) {
        console.log(`❌ SkillGainQA: Login failed for ${role} - still on auth page`);
        // Continue with other roles even if one fails
        await page.close();
        continue;
      }

      // Additional wait for any post-login redirects or setup
      await page.waitForTimeout(2000);

      // Save auth state
      const authStatePath = path.join(__dirname, 'auth-states', `${role}-auth.json`);
      await context.storageState({ path: authStatePath });

      console.log(`✅ SkillGainQA: Auth state saved for ${role} at ${authStatePath}`);

      await page.close();

    } catch (error) {
      console.log(`❌ SkillGainQA: Failed to setup auth for ${role}:`, (error as Error).message);
      // Continue with other roles
    }
  }

  await context.close();
  await browser.close();

  console.log('✅ SkillGainQA Global Setup: Authentication setup complete');
}

export default globalSetup;