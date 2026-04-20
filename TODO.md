# SCHOOLM8 TODO - Production Readiness Checklist

## PHASE 1: STABILIZE (1-2 weeks) - CRITICAL

### Error Handling & Boundaries

- [ ] Create global error boundary component
    - File: `app/error.tsx` (Next.js App Router pattern) **DONEISH (sentry)**
    - Handle client-side errors gracefully **DONEISH (sentry)**
    - Log errors to Sentry (or similar) **DONE**
    - Show user-friendly error message
    - Add retry button for failed operations

- [ ] Add error handling to all API routes
    - Add try-catch wrapping to all 66 endpoints
    - Return consistent error response format
    - Log errors server-side
    - Include error tracking ID for user reference

- [ ] Implement error boundary for async API calls
    - Add timeout handling (30s default)
    - Retry logic with exponential backoff
    - Network error detection
    - Show loading → error → retry UI flow

### Input Validation

- [ ] Install validation library (Zod or Yup)
    - `pnpm add zod` (Recommended for API routes)
    - Create validation schemas for:
        - User registration/login
        - Canvas connection setup
        - Classroom connection setup
        - Timetable configuration
        - Note creation/update
        - Schedule creation/update
        - All form submissions

- [ ] Add form validation to pages
    - Sign in page (email + password)
    - Sign up page (if exists)
    - Canvas setup form
    - Google Classroom setup form
    - Note creation form
    - Schedule builder form
    - Add visual feedback (red border, error message below field)

- [ ] Validate API request bodies
    - Add schema validation to all 66 API routes
    - Return 400 Bad Request for invalid data
    - Include field-level error messages

### Loading States & UI Feedback

- [ ] Create skeleton/placeholder components
    - Skeleton list item (for assignments, courses, notes)
    - Skeleton grid card (for LMS items)
    - Skeleton timetable cell
    - Skeleton dashboard tile
    - Duration: Show for minimum 200ms to avoid flash

- [ ] Add loading states to all data-fetching pages
    - `/assignments` - Show 3 skeleton cards while loading
    - `/courses` - Show 3 skeleton cards while loading
    - `/lms` - Show skeleton for announcements, assignments, courses
    - `/timetable` - Show skeleton for week view
    - `/notes` - Show 3 skeleton cards while loading
    - `/schedule` - Show skeleton schedule

- [ ] Add loading indicators to buttons
    - When submitting forms, show spinner inside button
    - Disable button while loading
    - Show progress for file uploads
    - Indicate success/error state after action

- [ ] Add empty state messaging
    - Improve icons + messaging (already partially done)
    - Add helpful CTAs for empty states
    - Show loading spinner (not just blank)

### Settings Pages Implementation

- [ ] `/settings/integrations`
    - Show connected services (Canvas, Classroom, OneDrive)
    - Display connection status (connected/disconnected)
    - Button to connect Canvas (show form for base URL + token)
    - Button to connect Google Classroom (OAuth flow)
    - Button to disconnect each service
    - Last sync timestamp
    - Manual sync button with loading state
    - Error message if sync failed
    - ~200-300 lines

- [ ] `/settings/account`
    - Display user profile (name, email)
    - Edit profile button (name field)
    - Change password form (old + new + confirm)
    - Email verification section (send verification email button)
    - Delete account section (with confirmation dialog)
    - ~150-200 lines

- [ ] `/settings/advanced`
    - Debug mode toggle (shows raw data, query times)
    - Cache clearing button
    - Data export button (JSON download)
    - Reset dashboard to default
    - API endpoint documentation
    - ~100-150 lines

- [ ] `/settings/tasks`
    - List of background tasks (LMS Sync, Timetable Sync)
    - Show task status (idle, running, paused, failed)
    - Task configuration (enable/disable toggle, frequency)
    - Last run timestamp
    - Last error message (if any)
    - Manual trigger button for each task
    - Task execution logs (last 10 runs)
    - ~200-300 lines

