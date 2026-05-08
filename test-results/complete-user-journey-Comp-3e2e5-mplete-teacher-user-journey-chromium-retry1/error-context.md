# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: complete-user-journey.spec.ts >> Complete User Journey Test - Skill Gain Application >> Teacher Journey >> Complete teacher user journey
- Location: tests\complete-user-journey.spec.ts:86:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
```

# Test source

```ts
  171 |         if (await step3Next.isVisible()) {
  172 |           await step3Next.click();
  173 |           await page.waitForTimeout(1500);
  174 |         }
  175 | 
  176 |         // Step 4: Complete onboarding
  177 |         const skipButton = page.locator('button:has-text("Skip Tour")').first();
  178 |         if (await skipButton.isVisible()) {
  179 |           await skipButton.click();
  180 |           await page.waitForTimeout(3000);
  181 |         }
  182 | 
  183 |         // Verify onboarding completion
  184 |         const modalStillVisible = await page.locator('[class*="fixed inset-0 z-50"]').isVisible();
  185 |         if (!modalStillVisible) {
  186 |           console.log('✅ Onboarding completed successfully');
  187 |           await takeScreenshot(page, 'teacher-onboarding-complete');
  188 |         } else {
  189 |           console.log('❌ Onboarding modal still visible');
  190 |           await takeScreenshot(page, 'teacher-onboarding-failed');
  191 |         }
  192 | 
  193 |         // Verify database state
  194 |         await verifyDatabaseState('teacher-onboarding');
  195 | 
  196 |       } else {
  197 |         console.log('ℹ️ Onboarding not triggered - teacher may already be onboarded');
  198 |       }
  199 | 
  200 |       // Step 4: Navigate to teacher dashboard
  201 |       await page.goto('/teacher');
  202 |       await page.waitForLoadState('networkidle');
  203 |       await page.waitForTimeout(3000); // Increased wait time
  204 | 
  205 |       // Try to dismiss any modal that might be blocking interaction
  206 |       const modalDismissButton = page.locator('button:has-text("Skip"), button:has-text("Close"), button:has-text("Continue"), button[aria-label="Close"]').first();
  207 |       if (await modalDismissButton.isVisible({ timeout: 2000 }).catch(() => false)) {
  208 |         console.log('Found modal dismiss button, clicking...');
  209 |         await modalDismissButton.click();
  210 |         await page.waitForTimeout(1000);
  211 |       }
  212 | 
  213 |       // Check for any overlaying modal and try to close it
  214 |       const modalOverlay = page.locator('[class*="fixed inset-0 z-50"], [role="dialog"], [data-state="open"]').first();
  215 |       if (await modalOverlay.isVisible({ timeout: 2000 }).catch(() => false)) {
  216 |         console.log('Found modal overlay, attempting to close...');
  217 |         // Try clicking escape key
  218 |         await page.keyboard.press('Escape');
  219 |         await page.waitForTimeout(1000);
  220 | 
  221 |         // If still visible, try clicking outside the modal
  222 |         if (await modalOverlay.isVisible({ timeout: 1000 }).catch(() => false)) {
  223 |           await page.mouse.click(10, 10); // Click in top-left corner
  224 |           await page.waitForTimeout(1000);
  225 |         }
  226 |       }
  227 | 
  228 |       await takeScreenshot(page, 'teacher-dashboard-overview');
  229 | 
  230 |       // Step 5: Test all 5 dashboard tabs
  231 |       console.log('📊 Testing all dashboard tabs');
  232 | 
  233 |       // Overview tab (default)
  234 |       await takeScreenshot(page, 'teacher-dashboard-overview-tab');
  235 | 
  236 |       // My Classes tab
  237 |       const classesTab = page.locator('button:has-text("My Classes"), [data-tab="classes"]');
  238 |       if (await classesTab.isVisible()) {
  239 |         await classesTab.click();
  240 |         await page.waitForTimeout(1000);
  241 |         await takeScreenshot(page, 'teacher-dashboard-classes-tab');
  242 |       }
  243 | 
  244 |       // Students tab
  245 |       const studentsTab = page.locator('button:has-text("Students"), [data-tab="students"]');
  246 |       if (await studentsTab.isVisible()) {
  247 |         await studentsTab.click();
  248 |         await page.waitForTimeout(1000);
  249 |         await takeScreenshot(page, 'teacher-dashboard-students-tab');
  250 |       }
  251 | 
  252 |       // Content tab
  253 |       const contentTab = page.locator('button:has-text("Content"), [data-tab="content"]');
  254 |       if (await contentTab.isVisible()) {
  255 |         await contentTab.click();
  256 |         await page.waitForTimeout(1000);
  257 |         await takeScreenshot(page, 'teacher-dashboard-content-tab');
  258 |       }
  259 | 
  260 |       // Moderation tab
  261 |       const moderationTab = page.locator('button:has-text("Moderation"), [data-tab="moderation"]');
  262 |       if (await moderationTab.isVisible()) {
  263 |         await moderationTab.click();
  264 |         await page.waitForTimeout(1000);
  265 |         await takeScreenshot(page, 'teacher-dashboard-moderation-tab');
  266 |       }
  267 | 
  268 |       // Step 6: Create new class
  269 |       console.log('🏫 Creating new class');
  270 |       await page.goto('/teacher/classes/new');
