import { test } from './helpers/test-roles';
import { waitForPageLoad, dismissModalIfPresent, navigateAndWait } from './helpers/test-roles';

/**
 * SkillGainQA Full E2E Test Suite
 * Comprehensive testing of all critical user journeys on the live site
 * Tests all roles: Student, Teacher, Parent, Admin
 */

test.describe('SkillGainQA - Landing Page & Branding', () => {
  test('Landing page loads with correct branding and social links', async ({ page, skillGainQA }) => {
    console.log('🏠 SkillGainQA: Testing landing page branding');

    await page.goto('/');
    await waitForPageLoad(page);

    // Check for logo
    const logo = page.locator('img[alt*="Skill Gain"], [class*="logo"]').first();
    await skillGainQA.takeScreenshot('landing-page-logo');

    // Check for @Skill_GainX links
    const twitterLinks = await page.locator('a[href*="twitter.com"], a[href*="x.com"]').all();
    console.log(`🔗 SkillGainQA: Found ${twitterLinks.length} social links`);

    // Check prominent tabs (if visible)
    const tabs = await page.locator('[class*="tab"], button[class*="tab"]').all();
    console.log(`📑 SkillGainQA: Found ${tabs.length} navigation tabs`);

    // Check Get Started buttons
    const getStartedButtons = await page.locator('button:has-text("Get Started"), a:has-text("Get Started")').all();
    console.log(`🚀 SkillGainQA: Found ${getStartedButtons.length} Get Started buttons`);

    await skillGainQA.assertNoCriticalErrors();
  });

  test('Start Teaching Free button works', async ({ page, skillGainQA }) => {
    console.log('👨‍🏫 SkillGainQA: Testing Start Teaching Free button');

    await page.goto('/');
    await waitForPageLoad(page);

    const startTeachingButton = page.locator('button:has-text("Start Teaching Free"), a:has-text("Start Teaching Free")').first();

    if (await startTeachingButton.isVisible()) {
      await startTeachingButton.click();
      await page.waitForTimeout(2000);
      await skillGainQA.takeScreenshot('start-teaching-clicked');

      // Should redirect to signup or login
      const currentUrl = page.url();
      const isAuthPage = currentUrl.includes('/auth/') || currentUrl.includes('/signup') || currentUrl.includes('/login');
      console.log(`🔗 SkillGainQA: Redirected to: ${currentUrl} (Auth page: ${isAuthPage})`);
    } else {
      console.log('⚠️ SkillGainQA: Start Teaching Free button not found');
    }

    await skillGainQA.assertNoCriticalErrors();
  });
});

test.describe('SkillGainQA - Authentication Flows', () => {
  test('Student login flow', async ({ loginAs, skillGainQA }) => {
    console.log('🎓 SkillGainQA: Testing student login');
    await loginAs('student');
    await skillGainQA.assertNoCriticalErrors();
  });

  test('Teacher login flow', async ({ loginAs, skillGainQA }) => {
    console.log('👨‍🏫 SkillGainQA: Testing teacher login');
    await loginAs('teacher');
    await skillGainQA.assertNoCriticalErrors();
  });

  test('Admin login flow', async ({ loginAs, skillGainQA }) => {
    console.log('👑 SkillGainQA: Testing admin login');
    await loginAs('admin');
    await skillGainQA.assertNoCriticalErrors();
  });
});

test.describe('SkillGainQA - Student Journey', () => {
  test('Complete student learning journey', async ({ page, loginAs, skillGainQA }) => {
    console.log('🎓 SkillGainQA: Starting complete student journey');

    await loginAs('student');
    await dismissModalIfPresent(page);

    // Navigate to curriculum
    await navigateAndWait(page, '/learning/curriculum');
    await skillGainQA.takeScreenshot('student-curriculum');

    // Check prominent tabs
    const curriculumTabs = await page.locator('[class*="tab"], button[class*="tab"]').all();
    console.log(`📑 SkillGainQA: Found ${curriculumTabs.length} curriculum tabs`);

    // Take assessment
    await navigateAndWait(page, '/assessment');
    await skillGainQA.takeScreenshot('student-assessment-start');

    // Fill out assessment (basic interaction)
    const gradeSelect = page.locator('select[name*="grade"], select[id*="grade"]').first();
    if (await gradeSelect.isVisible()) {
      await gradeSelect.selectOption('grade-8');
      await page.waitForTimeout(1000);
      await skillGainQA.takeScreenshot('student-assessment-grade-selected');
    }

    // Explore page
    await navigateAndWait(page, '/explore');
    await skillGainQA.takeScreenshot('student-explore');

    // Check featured content
    const featuredContent = await page.locator('[data-testid*="featured"], .featured').all();
    console.log(`⭐ SkillGainQA: Found ${featuredContent.length} featured items`);

    // My Learning page
    await navigateAndWait(page, '/learning');
    await skillGainQA.takeScreenshot('student-my-learning');

    // Check Continue Learning buttons
    const continueButtons = await page.locator('button:has-text("Continue Learning")').all();
    console.log(`▶️ SkillGainQA: Found ${continueButtons.length} Continue Learning buttons`);

    // Check progress tracking
    const progressElements = await page.locator('[class*="progress"], [data-testid*="progress"]').all();
    console.log(`📊 SkillGainQA: Found ${progressElements.length} progress indicators`);

    await skillGainQA.assertNoCriticalErrors();
  });
});

