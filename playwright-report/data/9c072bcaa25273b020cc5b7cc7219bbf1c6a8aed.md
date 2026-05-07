# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: complete-user-journey.spec.ts >> Complete User Journey Test - Skill Gain Application >> Student Journey >> Complete student user journey
- Location: tests\complete-user-journey.spec.ts:418:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
```

# Test source

```ts
  452 |         await takeScreenshot(page, 'student-explore-page');
  453 |         console.log('✅ Explore page loaded successfully');
  454 |       } catch (error) {
  455 |         console.log('⚠️ Explore page load issue, continuing with limited testing...');
  456 |         // Take screenshot anyway for debugging
  457 |         await takeScreenshot(page, 'student-explore-page-failed');
  458 |       }
  459 | 
  460 |       // Check for content categories
  461 |       const categories = page.locator('[data-testid="category"], .category, button[class*="category"]');
  462 |       const categoryCount = await categories.count();
  463 |       console.log(`📂 Found ${categoryCount} content categories`);
  464 | 
  465 |       // Step 4: Join class using teacher's class code
  466 |       console.log('🎫 Step 4: Joining class with code');
  467 |       if (teacherClassCode) {
  468 |         await page.goto(`/join/${teacherClassCode}`);
  469 |         await page.waitForLoadState('networkidle');
  470 |         await page.waitForTimeout(2000);
  471 |         await takeScreenshot(page, 'student-join-class');
  472 | 
  473 |         // Confirm joining
  474 |         const joinButton = page.locator('button:has-text("Join Class"), button[type="submit"]').first();
  475 |         if (await joinButton.isVisible()) {
  476 |           await joinButton.click();
  477 |           await page.waitForTimeout(3000);
  478 |           await takeScreenshot(page, 'student-class-joined');
  479 |         }
  480 |       } else {
  481 |         console.log('⚠️ No class code available from teacher journey');
  482 |       }
  483 | 
  484 |       // Verify database state
  485 |       await verifyDatabaseState('student-enrollment');
  486 | 
  487 |       // Step 5: View enrolled class and progress
  488 |       console.log('📊 Step 5: Viewing enrolled class and progress');
  489 |       await page.goto('/learning');
  490 |       await page.waitForLoadState('networkidle');
  491 |       await page.waitForTimeout(2000);
  492 |       await takeScreenshot(page, 'student-my-learning');
  493 | 
  494 |       // Check for enrolled classes
  495 |       const enrolledClasses = page.locator('[data-testid="enrolled-class"], .enrolled-class');
  496 |       const enrolledCount = await enrolledClasses.count();
  497 |       console.log(`📚 Found ${enrolledCount} enrolled classes`);
  498 | 
  499 |       // Step 6: Complete a lesson
  500 |       console.log('📖 Step 6: Completing a lesson');
  501 |       // Look for lesson links
  502 |       const lessonLinks = page.locator('a:has-text("Lesson"), [href*="lesson"]');
  503 |       if (await lessonLinks.first().isVisible()) {
  504 |         await lessonLinks.first().click();
  505 |         await page.waitForLoadState('networkidle');
  506 |         await page.waitForTimeout(2000);
  507 |         await takeScreenshot(page, 'student-lesson-view');
  508 | 
  509 |         // Try to mark as complete
  510 |         const completeButton = page.locator('button:has-text("Complete"), button:has-text("Mark Complete")').first();
  511 |         if (await completeButton.isVisible()) {
  512 |           await completeButton.click();
  513 |           await page.waitForTimeout(2000);
  514 |           await takeScreenshot(page, 'student-lesson-completed');
  515 |         }
  516 |       }
  517 | 
  518 |       // Step 7: Test navigation links
  519 |       console.log('🧭 Testing student navigation links');
  520 | 
  521 |       // Main navigation
  522 |       const studentNavLinks = [
  523 |         { selector: 'a:has-text("Home"), [href="/"]', name: 'Home' },
  524 |         { selector: 'a:has-text("Explore"), [href*="explore"]', name: 'Explore' },
  525 |         { selector: 'a:has-text("My Learning"), [href*="learning"]', name: 'My Learning' },
  526 |         { selector: 'a:has-text("Curriculum"), [href*="curriculum"]', name: 'Curriculum' },
  527 |         { selector: 'a:has-text("Profile"), [href*="profile"]', name: 'Profile' },
  528 |       ];
  529 | 
  530 |       for (const link of studentNavLinks) {
  531 |         const element = page.locator(link.selector).first();
  532 |         if (await element.isVisible()) {
  533 |           console.log(`✅ ${link.name} link found`);
  534 |         } else {
  535 |           console.log(`❌ ${link.name} link not found`);
  536 |         }
  537 |       }
  538 | 
  539 |       // Step 8: Check for broken links
  540 |       const studentBrokenLinks = await checkAllLinks(page);
  541 |       if (studentBrokenLinks.length > 0) {
  542 |         console.log(`❌ Found ${studentBrokenLinks.length} broken links:`, studentBrokenLinks);
  543 |       } else {
  544 |         console.log('✅ No broken links found');
  545 |       }
  546 | 
  547 |       // Step 9: Logout
  548 |       console.log('🚪 Logging out student');
  549 |       const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
  550 |       if (await logoutButton.isVisible()) {
  551 |         await logoutButton.click();
> 552 |         await page.waitForTimeout(2000);
      |                    ^ Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
  553 |         await takeScreenshot(page, 'student-logout-complete');
  554 |       }
  555 | 
  556 |       console.log('✅ Student journey completed');
  557 |     });
  558 |   });
  559 | 
  560 |   test.afterAll(async () => {
  561 |     console.log('\n🎉 COMPLETE USER JOURNEY TEST RESULTS');
  562 |     console.log('=====================================');
  563 | 
  564 |     console.log('\n📸 Screenshots taken:');
  565 |     screenshots.forEach(screenshot => console.log(`  - ${screenshot}`));
  566 | 
  567 |     console.log('\n🚨 Console errors encountered:');
  568 |     if (consoleErrors.length === 0) {
  569 |       console.log('  ✅ No console errors detected');
  570 |     } else {
  571 |       consoleErrors.forEach(error => console.log(`  ❌ ${error}`));
  572 |     }
  573 | 
  574 |     console.log('\n🔗 Link verification:');
  575 |     console.log('  - Checked all visible links on major pages');
  576 |     console.log('  - Results logged in individual journey tests');
  577 | 
  578 |     console.log('\n💾 Database verification:');
  579 |     console.log('  - Teacher onboarding status checked');
  580 |     console.log('  - Class creation verified');
  581 |     console.log('  - Student enrollment confirmed');
  582 |     console.log('  - Content creation validated');
  583 | 
  584 |     console.log('\n📱 Accessibility checks:');
  585 |     console.log('  - ARIA labels presence verified (basic check)');
  586 |     console.log('  - Keyboard navigation tested (basic check)');
  587 | 
  588 |     // Overall assessment
  589 |     const hasErrors = consoleErrors.length > 0;
  590 |     const hasScreenshots = screenshots.length >= 10; // Expecting at least 10 screenshots
  591 | 
  592 |     if (!hasErrors && hasScreenshots) {
  593 |       console.log('\n✅ OVERALL PASS: Both user journeys completed successfully');
  594 |     } else {
  595 |       console.log('\n❌ OVERALL FAIL: Issues detected during testing');
  596 |       if (hasErrors) console.log('  - Console errors present');
  597 |       if (!hasScreenshots) console.log('  - Insufficient screenshots captured');
  598 |     }
  599 | 
  600 |     console.log('\n📋 RECOMMENDATIONS:');
  601 |     if (consoleErrors.length > 0) {
  602 |       console.log('  - Review and fix console errors for better stability');
  603 |     }
  604 |     console.log('  - Consider adding more comprehensive accessibility testing');
  605 |     console.log('  - Implement automated link checking in CI/CD pipeline');
  606 |     console.log('  - Add performance monitoring for page load times');
  607 |   });
  608 | });
```