> 271 |       await page.waitForLoadState('networkidle');
      |                  ^ Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
  272 |       await takeScreenshot(page, 'teacher-create-class-form');
  273 | 
  274 |       // Fill class creation form
  275 |       const classTitleInput = page.locator('input[name*="title"], input[placeholder*="title"]').first();
  276 |       const classDescriptionInput = page.locator('textarea[name*="description"], textarea[placeholder*="description"]').first();
  277 |       const classSubjectSelect = page.locator('select[name*="subject"]').first();
  278 |       const classGradeSelect = page.locator('select[name*="grade"]').first();
  279 | 
  280 |       if (await classTitleInput.isVisible()) {
  281 |         await classTitleInput.fill('Advanced Calculus');
  282 |       }
  283 |       if (await classDescriptionInput.isVisible()) {
  284 |         await classDescriptionInput.fill('Advanced mathematics course covering calculus concepts');
  285 |       }
  286 |       if (await classSubjectSelect.isVisible()) {
  287 |         await classSubjectSelect.selectOption('Mathematics');
  288 |       }
  289 |       if (await classGradeSelect.isVisible()) {
  290 |         await classGradeSelect.selectOption('grade-12');
  291 |       }
  292 | 
  293 |       // Submit class creation
  294 |       const createClassButton = page.locator('button[type="submit"], button:has-text("Create Class")').first();
  295 |       if (await createClassButton.isVisible()) {
  296 |         await createClassButton.click();
  297 |         await page.waitForTimeout(3000);
  298 |         await takeScreenshot(page, 'teacher-class-created');
  299 | 
  300 |         // Extract class code for student journey
  301 |         const classCodeElement = page.locator('[data-testid="class-code"], .class-code').first();
  302 |         if (await classCodeElement.isVisible()) {
  303 |           const code = await classCodeElement.textContent();
  304 |           if (code && code.match(/^[A-Z0-9]{6}$/)) {
  305 |             teacherClassCode = code;
  306 |           }
  307 |         }
  308 |       }
  309 | 
  310 |       // Verify database state
  311 |       await verifyDatabaseState('class-creation');
  312 | 
  313 |       // Step 7: Create new content
  314 |       console.log('📝 Creating new content');
  315 |       // Navigate to content creation (assuming there's a create content button/link)
  316 |       const createContentButton = page.locator('button:has-text("Create Content"), a:has-text("Create Content")').first();
  317 |       if (await createContentButton.isVisible()) {
  318 |         await createContentButton.click();
  319 |         await page.waitForTimeout(1000);
  320 |       } else {
  321 |         // Try direct navigation
  322 |         await page.goto('/teacher/content/new');
  323 |       }
  324 | 
  325 |       await page.waitForLoadState('networkidle');
  326 |       await takeScreenshot(page, 'teacher-create-content-form');
  327 | 
  328 |       // Fill content creation form
  329 |       const contentTitleInput2 = page.locator('input[name*="title"], input[placeholder*="title"]').first();
  330 |       const contentTypeSelect = page.locator('select[name*="type"]').first();
  331 |       const contentBodyTextarea = page.locator('textarea[name*="content"], textarea[name*="body"]').first();
  332 | 
  333 |       if (await contentTitleInput2.isVisible()) {
  334 |         await contentTitleInput2.fill('Limits and Continuity');
  335 |       }
  336 |       if (await contentTypeSelect.isVisible()) {
  337 |         await contentTypeSelect.selectOption('lesson');
  338 |       }
  339 |       if (await contentBodyTextarea.isVisible()) {
  340 |         await contentBodyTextarea.fill('Understanding limits and continuity in calculus...');
  341 |       }
  342 | 
  343 |       // Submit content creation
  344 |       const createContentSubmitButton = page.locator('button[type="submit"], button:has-text("Create")').first();
  345 |       if (await createContentSubmitButton.isVisible()) {
  346 |         await createContentSubmitButton.click();
  347 |         await page.waitForTimeout(2000);
  348 |         await takeScreenshot(page, 'teacher-content-created');
  349 |       }
  350 | 
  351 |       // Verify database state
  352 |       await verifyDatabaseState('content-creation');
  353 | 
  354 |       // Step 8: Test navigation links
  355 |       console.log('🧭 Testing navigation links');
  356 | 
  357 |       // Ensure we're on the teacher dashboard for tab checking
  358 |       await page.goto('/teacher');
  359 |       await page.waitForLoadState('networkidle');
  360 |       await page.waitForTimeout(2000);
  361 | 
  362 |       // For teacher dashboard, check tab navigation instead of sidebar
  363 |       const teacherTabs = [
  364 |         { selector: 'button:has-text("Overview"), [data-tab="overview"]', name: 'Overview' },
  365 |         { selector: 'button:has-text("My Classes"), [data-tab="classes"]', name: 'My Classes' },
  366 |         { selector: 'button:has-text("Students"), [data-tab="students"]', name: 'Students' },
  367 |         { selector: 'button:has-text("Content"), [data-tab="content"]', name: 'Content' },
  368 |         { selector: 'button:has-text("Moderation"), [data-tab="moderation"]', name: 'Moderation' },
  369 |       ];
  370 | 
  371 |       for (const tab of teacherTabs) {
```