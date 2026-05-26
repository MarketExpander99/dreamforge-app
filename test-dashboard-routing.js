// Simple test script to verify dashboard routing
const { chromium } = require('playwright');

async function testDashboardRouting() {
  console.log('🚀 Testing dashboard routing...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test 1: Visit root when not logged in - should show landing page
    console.log('📍 Test 1: Root route when not logged in');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const url1 = page.url();
    console.log(`Current URL: ${url1}`);

    // Should stay on landing page or show landing content
    const hasLandingContent = await page.locator('text=Join Skill Gain').isVisible() ||
                             await page.locator('text=Welcome Back').isVisible() ||
                             await page.locator('text=Start Teaching Free').isVisible();

    console.log(`Has landing content: ${hasLandingContent}`);

    // Test 2: Login as teacher
    console.log('📝 Test 2: Logging in as teacher');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');

    console.log('Filling login form...');
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();

    await emailInput.fill('testteacher@school.com');
    await passwordInput.fill('password123');

    console.log('Clicking submit button...');
    await submitButton.click();

    // Wait for form submission and potential redirect
    console.log('Waiting for form submission...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Give it more time

    const url2 = page.url();
    console.log(`URL after teacher login: ${url2}`);

    // Check if we're still on login page (login failed)
    if (url2.includes('/auth/login')) {
      console.log('❌ Still on login page - login may have failed');

      // Check for any error messages
      const errorText = await page.locator('.text-red-500, .text-destructive, [class*="error"]').first().textContent();
      if (errorText) {
        console.log('Error message found:', errorText);
      }

      // Try to manually trigger login via direct API call
      console.log('Trying direct API login...');
      await page.evaluate(async () => {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(
          'http://localhost:3000', // This might not work, but let's try
          'your-anon-key' // This won't work without proper keys
        );

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: 'testteacher@school.com',
            password: 'password123'
          });
          console.log('Direct API login result:', { success: !error, error: error?.message });
        } catch (e) {
          console.log('Direct API login failed:', e.message);
        }
      });

      await page.waitForTimeout(2000);
      const urlAfterApi = page.url();
      console.log(`URL after direct API login: ${urlAfterApi}`);
    }

    // Check if we ended up at teacher dashboard
    if (url2.includes('/teacher')) {
      console.log('✅ Successfully redirected to teacher dashboard');
    } else {
      console.log('❌ Did not redirect to teacher dashboard');

      // Try to manually navigate to teacher page to see if it works
      console.log('Trying manual navigation to /teacher...');
      await page.goto('http://localhost:3000/teacher');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const manualUrl = page.url();
      console.log(`Manual navigation result: ${manualUrl}`);

      if (manualUrl.includes('/teacher')) {
        console.log('✅ Teacher page loads directly');
      } else {
        console.log('❌ Teacher page also redirects away');
      }
    }

    // Check if login succeeded by looking for error messages
    const hasError = await page.locator('text=Invalid email or password').isVisible() ||
                    await page.locator('text=Login failed').isVisible() ||
                    await page.locator('text=Invalid login credentials').isVisible();

    console.log(`Login error detected: ${hasError}`);

    const isTeacherDashboard = url2.includes('/teacher');
    console.log(`Redirected to teacher dashboard: ${isTeacherDashboard}`);

    // If login failed, check what's on the page
    if (!isTeacherDashboard && !hasError) {
      const pageContent = await page.textContent('body');
      console.log('Page content after login attempt:', pageContent.substring(0, 500));
    }

    // Test 3: Visit root again while logged in - should redirect to dashboard
    console.log('📍 Test 3: Root route when logged in as teacher');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for redirect

    const url3 = page.url();
    console.log(`URL after visiting root while logged in: ${url3}`);

    const redirectedToDashboard = url3.includes('/teacher');
    console.log(`Redirected to dashboard: ${redirectedToDashboard}`);

    // Test 4: Logout and check root route
    console.log('📝 Test 4: Logging out');
    // Try to find logout button - this might vary based on the UI
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // Visit root again
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const url4 = page.url();
    console.log(`URL after logout: ${url4}`);

    const showsLandingPage = !url4.includes('/teacher') && !url4.includes('/learning') && !url4.includes('/family');
    console.log(`Shows landing page: ${showsLandingPage}`);

    // Results
    console.log('\n📊 TEST RESULTS:');
    console.log(`✅ Root shows landing when not logged in: ${hasLandingContent}`);
    console.log(`✅ Teacher login redirects to dashboard: ${isTeacherDashboard}`);
    console.log(`✅ Root redirects to dashboard when logged in: ${redirectedToDashboard}`);
    console.log(`✅ Root shows landing after logout: ${showsLandingPage}`);

    const allPassed = hasLandingContent && isTeacherDashboard && redirectedToDashboard && showsLandingPage;
    console.log(`\n🎉 OVERALL: ${allPassed ? 'PASSED' : 'FAILED'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testDashboardRouting();