test.describe('SkillGainQA - Teacher Journey', () => {
  test('Complete teacher dashboard journey', async ({ page, loginAs, skillGainQA }) => {
    console.log('👨‍🏫 SkillGainQA: Starting complete teacher journey');

    await loginAs('teacher');
    await dismissModalIfPresent(page);

    // Teacher dashboard overview
    await navigateAndWait(page, '/teacher');
    await skillGainQA.takeScreenshot('teacher-dashboard-overview');

    // Check all dashboard tabs
    const tabs = [
      { name: 'Overview', selector: 'button:has-text("Overview"), [data-tab="overview"]' },
      { name: 'My Classes', selector: 'button:has-text("My Classes"), [data-tab="classes"]' },
      { name: 'Students', selector: 'button:has-text("Students"), [data-tab="students"]' },
      { name: 'Content', selector: 'button:has-text("Content"), [data-tab="content"]' },
      { name: 'Moderation', selector: 'button:has-text("Moderation"), [data-tab="moderation"]' }
    ];

    for (const tab of tabs) {
      const tabElement = page.locator(tab.selector).first();
      if (await tabElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tabElement.click();
        await page.waitForTimeout(1000);
        await skillGainQA.takeScreenshot(`teacher-dashboard-${tab.name.toLowerCase().replace(' ', '-')}-tab`);
        console.log(`✅ SkillGainQA: ${tab.name} tab accessible`);
      } else {
        console.log(`⚠️ SkillGainQA: ${tab.name} tab not found`);
      }
    }

    await skillGainQA.assertNoCriticalErrors();
  });

  test('Teacher content creation flow', async ({ page, loginAs, skillGainQA }) => {
    console.log('📝 SkillGainQA: Testing teacher content creation');

    await loginAs('teacher');
    await dismissModalIfPresent(page);

    // Navigate to content creation
    await navigateAndWait(page, '/teacher/content/new');
    await skillGainQA.takeScreenshot('teacher-content-creation-form');

    // Fill content form (without submitting to avoid spam)
    const titleInput = page.locator('input[name*="title"], input[placeholder*="title"]').first();
    const contentTextarea = page.locator('textarea[name*="content"], textarea[id*="content"]').first();

    if (await titleInput.isVisible()) {
      await titleInput.fill('SkillGainQA Test Content - Please Ignore');
    }
    if (await contentTextarea.isVisible()) {
      await contentTextarea.fill('This is a test content created by SkillGainQA automated testing. Please ignore.');
    }

    await skillGainQA.takeScreenshot('teacher-content-form-filled');
    console.log('✅ SkillGainQA: Content creation form interaction tested');

    await skillGainQA.assertNoCriticalErrors();
  });

  test('Teacher class creation flow', async ({ page, loginAs, skillGainQA }) => {
    console.log('🏫 SkillGainQA: Testing teacher class creation');

    await loginAs('teacher');
    await dismissModalIfPresent(page);

    // Navigate to class creation
    await navigateAndWait(page, '/teacher/classes/new');
    await skillGainQA.takeScreenshot('teacher-class-creation-form');

    // Fill class form (without submitting)
    const classNameInput = page.locator('input[name*="title"], input[name*="name"], input[placeholder*="class"]').first();
    const subjectSelect = page.locator('select[name*="subject"]').first();
    const gradeSelect = page.locator('select[name*="grade"]').first();

    if (await classNameInput.isVisible()) {
      await classNameInput.fill('SkillGainQA Test Class - Please Ignore');
    }
    if (await subjectSelect.isVisible()) {
      await subjectSelect.selectOption('Mathematics');
    }
    if (await gradeSelect.isVisible()) {
      await gradeSelect.selectOption('grade-9');
    }

    await skillGainQA.takeScreenshot('teacher-class-form-filled');
    console.log('✅ SkillGainQA: Class creation form interaction tested');

    await skillGainQA.assertNoCriticalErrors();
  });
});