### API Error Recovery

- [ ] Implement retry logic
    - Retry failed requests up to 3 times
    - Exponential backoff (1s, 2s, 4s)
    - Don't retry on 4xx errors (client fault)
    - Only retry on 5xx or network errors

- [ ] Add request timeout handling
    - 30 second timeout for API calls
    - Show timeout error to user
    - Allow user to retry

- [ ] Improve error messages
    - Show friendly error instead of technical details
    - Include what went wrong + what to do
    - Example: "Failed to sync Canvas. Please check your access token and try again."

### Accessibility (WCAG 2.1 AA - Basic)

- [ ] Add ARIA labels to interactive elements
    - All buttons should have aria-label or visible text
    - Form inputs should have associated labels
    - Navigate, submit, delete buttons
    - Icon-only buttons
    - Target: 50+ ARIA additions

- [ ] Implement keyboard navigation
    - Tab through all interactive elements
    - Enter/Space to activate buttons
    - Escape to close modals/dropdowns
    - Arrow keys for navigation in lists
    - Test with keyboard only (no mouse)

- [ ] Improve focus management
    - Visible focus indicator on all focusable elements
    - Focus trap in modals
    - Focus returns to button that opened modal
    - Keyboard navigation within sidebars

- [ ] Color contrast verification
    - Check text/background contrast (4.5:1 for normal text)
    - Use browser devtools contrast checker
    - Fix issues in status badges, error messages, etc.

---

## PHASE 2: COMPLETE FEATURES (2-3 weeks)

### Form Validation & User Feedback

- [ ] Add form error states to all forms
    - Show field-level errors below inputs
    - Highlight invalid fields with red border
    - Clear error when user starts typing
    - Show success message after form submission

- [ ] Implement form submission feedback
    - Show loading state during submission
    - Disable form while submitting
    - Show success toast notification
    - Show error toast notification
    - Redirect or clear form on success

- [ ] Add field validation feedback
    - Email format validation (real-time)
    - URL validation for Canvas/timetable URLs
    - Required field indicators
    - Character count for text areas
    - Password strength indicator (on signup)

### Dashboard Customization

- [ ] Add new dashboard tiles (5-10 new types)
    - Tasks/Todo widget
    - Upcoming assignments countdown
    - Course schedule overview
    - Grade tracker (if Canvas provides data)
    - Focus timer/Pomodoro
    - Quote/motivation of the day
    - Notes quick-add widget
    - File explorer widget
    - Calendar widget (month view)
    - GPA tracker widget

- [ ] Improve tile configuration
    - Settings modal for each tile (color, size, etc.)
    - Tile preview before adding
    - Delete tile confirmation dialog
    - Reorder tiles/pages UI
    - Tile library/marketplace concept

### Data Tables

- [ ] Create reusable Table component
    - Sortable columns
    - Pagination (10, 25, 50 items per page)
    - Search within table
    - Bulk select + actions (delete, mark complete, etc.)
    - Responsive on mobile (horizontal scroll or card view)

- [ ] Apply Table component to pages
    - `/assignments` - Replace grid with sortable table
    - `/courses` - Add course list view option
    - `/notes` - Add list view option
    - Include status badges, due dates, action buttons

### Search UI

- [ ] Implement `/search` page
    - Search bar at top of page
    - Filter options (by type: assignment, note, course, timetable)
    - Sort options (by date, relevance, name)
    - Search results display
    - No results empty state
    - Recent searches (in localStorage)
    - Search as you type with debounce

- [ ] Add global search keyboard shortcut
    - Cmd/Ctrl + K to open search (command palette style)
    - Focus search input
    - Show recent searches or suggestions

### Additional Settings Features

- [ ] Theme/Appearance enhancements
    - Implement theme switcher (pre-built themes)
    - Dark/Light mode toggle
    - Custom theme editor (color picker, font size)
    - Preview changes in real-time
    - Save custom theme to localStorage/Firestore

