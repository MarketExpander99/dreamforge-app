import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Enable parallel workers for better performance */
  workers: process.env.CI ? 1 : 2,
  /* Global timeout for long-running tests */
  globalTimeout: 900 * 1000, // 15 minutes for live site testing
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Global setup to authenticate all test users */
  globalSetup: require.resolve('./tests/global.setup.ts'),

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://skill-gain.com',

    /* Extra HTTP headers for all requests */
    extraHTTPHeaders: {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br, identity',
      'Accept-Language': 'en-US,en;q=0.9,*;q=0.5',
      'User-Agent': 'Mozilla/5.0 (compatible; SkillGainQA/1.0)',
    },

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for different user roles and browsers */
  projects: [
    // Student role tests
    {
      name: 'student-chromium',
      testMatch: '**/skillgain-qa-full-suite.spec.ts',
      grep: /Student Journey|Landing Page|Authentication|Navigation/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        storageState: path.join(__dirname, 'tests', 'auth-states', 'student-auth.json'),
      },
    },

    // Teacher role tests
    {
      name: 'teacher-chromium',
      testMatch: '**/skillgain-qa-full-suite.spec.ts',
      grep: /Teacher Journey|Landing Page|Authentication|Navigation/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        storageState: path.join(__dirname, 'tests', 'auth-states', 'teacher-auth.json'),
      },
    },

    // Admin role tests
    {
      name: 'admin-chromium',
      testMatch: '**/skillgain-qa-full-suite.spec.ts',
      grep: /Admin Journey|Landing Page|Authentication|Navigation/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        storageState: path.join(__dirname, 'tests', 'auth-states', 'admin-auth.json'),
      },
    },

    // Mobile responsiveness tests (no auth required)
    {
      name: 'mobile-chromium',
      testMatch: '**/skillgain-qa-full-suite.spec.ts',
      grep: /Responsive Design|Landing Page|Navigation/,
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
    },

    // Desktop responsiveness tests (no auth required)
    {
      name: 'desktop-chromium',
      testMatch: '**/skillgain-qa-full-suite.spec.ts',
      grep: /Responsive Design|Landing Page|Navigation/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Link validation tests (no auth required)
    {
      name: 'links-chromium',
      testMatch: '**/skillgain-qa-full-suite.spec.ts',
      grep: /Navigation.*Links|Error Handling/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  /* No local dev server needed for live site testing */
  // webServer: undefined,
});