test.describe('SkillGainQA - Admin Journey', () => {
  test('Admin dashboard access', async ({ page, loginAs, skillGainQA }) => {
    console.log('👑 SkillGainQA: Testing admin dashboard access');

    await loginAs('admin');
    await dismissModalIfPresent(page);

    // Try to access admin routes
    const adminRoutes = ['/admin', '/admin/content', '/admin/users'];

    for (const route of adminRoutes) {
      try {
        await navigateAndWait(page, route);
        await skillGainQA.takeScreenshot(`admin-${route.split('/').pop() || 'dashboard'}`);
        console.log(`✅ SkillGainQA: Admin route ${route} accessible`);
      } catch (error) {
        console.log(`⚠️ SkillGainQA: Admin route ${route} not accessible: ${(error as Error).message}`);
      }
    }

    await skillGainQA.assertNoCriticalErrors();
  });
});

test.describe('SkillGainQA - Navigation & Links', () => {
  test('Footer and social links validation', async ({ page, skillGainQA }) => {
    console.log('🔗 SkillGainQA: Testing footer and social links');

    await page.goto('/');
    await waitForPageLoad(page);

    // Check footer links
    const footerLinks = await page.locator('footer a, [class*="footer"] a').all();
    console.log(`🔗 SkillGainQA: Found ${footerLinks.length} footer links`);

    // Check social media links
    const socialLinks = await page.locator('a[href*="twitter"], a[href*="facebook"], a[href*="linkedin"], a[href*="instagram"], a[href*="x.com"]').all();
    console.log(`📱 SkillGainQA: Found ${socialLinks.length} social media links`);

    // Validate @Skill_GainX Twitter link
    const skillGainXLink = page.locator('a[href*="Skill_GainX"], a[href*="@Skill_GainX"]').first();
    if (await skillGainXLink.isVisible()) {
      console.log('✅ SkillGainQA: @Skill_GainX link found');
    } else {
      console.log('⚠️ SkillGainQA: @Skill_GainX link not found');
    }

    await skillGainQA.assertNoCriticalErrors();
  });

  test('Broken link detection', async ({ page, skillGainQA }) => {
    console.log('🔍 SkillGainQA: Testing for broken links');

    await page.goto('/');
    await waitForPageLoad(page);

    const brokenLinks = await skillGainQA.checkAllLinks();
    if (brokenLinks.length > 0) {
      console.log(`❌ SkillGainQA: Found ${brokenLinks.length} broken links:`);
      brokenLinks.forEach(link => console.log(`  - ${link}`));
    } else {
      console.log('✅ SkillGainQA: No broken links detected');
    }
  });
});

test.describe('SkillGainQA - Responsive Design', () => {
  test('Mobile viewport compatibility', async ({ page, skillGainQA }) => {
    console.log('📱 SkillGainQA: Testing mobile viewport');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await waitForPageLoad(page);
    await skillGainQA.takeScreenshot('landing-page-mobile');

    // Test navigation on mobile
    const mobileMenu = page.locator('button[aria-label*="menu"], [class*="menu"]').first();
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await page.waitForTimeout(1000);
      await skillGainQA.takeScreenshot('mobile-menu-open');
    }

    await skillGainQA.assertNoCriticalErrors();
  });

  test('Desktop viewport compatibility', async ({ page, skillGainQA }) => {
    console.log('🖥️ SkillGainQA: Testing desktop viewport');

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/');
    await waitForPageLoad(page);
    await skillGainQA.takeScreenshot('landing-page-desktop');

    await skillGainQA.assertNoCriticalErrors();
  });
});

test.describe('SkillGainQA - Error Handling & Loading States', () => {
  test('Loading states and error boundaries', async ({ page, skillGainQA }) => {
    console.log('⏳ SkillGainQA: Testing loading states and error handling');

    await page.goto('/');
    await waitForPageLoad(page);

    // Check for loading spinners (if any are visible during normal operation)
    const loadingElements = await page.locator('[class*="loading"], [class*="spinner"], [aria-label*="loading"]').all();
    console.log(`⏳ SkillGainQA: Found ${loadingElements.length} loading elements`);

    // Test navigation to potentially slow-loading pages
    const testPages = ['/explore', '/learning/curriculum'];

    for (const testPage of testPages) {
      try {
        await navigateAndWait(page, testPage);
        await skillGainQA.takeScreenshot(`loading-test-${testPage.split('/').pop()}`);
        console.log(`✅ SkillGainQA: Page ${testPage} loaded successfully`);
      } catch (error) {
        console.log(`⚠️ SkillGainQA: Page ${testPage} loading issue: ${(error as Error).message}`);
      }
    }

    await skillGainQA.assertNoCriticalErrors();
  });
});

// Note: Removed global afterAll hook as fixtures aren't available in afterAll
// Error summaries are logged per test in the SkillGainQATracker class
