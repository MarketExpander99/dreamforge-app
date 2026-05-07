# 🎯 SKILL GAIN SPRINT 2 TESTING INSTRUCTIONS

## 📋 Pre-Testing Setup

### Database Setup
1. **Start with clean database** or run migration script:
   ```bash
   # Apply base schema first
   psql -h [db-host] -U postgres -d postgres -f supabase-schema.sql

   # Then apply Sprint 2 migration
   psql -h [db-host] -U postgres -d postgres -f scripts/sprint2-database-migration.sql

   # Seed content
   psql -h [db-host] -U postgres -d postgres -f scripts/caps-content-seeding.sql
   psql -h [db-host] -U postgres -d postgres -f scripts/sprint2-content-seeding.sql
   ```

2. **Environment Variables** - Ensure these are set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Optional
   RESEND_API_KEY=your_resend_key              # Optional for email testing
   ```

3. **Start the application**:
   ```bash
   npm install
   npm run dev
   ```

---

## 🧪 TESTING CHECKLIST

### ✅ **PHASE 1 FEATURES VERIFICATION** (Ensure no regressions)

#### Core User Flows
- [ ] **User Registration/Login** - Sign up as student, login works
- [ ] **Profile Creation** - User profile created with correct role
- [ ] **Content Browsing** - Can view learning content and categories
- [ ] **Progress Tracking** - Complete lessons, track progress
- [ ] **Offline Functionality** - App works without internet
- [ ] **PWA Features** - Install prompt, service worker, offline page

#### Mobile Experience
- [ ] **Responsive Design** - Works on mobile/tablet/desktop
- [ ] **Touch Interactions** - Swipe, tap, pinch gestures work
- [ ] **PWA Installation** - Can install on iOS/Android home screen

---

### 🎓 **SPRINT 2 NEW FEATURES TESTING**

#### 1. **Teacher Role & Access Control**
- [ ] **Middleware Protection** - `/teacher` routes blocked for non-teachers
- [ ] **Role Assignment** - Users with 'teacher' role can access teacher dashboard
- [ ] **Email-based Role Detection** - Emails containing 'teacher' or '@school' auto-assign teacher role
- [ ] **Admin Override** - Special test email (eben.combrinck@proton.me) has teacher access

#### 2. **Teacher Dashboard**
- [ ] **Dashboard Layout** - Clean, professional interface with navigation tabs
- [ ] **Statistics Display** - Shows total students, classes, lessons assigned, completion rates
- [ ] **Recent Activity** - Displays latest classroom activities and updates
- [ ] **Quick Actions** - Buttons for creating classes, content, assignments
- [ ] **Class Performance** - Overview of all teacher's classes with progress metrics

**Navigation Tabs Testing:**
- [ ] **Overview Tab** - Shows stats, quick actions, recent activity, class performance
- [ ] **My Classes Tab** - Lists teacher's classes with management options
- [ ] **Students Tab** - Student management interface
- [ ] **Content Tab** - Content creation and management
- [ ] **Moderation Tab** - Content approval queue (new in Sprint 2)

#### 3. **Teacher Onboarding Flow**
- [ ] **Automatic Trigger** - Shows for new teachers who haven't completed onboarding
- [ ] **4-Step Process** - Welcome → Create Class → Create Content → Monitor Progress
- [ ] **Progress Tracking** - Visual progress bar and step indicators
- [ ] **Skip Option** - Can skip onboarding at any step
- [ ] **Completion Tracking** - `teacher_onboarding_completed` set to true in database
- [ ] **One-time Only** - Doesn't show again after completion

#### 4. **Class Creation & Management**
- [ ] **Class Creation Form** - All fields work (name, subject, grade, description, goals)
- [ ] **Invite Code Generation** - Unique class codes generated automatically
- [ ] **Code Sharing** - Copy to clipboard, share link, QR code options
- [ ] **Class Settings** - Self-enrollment, progress reports, gamification toggles
- [ ] **Class Storage** - Classes saved to `teacher_classes` table with proper RLS

#### 5. **Teacher Content Creation**
- [ ] **Content Form** - Title, category, grade, difficulty, description, tags
- [ ] **Content Types** - Text, text-image, video, quiz options
- [ ] **Media Upload** - File upload interface (UI only - backend integration needed)
- [ ] **Rich Text Editor** - Write/Preview tabs for content creation
- [ ] **Quiz Builder** - Question creation interface for assessment content
- [ ] **Content Storage** - Saves to `teacher_content` table with draft status

#### 6. **Content Moderation System**
- [ ] **Moderation Queue** - Shows pending content in Moderation tab
- [ ] **Statistics Display** - Pending reviews, approved, rejected counts
- [ ] **Content Preview** - Can preview content before approval
- [ ] **Approval Actions** - Approve/Reject buttons with notes
- [ ] **Status Updates** - Content status changes from 'pending_review' to 'approved'/'rejected'
- [ ] **Review Tracking** - `reviewed_by`, `reviewed_at`, `review_notes` fields updated

#### 7. **Email Notification System**
- [ ] **API Endpoint** - `POST /api/notifications/email` accepts correct payload
- [ ] **Email Types** - teacher-to-student, teacher-to-parent, weekly-progress
- [ ] **Template Generation** - Beautiful HTML emails with Skill Gain branding
- [ ] **Recipient Validation** - Only sends to existing users
- [ ] **Database Logging** - Emails tracked in `email_notifications` table
- [ ] **Error Handling** - Graceful failure handling

**Email Template Testing:**
- [ ] **Teacher to Student** - Personalized message with class context
- [ ] **Teacher to Parent** - Includes student name, formatted professionally
- [ ] **Weekly Progress** - Achievement highlights, recommendations, progress summary

#### 8. **SEO & Analytics**
- [ ] **Meta Tags** - Open Graph, Twitter Cards, structured data present
- [ ] **Sitemap** - `/sitemap.xml` accessible with all curriculum pages
- [ ] **Dynamic Titles** - Page titles update based on content
- [ ] **GA Integration** - Analytics loads when `NEXT_PUBLIC_GA_MEASUREMENT_ID` set
- [ ] **Vercel Analytics** - Performance monitoring active

#### 9. **Launch Polish & UX**
- [ ] **Launch Splash** - 4-slide onboarding for new users
- [ ] **Share Component** - Multiple sharing options with generated images
- [ ] **Error Boundaries** - Graceful error handling with user-friendly messages
- [ ] **Loading States** - Smooth transitions and loading indicators
- [ ] **Accessibility** - Screen reader support, keyboard navigation

---

## 🔍 **DETAILED TESTING SCENARIOS**

### **Scenario 1: New Teacher Onboarding**
1. Create account with email containing 'teacher' or '@school'
2. Login and verify automatic redirect to teacher onboarding
3. Complete all 4 steps of onboarding
4. Verify dashboard shows and onboarding doesn't appear again
5. Check database: `teacher_onboarding_completed = true`

### **Scenario 2: Class Creation & Student Enrollment**
1. Login as teacher, go to `/teacher/classes/new`
2. Fill out class creation form with all details
3. Verify unique class code generated
4. Test code copying and sharing options
5. Login as student, attempt to join class using code
6. Verify enrollment in `class_students` table

### **Scenario 3: Content Creation & Moderation**
1. Login as teacher, create new content (`/teacher/content/new`)
2. Fill out content form with quiz questions
3. Submit content (goes to 'pending_review' status)
4. Check Moderation tab shows pending content
5. Approve content from moderation queue
6. Verify status changes to 'approved' and `is_published = true`

### **Scenario 4: Email Notifications**
1. Setup teacher-student relationship via class enrollment
2. Send teacher-to-student email via API
3. Verify email logged in database
4. Check email template formatting (HTML and text versions)
5. Test teacher-to-parent and weekly-progress email types

### **Scenario 5: SEO & Social Sharing**
1. Visit various pages, check browser title updates
2. Inspect page source for meta tags
3. Test Open Graph tags with Facebook debugger
4. Verify sitemap.xml contains all expected URLs
5. Test share component generates images and links

---

## 🐛 **BUG REPORTING TEMPLATE**

When reporting issues, please include:

```
**Test Case:** [Brief description]
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:** [What should happen]
**Actual Result:** [What actually happened]
**Browser/Device:** [Chrome 120, iPhone 15, etc.]
**Screenshots:** [Attach if visual issue]
**Console Errors:** [Copy any JavaScript errors]
**Database State:** [Relevant table contents]
```

---

## ✅ **SIGN-OFF CRITERIA**

**All tests must pass before launch:**

- [ ] **Zero critical bugs** in teacher flows
- [ ] **All new features functional** end-to-end
- [ ] **No regressions** in Phase 1 features
- [ ] **Mobile PWA** works perfectly on iOS/Android
- [ ] **Email system** sends correctly (when configured)
- [ ] **SEO tags** properly implemented
- [ ] **Error boundaries** catch and handle errors gracefully
- [ ] **Database migration** applies cleanly
- [ ] **Content seeding** populates all required data
- [ ] **Performance** meets Lighthouse score targets

---

## 🚀 **POST-LAUNCH MONITORING**

After deployment, monitor these metrics:

1. **Teacher Onboarding Completion Rate**
2. **Class Creation Success Rate**
3. **Content Moderation Workflow Efficiency**
4. **Email Delivery Success Rate**
5. **SEO Performance** (Search Console)
6. **User Engagement** (Analytics)
7. **Error Rates** (Sentry/LogRocket)
8. **PWA Usage** (Installation rates)

---

## 📞 **TESTER SUPPORT**

**Need Help?**
- Check browser console for JavaScript errors
- Verify database connections and API responses
- Test with different user roles and permissions
- Use browser dev tools for network and performance analysis

**Quick Debug Commands:**
```bash
# Check database tables
psql -h [db-host] -U postgres -d postgres -c "\dt"

# View recent errors
tail -f /var/log/application.log

# Test API endpoints
curl -X GET http://localhost:3000/api/health
```

**Ready to begin testing! 🎯**