- [ ] Navigation customization
    - Reorder navigation items
    - Show/hide navigation items
    - Custom navigation names
    - Persistence in Firestore

### Chat/Collaboration (If time permits)

- [ ] Check if chat system is integrated
    - Verify `/api/chat/*` endpoints
    - Implement basic chat UI
    - Chat list + message view
    - Real-time messaging (Firestore listeners)
    - User online status

---

## PHASE 3: TESTING & QUALITY (2-3 weeks)

### Unit Testing

- [ ] Setup Jest testing framework
    - `pnpm add -D jest @testing-library/react @testing-library/jest-dom`
    - Create `jest.config.js`
    - Setup test scripts in package.json
    - Create test utilities/helpers

- [ ] Write tests for API routes
    - Test happy path
    - Test error cases
    - Test validation
    - Test authentication
    - Target: 80% coverage of critical routes (40+ tests)

- [ ] Write tests for utilities
    - `lib/lmsNormaliser.ts` - Normalization logic
    - `lib/firebaseSchema.ts` - Schema helpers
    - `lib/timetableNormaliser.ts` - Timetable parsing
    - `lib/utils.ts` - Helper functions
    - Target: 90% coverage

- [ ] Write tests for context providers
    - AuthContext initialization
    - LayoutContext operations
    - ThemeContext updates
    - NavigationContext state changes

### E2E Testing

- [ ] Setup Playwright (or Cypress)
    - `pnpm add -D @playwright/test`
    - Create test configuration
    - Setup GitHub Actions CI

- [ ] Write critical user flows
    1. Sign up → Complete onboarding → View dashboard
    2. Connect Canvas → Sync assignments → View assignments
    3. Setup timetable → View timetable
    4. Create note → Edit note → Delete note
    5. Create schedule → Add elements → View schedule

- [ ] Write integration tests
    - Test multiple steps in sequence
    - Verify data persists
    - Check navigation flows
    - Target: 10-15 critical flows

### Component Testing

- [ ] Create Storybook setup (optional but recommended)
    - `pnpm add -D storybook`
    - Document all components
    - Visual regression testing with Percy

### Performance

- [ ] Code splitting
    - Lazy load dashboard editor
    - Lazy load settings pages
    - Lazy load heavy components (Monaco editor)

- [ ] Optimize images
    - Use Next.js Image component
    - Add proper width/height
    - Set loading="lazy" for below-fold images

- [ ] Caching strategy
    - Add Cache-Control headers to API responses
    - Implement client-side caching (React Query)
    - Service Worker for offline support (future)

### Security Audit

- [ ] OWASP Top 10 check
    - Input validation (already done in Phase 1)
    - Output encoding (check XSS prevention)
    - CSRF tokens (if needed)
    - Rate limiting on API routes
    - SQL injection N/A (using Firestore)

- [ ] Dependency audit
    - `pnpm audit`
    - Update vulnerable packages
    - Review critical dependencies

- [ ] Secrets management
    - Ensure no secrets in git history
    - Use GitHub secrets for CI/CD
    - Validate .env.local is in .gitignore

### Analytics

- [ ] Add basic analytics
    - Google Analytics or similar
    - Track page views
    - Track user actions (sync, submit assignment, etc.)
    - Track errors
    - Setup privacy-compliant tracking

---

## PHASE 4: INFRASTRUCTURE & SCALING (Ongoing)

### CI/CD Pipeline

- [ ] GitHub Actions setup
    - Lint on push (ESLint + Prettier)
    - Type check on push (TypeScript)
    - Run tests on PR
    - Build on push to main
    - Deploy to production on main

- [ ] Environment management
    - Setup staging environment
    - Setup production environment
    - Environment-specific configs

### Monitoring & Logging

- [ ] Error tracking (Sentry)
    - `pnpm add @sentry/nextjs`
    - Setup Sentry project
    - Configure error reporting
    - Setup alerts for critical errors

