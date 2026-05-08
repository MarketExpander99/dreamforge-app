# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: complete-user-journey.spec.ts >> Complete User Journey Test - Skill Gain Application >> Student Journey >> Complete student user journey
- Location: tests\complete-user-journey.spec.ts:530:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
```

# Test source

```ts
  564 |         await takeScreenshot(page, 'student-explore-page');
  565 |         console.log('✅ Explore page loaded successfully');
  566 |       } catch (error) {
  567 |         console.log('⚠️ Explore page load issue, continuing with limited testing...');
  568 |         // Take screenshot anyway for debugging
  569 |         await takeScreenshot(page, 'student-explore-page-failed');
  570 |       }
  571 | 
  572 |       // Check for content categories
  573 |       const categories = page.locator('[data-testid="category"], .category, button[class*="category"]');
  574 |       const categoryCount = await categories.count();
  575 |       console.log(`📂 Found ${categoryCount} content categories`);
  576 | 
  577 |       // Step 4: Join class using teacher's class code
  578 |       console.log('🎫 Step 4: Joining class with code');
  579 |       if (teacherClassCode) {
  580 |         await page.goto(`/join/${teacherClassCode}`);
  581 |         await page.waitForLoadState('networkidle');
  582 |         await page.waitForTimeout(2000);
  583 |         await takeScreenshot(page, 'student-join-class');
  584 | 
  585 |         // Confirm joining
  586 |         const joinButton = page.locator('button:has-text("Join Class"), button[type="submit"]').first();
  587 |         if (await joinButton.isVisible()) {
  588 |           await joinButton.click();
  589 |           await page.waitForTimeout(3000);
  590 |           await takeScreenshot(page, 'student-class-joined');
  591 |         }
  592 |       } else {
  593 |         console.log('⚠️ No class code available from teacher journey');
  594 |       }
  595 | 
  596 |       // Verify database state
  597 |       await verifyDatabaseState('student-enrollment');
  598 | 
  599 |       // Step 5: View enrolled class and progress
  600 |       console.log('📊 Step 5: Viewing enrolled class and progress');
  601 |       await page.goto('/learning');
  602 |       await page.waitForLoadState('networkidle');
  603 |       await page.waitForTimeout(2000);
  604 |       await takeScreenshot(page, 'student-my-learning');
  605 | 
  606 |       // Check for enrolled classes
  607 |       const enrolledClasses = page.locator('[data-testid="enrolled-class"], .enrolled-class');
  608 |       const enrolledCount = await enrolledClasses.count();
  609 |       console.log(`📚 Found ${enrolledCount} enrolled classes`);
  610 | 
  611 |       // Step 6: Complete a lesson
  612 |       console.log('📖 Step 6: Completing a lesson');
  613 |       // Look for lesson links
  614 |       const lessonLinks = page.locator('a:has-text("Lesson"), [href*="lesson"]');
  615 |       if (await lessonLinks.first().isVisible()) {
  616 |         await lessonLinks.first().click();
  617 |         await page.waitForLoadState('networkidle');
  618 |         await page.waitForTimeout(2000);
  619 |         await takeScreenshot(page, 'student-lesson-view');
  620 | 
  621 |         // Try to mark as complete
  622 |         const completeButton = page.locator('button:has-text("Complete"), button:has-text("Mark Complete")').first();
  623 |         if (await completeButton.isVisible()) {
  624 |           await completeButton.click();
  625 |           await page.waitForTimeout(2000);
  626 |           await takeScreenshot(page, 'student-lesson-completed');
  627 |         }
  628 |       }
  629 | 
  630 |       // Step 7: Test navigation links
  631 |       console.log('🧭 Testing student navigation links');
  632 | 
  633 |       // Main navigation - using button selectors since navigation uses Button components
  634 |       const studentNavLinks = [
  635 |         { selector: 'button:has-text("Home")', name: 'Home' },
  636 |         { selector: 'button:has-text("Explore")', name: 'Explore' },
  637 |         { selector: 'button:has-text("My Learning")', name: 'My Learning' },
  638 |         { selector: 'button:has-text("Curriculum")', name: 'Curriculum' },
  639 |         { selector: 'button:has-text("Profile")', name: 'Profile' },
  640 |       ];
  641 | 
  642 |       for (const link of studentNavLinks) {
  643 |         const element = page.locator(link.selector).first();
  644 |         if (await element.isVisible()) {
  645 |           console.log(`✅ ${link.name} link found`);
  646 |         } else {
  647 |           console.log(`❌ ${link.name} link not found`);
  648 |         }
  649 |       }
  650 | 
  651 |       // Step 8: Check for broken links
  652 |       const studentBrokenLinks = await checkAllLinks(page);
  653 |       if (studentBrokenLinks.length > 0) {
  654 |         console.log(`❌ Found ${studentBrokenLinks.length} broken links:`, studentBrokenLinks);
  655 |       } else {
  656 |         console.log('✅ No broken links found');
  657 |       }
  658 | 
  659 |       // Step 9: Logout
  660 |       console.log('🚪 Logging out student');
  661 |       const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
  662 |       if (await logoutButton.isVisible()) {
  663 |         await logoutButton.click();
> 664 |         await page.waitForTimeout(2000);
      |                    ^ Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
  665 |         await takeScreenshot(page, 'student-logout-complete');
  666 |       }
  667 | 
  668 |       console.log('✅ Student journey completed');
  669 |     });
  670 |   });
  671 | 
  672 |   test.afterAll(async () => {
  673 |     console.log('\n🎉 COMPLETE USER JOURNEY TEST RESULTS');
  674 |     console.log('=====================================');
  675 | 
  676 |     console.log('\n📸 Screenshots taken:');
  677 |     screenshots.forEach(screenshot => console.log(`  - ${screenshot}`));
  678 | 
  679 |     console.log('\n🚨 Console errors encountered:');
  680 |     if (consoleErrors.length === 0) {
  681 |       console.log('  ✅ No console errors detected');
  682 |     } else {
  683 |       consoleErrors.forEach(error => console.log(`  ❌ ${error}`));
  684 |     }
  685 | 
  686 |     console.log('\n🔗 Link verification:');
  687 |     console.log('  - Checked all visible links on major pages');
  688 |     console.log('  - Results logged in individual journey tests');
  689 | 
  690 |     console.log('\n💾 Database verification:');
  691 |     console.log('  - Teacher onboarding status checked');
  692 |     console.log('  - Class creation verified');
  693 |     console.log('  - Student enrollment confirmed');
  694 |     console.log('  - Content creation validated');
  695 | 
  696 |     console.log('\n📱 Accessibility checks:');
  697 |     console.log('  - ARIA labels presence verified (basic check)');
  698 |     console.log('  - Keyboard navigation tested (basic check)');
  699 | 
  700 |     // Overall assessment
  701 |     const hasErrors = consoleErrors.length > 0;
  702 |     const hasScreenshots = screenshots.length >= 10; // Expecting at least 10 screenshots
  703 | 
  704 |     if (!hasErrors && hasScreenshots) {
  705 |       console.log('\n✅ OVERALL PASS: Both user journeys completed successfully');
  706 |     } else {
  707 |       console.log('\n❌ OVERALL FAIL: Issues detected during testing');
  708 |       if (hasErrors) console.log('  - Console errors present');
  709 |       if (!hasScreenshots) console.log('  - Insufficient screenshots captured');
  710 |     }
  711 | 
  712 |     console.log('\n📋 RECOMMENDATIONS:');
  713 |     if (consoleErrors.length > 0) {
  714 |       console.log('  - Review and fix console errors for better stability');
  715 |     }
  716 |     console.log('  - Consider adding more comprehensive accessibility testing');
  717 |     console.log('  - Implement automated link checking in CI/CD pipeline');
  718 |     console.log('  - Add performance monitoring for page load times');
  719 |   });
  720 | });
```