- [ ] Performance monitoring
    - Web Vitals tracking
    - API response time tracking
    - Database query performance

### Database Optimization

- [ ] Firestore indexes
    - Add composite indexes for common queries
    - Monitor slow queries
    - Optimize query patterns

- [ ] Data structure review
    - Batch operations where possible
    - Denormalization where beneficial
    - Archive old data

### Documentation

- [ ] Developer documentation
    - Architecture overview
    - Setup instructions
    - Component API documentation
    - Database schema documentation

- [ ] User documentation
    - Getting started guide
    - Feature walkthroughs
    - FAQ
    - Troubleshooting guides

### Future Enhancements

- [ ] Background jobs
    - Implement scheduled sync (every hour)
    - Use Cloud Functions or Bull Queue
    - Process intensive operations in background

- [ ] Real-time features
    - Firestore listeners for live updates
    - Websocket for chat
    - Push notifications for new assignments

- [ ] Mobile app
    - React Native version or PWA
    - Offline-first support
    - Push notifications

---

## QUICK WINS (Can do in parallel, 1-2 days each)

- [ ] Dark mode toggle (already have context, just need UI button)
- [ ] Add missing breadcrumbs to detail pages
- [ ] Improve empty state illustrations (use Lucide React icons)
- [ ] Add favicon/app icons
- [ ] Setup robots.txt and sitemap.xml
- [ ] Add print CSS for assignments/notes
- [ ] Email templates for verification + reset
- [ ] Two-factor authentication setup
- [ ] Social sharing buttons (for assignments)
- [ ] Export to PDF (assignments, notes, schedule)

---

## ESTIMATED EFFORT

| Phase             | Duration        | Dev Days  | Tasks    | Priority     |
| ----------------- | --------------- | --------- | -------- | ------------ |
| 1: Stabilize      | 1-2 weeks       | 8-10      | 35       | **CRITICAL** |
| 2: Complete       | 2-3 weeks       | 10-12     | 30       | **HIGH**     |
| 3: Testing        | 2-3 weeks       | 10-12     | 25       | **HIGH**     |
| 4: Infrastructure | Ongoing         | 2-3/week  | 15       | **MEDIUM**   |
| Quick Wins        | 1-2 weeks       | 3-5       | 10       | **LOW**      |
| **TOTAL**         | **10-12 weeks** | **35-40** | **115+** |              |

---

## SUCCESS CRITERIA

### Phase 1 (Stabilize)

- [ ] No unhandled errors (all errors caught + logged)
- [ ] All forms validate input before submission
- [ ] All pages show loading states while fetching
- [ ] 4 settings pages functional
- [ ] API errors don't silently fail
- [ ] Basic WCAG accessibility (AA)

### Phase 2 (Complete Features)

- [ ] All settings pages fully implemented
- [ ] Form validation with user feedback
- [ ] Data displayed in tables with sorting/pagination
- [ ] Search functionality working
- [ ] New dashboard tiles available
- [ ] Theme customization available

### Phase 3 (Testing & Quality)

- [ ] 80%+ test coverage on critical code
- [ ] E2E tests for user flows
- [ ] Performance optimized (Core Web Vitals green)
- [ ] Security audit passed
- [ ] Analytics tracking working

### Phase 4 (Infrastructure)

- [ ] Automated deployments
- [ ] Error tracking in production
- [ ] Performance monitoring active
- [ ] Documentation complete
- [ ] Runbooks for common issues

---

## TRACKING CHECKLIST

Print this and track progress:

```
Phase 1: [ ] [ ] [ ] [ ] [ ] (5 main categories)
Phase 2: [ ] [ ] [ ] [ ] [ ] (5 main categories)
Phase 3: [ ] [ ] [ ] [ ] [ ] (5 main categories)
Phase 4: [ ] [ ] [ ] [ ] [ ] (5 main categories)
```

---

**Last Updated:** 2026-04-20
**Status:** Not Started
**Owner:** TBD
**Deadline:** TBD
