# SCHOOLM8 - COMPREHENSIVE PROJECT ANALYSIS

## 1. PROJECT OVERVIEW

### Purpose & Core Functionality
**Schoolm8** (formerly NorwestMate) is a centralized student productivity platform designed to consolidate assignments, tasks, schedules, and study materials from multiple Learning Management Systems (LMS) and timetable sources. It serves as a unified portal for students to manage their academic life across fragmented school systems.

**Key Mission:** Eliminate the need to juggle multiple portals (Canvas, Google Classroom, Edumate, etc.) by bringing everything into one intuitive interface.

### Target Users
- Students in secondary/tertiary education
- Future expansion: Teachers and school administrators
- Current Focus: Individual student use

### Application Type
- **Frontend:** Next.js 16.1.6 with React 19.2.0 (SSR/Client hybrid)
- **Backend:** Firebase (Auth + Firestore Database)
- **Hosting Ready:** Serverless architecture (Next.js API routes)
- **Status:** Beta/MVP with active development

---

## 2. CURRENT PAGES/ROUTES

### Authentication & Onboarding
- `/` → Redirect to dashboard
- `/auth` → Auth landing page with sign in/up options
- `/auth/signin` → Email/password + Google OAuth sign in
- `/auth/signup` → User registration (status unclear - may redirect to signin)
- `/onboarding` → Multi-step onboarding wizard (7 steps)
  - Step 1: Feature showcase carousel
  - Step 2: Disclaimer/terms
  - Step 3: LMS connection (Canvas/Google Classroom)
  - Step 4: Timetable setup (iCal/Edumate)
  - Step 5: Theme selection
  - Step 6: Layout selection
  - Step 7: Further learning resources
- `/onboarding/dark` → Dark theme onboarding variant
- `/onboarding/light` → Light theme onboarding variant

### Main Application Pages
- `/dashboard` → Main hub with customizable grid-based dashboard
- `/dashboard/editor` → Dashboard editor for tile placement & configuration

### Learning Management System (LMS)
- `/lms` → LMS hub with announcements, assignments, courses (carousel view)
- `/lms/announcement/[id]` → Individual announcement detail page
- `/lms/assignment/[id]` → Individual assignment detail page
- `/lms/course/[id]` → Individual course detail page (route exists, page status unclear)

### Assignments & Courses
- `/assignments` → All assignments from connected LMS systems (with filters)
- `/courses` → All enrolled courses (with search)

### Timetable & Schedule
- `/timetable` → Timetable view (grid or list mode with week navigation)
- `/schedule` → Custom schedule builder (time-based elements)

### Notes & Content
- `/notes` → All user notes with creation option
- `/notes/create` → Note creation page with rich editor

### Editors
- `/editors/text` → Built-in text editor (Appears to be TinyMCE integration)

### Settings
- `/settings` → Settings hub with navigation to sub-sections
- `/settings/integrations` → [STUB - WIP] LMS & service integrations
- `/settings/appearance` → Theme editor (3 modes: themes selector, visual editor, advanced code)
- `/settings/advanced` → [STUB - WIP] Advanced configuration
- `/settings/account` → [STUB - WIP] User account management
- `/settings/tasks` → [STUB - WIP] Background task management
- `/settings/navigation` → Navigation configuration

### Documentation
- `/docs/[[...slug]]` → Documentation hub (Fumadocs integration)

### Development & Testing
- `/test` → Internal test page (likely for development)

---

## 3. IMPLEMENTED FEATURES

### Authentication System
- ✅ Email/password authentication (Firebase)
- ✅ Google OAuth sign-in
- ✅ User session management with ID tokens
- ✅ Automatic user document creation on first login
- ✅ Auth state context (useAuth hook)
- ⚠️ Sign up flow incomplete/unclear
- ❌ Password reset functionality
- ❌ Email verification
- ❌ Multi-factor authentication

### LMS Integration
#### Canvas LMS
- ✅ API connection via access token + base URL
- ✅ Course sync (name, image, URL)
- ✅ Assignment sync with submission state tracking
- ✅ Announcement sync
- ✅ Assignment submission capability (direct from Schoolm8)
- ✅ File upload for assignments
- ✅ HTML content sanitization
- ✅ Bidirectional sync with Canvas API
- ⚠️ Sync triggers manual (no background scheduling visible)

#### Google Classroom
- ✅ OAuth-based connection
- ✅ Course sync
- ✅ Assignment sync with submission state
- ✅ Announcement sync
- ✅ Assignment submission
- ✅ File upload for assignments
- ⚠️ Sync triggers manual

#### Generic LMS (Planned/Partial)
- ⚠️ Edumate integration (reverse-engineered, auto-auth via JS script)
- ⚠️ Engage integration (In Progress - not implemented)
- ⚠️ Compass Education integration (Planned)
- ❌ Moodle integration
- ❌ Blackboard integration

### Timetable Integration
- ✅ Generic iCal (calendar file) support
  - ✅ URL-based import with optional auth
  - ✅ File upload support
- ✅ Edumate integration (reverse-engineered login)
- ⚠️ Generic timetable (via third-party services)
- ❌ Compass Education timetable
- ❌ Manual timetable builder

### Data Management
- ✅ Firestore database with user documents
- ✅ Nested data structures for assignments, courses, announcements
- ✅ Schedule/element management
- ✅ Notes creation and storage
- ✅ Projects/file attachment system
- ✅ Dashboard page/tile persistence
- ⚠️ No real-time sync visible
- ⚠️ Limited data validation

### Dashboard System
- ✅ Customizable grid-based dashboard (responsive grid sizing)
- ✅ Draggable tiles (with mouse/touch support)
- ✅ Resizable tiles
- ✅ Multiple pages support
- ✅ Tile registry system (modular tile architecture)
- ✅ Dashboard editor with tile menu
- ⚠️ Limited tile types (Clock, Weather, Timetable variants)

### Available Tiles/Widgets
1. **Clock Tile** - Real-time clock display
2. **Weather Tile** - Weather information (location-based)
3. **Timetable List** - Tabular schedule view
4. **Timetable Grid** - Grid-based schedule view
5. **Current Class (Style A)** - Active class indicator
6. **Current Class (Style B)** - Alternative active class style

### Styling & Theming
- ✅ Theme context system
- ✅ CSS-in-JS object structure (lib/css.ts - 466 lines)
- ✅ Raw Tailwind CSS class support
- ⚠️ Theme switching (appears partially implemented)
- ⚠️ Code-based theme editing (advanced mode)
- ⚠️ Visual theme editor (stub in appearance page)
- ⚠️ Pre-built theme library (stub in settings)

### File Management (OneDrive Integration)
- ✅ OneDrive authentication flow
- ✅ File listing/browsing
- ✅ File download capability
- ✅ File creation (basic)
- ✅ File deletion
- ✅ Folder creation
- ✅ File/folder metadata
- ✅ File move/rename
- ✅ File search
- ⚠️ Appears separate from assignment file uploads

### User Profile & Account
- ⚠️ Basic user info stored (name, email, verification status)
- ❌ Profile editing
- ❌ Password change
- ❌ Email verification
- ❌ Two-factor authentication setup
- ❌ Data deletion/GDPR features

### Task/Job System
- ✅ Background task execution framework
- ✅ Task status tracking (pending, working, complete)
- ✅ Pre-configured tasks (LMS Sync, Timetable Sync)
- ⚠️ Task execution mechanism (unclear if automatic or manual)
- ❌ Task scheduling/cron system
- ❌ Task failure notifications

### Search & Filtering
- ✅ Assignment filtering (status, subject, date range)
- ✅ Course search (text-based)
- ✅ Timetable filtering (event type, search)
- ⚠️ Global search API endpoint exists (`/api/search`)
- ❌ Search results page/UI

---

## 4. TECHNOLOGY STACK

### Core Framework
- **Next.js** 16.1.6 (Latest, with App Router)
- **React** 19.2.0
- **TypeScript** 5.9.3 (strict mode enabled)
- **Node.js** 20+

### Frontend Libraries
- **Styling:** Tailwind CSS 4.1.18 + TailwindCSS PostCSS plugin
- **UI Components:** 
  - Radix UI (label, scroll-area, select, slot)
  - Class Variance Authority (CVA) for component variants
  - clsx + tailwind-merge for className management
- **Icons:** lucide-react (556 icons available)
- **Editor:** 
  - @monaco-editor/react (code editor)
  - @tinymce/tinymce-react + tinymce (rich text editor)
- **Calendar/Dates:** date-fns 4.1.0
- **Animation:** tw-animate-css 1.4.0

### Backend & Services
- **Authentication:** Firebase Auth
- **Database:** Firestore (NoSQL)
- **Admin SDK:** firebase-admin 13.6.0
- **Client SDK:** firebase 12.6.0

### External APIs
- **Canvas LMS:** Canvas API (REST)
- **Google Services:**
  - Google Classroom API
  - Google OAuth 2.0
  - Google Drive API (googleapis v171.4.0)
- **Microsoft Azure:** OneDrive OAuth (NEXT_PUBLIC_AZURE_CLIENT_ID)

### Data Format Support
- **iCal/ICS:** ical.js 2.2.1
- **HTML Processing:** 
  - html-to-text 9.0.5
  - @babel/parser 7.29.2
- **HTTP:** node-fetch 3.3.2, fetch-cookie 3.2.0
- **Cookies:** tough-cookie 6.0.0
- **Form Data:** busboy 1.6.0, formidable 3.5.4, formdata-node 6.0.3

### Documentation
- **Fumadocs** (Documentation framework)
  - fumadocs-core 16.7.16
  - fumadocs-ui 16.7.16
  - fumadocs-mdx 14.3.0
- **MDX** Support (@types/mdx 2.0.13)

### Code Quality
- **Linting:** ESLint 9.39.4
  - eslint-config-next
  - eslint-plugin-import
  - eslint-plugin-prettier
  - eslint-plugin-unused-imports
- **Code Formatting:** Prettier 3.7.4
- **TypeScript Strict:** ✅ Enabled

### Development Tools
- **Build Tool:** Next.js built-in (Turbopack-ready)
- **Package Manager:** pnpm (with workspace support)
- **Version Control:** Git
- **API Testing:** Manual (no visible test suite)

### Runtime Environment Variables
**Public (Client-side):**
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
- NEXT_PUBLIC_AZURE_CLIENT_ID
- NEXT_PUBLIC_BASE_URL

**Private (Server-side):**
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URL
- AZURE_CLIENT_SECRET

---

## 5. UI/UX CURRENT STATE

### Design System
- **Color Scheme:** Dark mode primary (slate-900 base), with emerald accents
- **Component Library:** Custom Radix UI + Tailwind CSS components
- **Typography:** System fonts via Tailwind
- **Spacing:** Tailwind's standard scale (4px base unit)
- **Responsive Design:** Mobile-first (md:, lg: breakpoints visible)

### Existing UI Components
1. **Navigation Component** (455 lines)
   - Collapsible sidebar with icon support
   - Dynamic menu items with visibility toggling
   - Active state indicators
   - Responsive hamburger menu
   - localStorage persistence

2. **Dashboard Component** (331 lines)
   - Grid-based drag-and-drop system
   - Resizable tiles
   - Tile context menu
   - Editor modal for tile configuration
   - Background image support

3. **TaskManager Component**
   - Background task status display
   - Toast notifications via react-toastify

4. **Timetable Tiles** (multiple variants)
   - List view (scrollable)
   - Grid view (hourly cells)
   - Current class indicators

5. **Theme Switcher Component**
   - Theme selector dropdown
   - Code editor integration

6. **Common Patterns**
   - Loading spinners (custom SVG-based)
   - Empty states (icon + message + CTA)
   - Filter bars (sticky positioning)
   - Card layouts (hover effects, shadows)
   - Gradient overlays

### Current Styling Approach
- **CSS-in-JS Structure:** Raw Tailwind classes stored in object tree (lib/css.ts)
- **Theme Application:** Context-based class injection
- **Limitations:**
  - String-based class management (no type safety)
  - Manual class aggregation (not using CSS modules or styled-components)
  - Difficult to maintain large style hierarchies

### Accessibility Issues
- ⚠️ Minimal ARIA labels (only 5 found in codebase)
- ⚠️ Keyboard navigation not fully tested
- ❌ Screen reader support unclear
- ❌ Focus management in modals/dialogs
- ❌ Color contrast verification needed
- ❌ Reduced motion preferences not respected

### Missing UI Components
- ❌ Modal/Dialog with proper focus management
- ❌ Toast/Alert system (react-toastify exists but underutilized)
- ❌ Form validation feedback
- ❌ Skeleton/placeholder loading states
- ❌ Breadcrumb navigation
- ❌ Table component (data tables)
- ❌ Pagination component
- ❌ Dropdown menu (proper implementation)
- ❌ Tooltip component
- ❌ Tab component
- ❌ Accordion component
- ❌ Progress bar/indicator
- ❌ Badge component
- ❌ Avatar component

---

## 6. ARCHITECTURE

### Directory Structure
```
schoolm8/
├── app/                          # Next.js App Router (T3 inspired)
│   ├── api/                      # API routes (66 endpoints)
│   │   ├── auth/                 # Authentication flows
│   │   ├── canvas/               # Canvas LMS API proxy
│   │   ├── googleclassroom/       # Google Classroom API proxy
│   │   ├── lms/                  # Generic LMS wrapper
│   │   ├── timetable/            # Timetable sync/fetch
│   │   ├── files/                # OneDrive file operations
│   │   ├── notes/                # Note CRUD
│   │   ├── projects/             # Project management
│   │   ├── schedule/             # Schedule management
│   │   ├── tasks/                # Task/job management
│   │   ├── chat/                 # Chat functionality
│   │   └── search/               # Global search
│   ├── (pages)                   # Page routes
│   └── layout.tsx                # Root layout with providers
├── components/                   # React components
│   ├── tiles/                    # Dashboard tiles
│   ├── panels/                   # Dashboard panels
│   ├── Dashboard.tsx             # Main dashboard component
│   ├── Navigation.tsx            # Sidebar navigation
│   └── ...                       # Other reusable components
├── context/                      # React Context providers
│   ├── authContext.tsx           # Auth state
│   ├── layoutContext.tsx         # Dashboard layout state
│   ├── themeContext.tsx          # Theme/styling state
│   └── navigationContext.tsx     # Navigation state
├── lib/                          # Utilities & helpers
│   ├── firebaseClient.ts         # Client-side Firebase config
│   ├── firebaseAdmin.ts          # Admin Firebase setup
│   ├── firebaseSchema.ts         # Firestore schema helpers
│   ├── css.ts                    # Styling object tree
│   ├── lmsNormaliser.ts          # LMS data normalization
│   ├── tiles.ts                  # Tile registry
│   ├── templates.ts              # Data templates
│   ├── urls.ts                   # URL constants
│   ├── utils.ts                  # Helper functions
│   ├── googleClient.ts           # Google API client
│   ├── googleClassroom.ts        # Google Classroom logic
│   ├── edumateClient.ts          # Edumate integration
│   ├── timetableNormaliser.ts    # Timetable data normalization
│   ├── ical.ts                   # iCal parsing
│   └── ...                       # Other utilities
├── public/                       # Static assets
│   ├── images/
│   │   ├── backgrounds/builtin/  # Built-in backgrounds
│   │   └── onboarding/           # Onboarding assets
│   └── ...
├── content/                      # Documentation content
├── testing/                      # Test utilities (unused)
├── .source/                      # Fumadocs source
└── ...                           # Config files
```

### Data Flow Architecture

#### Authentication Flow
```
User Login/SignUp
  ↓
Firebase Auth (signInWithEmailAndPassword/signInWithPopup)
  ↓
Get ID Token
  ↓
Create/Init User Doc (/api/auth/init)
  ↓
Store in Firestore
  ↓
AuthContext provides (user, token, loading)
  ↓
Protected Routes check useAuth() hook
```

#### LMS Sync Flow
```
User connects LMS (Canvas/Classroom)
  ↓
Store connection credentials/OAuth token in Firestore
  ↓
User triggers sync (manual or scheduled)
  ↓
API route (/api/lms/sync) fetches from LMS API
  ↓
Normalize data (lmsNormaliser.ts)
  ↓
Save to Firestore in separate collections
  ↓
Frontend fetches and displays
```

#### State Management
- **AuthContext:** User authentication state (Redux-like but lighter)
- **LayoutContext:** Dashboard layout state (pages, tiles, panels)
- **ThemeContext:** Styling/theme state
- **NavigationContext:** Sidebar navigation state
- **localStorage:** Persistence of layout and navigation state

### API Route Patterns

**Authentication Routes:**
- POST `/api/auth/init` - Initialize user document
- GET/POST `/api/auth/google/auth` - Google OAuth flow
- GET `/api/auth/google/callback` - OAuth callback
- POST `/api/auth/google/disconnect` - Revoke Google connection
- Similar patterns for OneDrive auth

**LMS Routes (Generic):**
- GET `/api/lms/courses` - List all courses
- GET `/api/lms/assignments` - List all assignments
- GET `/api/lms/announcements` - List all announcements
- POST `/api/lms/assignments/submit` - Submit assignment
- GET `/api/lms/sync` - Sync data from all connected LMS

**Canvas-Specific Routes:**
- POST `/api/canvas/connect` - Setup Canvas connection
- GET `/api/canvas/status` - Check connection status
- GET `/api/canvas/sync` - Sync Canvas data
- POST `/api/canvas/assignments/submit` - Submit Canvas assignment
- etc.

**File Routes:**
- GET `/api/files/list` - List files
- POST `/api/files/create` - Create file
- DELETE `/api/files/delete` - Delete file
- GET `/api/files/download` - Download file
- POST `/api/files/move` - Move file
- etc.

### Code Organization Patterns
1. **Separation of Concerns:** Pages, components, utilities clearly separated
2. **Type Safety:** Full TypeScript with strict mode
3. **Composability:** Context providers nest in layout.tsx
4. **Reusability:** Context hooks (useAuth, useTheme, useLayout, useNavigation)
5. **Normalization:** LMS data normalized to common schema for multi-source support

### Performance Considerations
- ⚠️ No visible code splitting or lazy loading
- ⚠️ Large CSS object tree (lib/css.ts) loaded on every render
- ⚠️ No caching strategy visible for API responses
- ⚠️ Real-time subscriptions not visible (Firestore could use them)
- ✅ Next.js Image optimization available but not heavily used

---

## 7. MISSING CRITICAL FEATURES FOR PRODUCTION

### Error Handling & Resilience
- ❌ **Global Error Boundary** - No error.tsx files (Next.js App Router pattern)
- ❌ **Error Logging** - No error tracking service integration (Sentry, etc.)
- ❌ **Error Recovery** - No retry logic visible in API calls
- ❌ **User Feedback** - Limited error messages to users
- ❌ **Offline Support** - No offline-first or service worker strategy
- ❌ **Network Resilience** - No timeout handling or circuit breakers
- ⚠️ **API Error Handling** - Basic try/catch but inconsistent patterns

### Data Validation
- ❌ **Input Validation** - No schema validation libraries (zod, yup)
- ❌ **Form Validation** - Forms lack validation feedback
- ❌ **Data Sanitization** - HTML sanitized for display but not for storage
- ❌ **Type Safety at Endpoints** - API routes accept any JSON
- ⚠️ **Firestore Security Rules** - Not visible in repo

### Security
- ⚠️ **CSRF Protection** - Not clearly implemented
- ⚠️ **Rate Limiting** - Not visible on API endpoints
- ❌ **Input Sanitization** - Minimal validation before storage
- ❌ **API Key Rotation** - No mechanism visible
- ❌ **Secret Management** - Using .env.local (ok for dev, needs vault for prod)
- ❌ **Audit Logging** - No logging of user actions

### Performance
- ❌ **Caching Strategy** - No HTTP caching headers
- ❌ **Database Indexing** - Firestore indexes not visible
- ❌ **Query Optimization** - Bulk fetch then filter in memory
- ❌ **Code Splitting** - No dynamic imports or lazy loading
- ❌ **Image Optimization** - External images not optimized

### Testing
- ❌ **Unit Tests** - No .test.ts or .spec.ts files found
- ❌ **Integration Tests** - No testing framework configured
- ❌ **E2E Tests** - No Playwright/Cypress setup
- ❌ **Test Coverage** - 0% (no test infrastructure)

### Accessibility
- ❌ **ARIA Labels** - Minimal implementation (only 5 found)
- ❌ **Keyboard Navigation** - Not systematically implemented
- ❌ **Screen Reader Support** - Unclear, likely missing
- ❌ **Color Contrast** - No automated checking
- ❌ **Focus Management** - Especially in modals
- ❌ **Reduced Motion** - Not respected

### Monitoring & Observability
- ❌ **Application Metrics** - No APM integration
- ❌ **User Analytics** - No tracking visible (no GA, Mixpanel, etc.)
- ❌ **Performance Monitoring** - No Web Vitals integration
- ❌ **Error Tracking** - No centralized error logging
- ❌ **Logging** - Mostly console.log, no structured logging

### Operations
- ❌ **Health Checks** - No /health endpoint
- ❌ **Deployment Automation** - No CI/CD visible
- ❌ **Database Migrations** - No migration system for Firestore
- ❌ **Backup Strategy** - Not visible
- ❌ **Disaster Recovery** - Not documented
- ⚠️ **Environment Management** - Only template.env.local provided

### Data Management
- ❌ **Data Retention Policies** - No auto-cleanup
- ❌ **GDPR Compliance** - No data export/deletion features
- ❌ **Data Privacy** - No PII handling procedures
- ❌ **Encryption** - In-transit only (HTTPS), at-rest unclear

---

## 8. UI/UX GAPS

### Missing Pages/Features
1. **Settings Pages (4 stubs):**
   - `/settings/integrations` - No LMS connection UI
   - `/settings/account` - No profile/password management
   - `/settings/advanced` - No advanced configuration
   - `/settings/tasks` - No task scheduling UI

2. **Account Management:**
   - No profile editing page
   - No password change
   - No email verification flow
   - No data export/deletion (GDPR)

3. **LMS Integration Management:**
   - No connection status dashboard
   - No way to view/revoke OAuth tokens
   - No sync scheduling UI
   - No error reporting for sync failures

4. **Dashboard Customization:**
   - Limited tile types (only 5)
   - No tile library/marketplace
   - No collaborative dashboards
   - No dashboard sharing

5. **Content & Organization:**
   - No folder structure for notes
   - No tagging/categorization system
   - No favorites/stars
   - No archive/trash functionality

6. **Collaboration:**
   - Chat system exists but unclear state
   - No file sharing between students
   - No group projects
   - No comments/discussion threads

7. **Search & Discovery:**
   - `/api/search` exists but no UI
   - No global search page
   - No filters for global search
   - No search history

### Missing Interactions
- ❌ **Drag & Drop File Upload** - No visual feedback
- ❌ **Batch Operations** - No select multiple + bulk action
- ❌ **Undo/Redo** - No action reversal
- ❌ **Keyboard Shortcuts** - No command palette or shortcuts
- ❌ **Notifications** - No in-app notification center
- ❌ **Real-time Updates** - No live sync indicators

### Missing Visual Elements
- ❌ **Breadcrumbs** - No navigation path indicators
- ❌ **Progress Indicators** - No progress bars or steps
- ❌ **Spinners/Skeletons** - Basic loading only, no placeholders
- ❌ **Badges** - No status indicators (new, overdue, etc.)
- ❌ **Avatars** - No user profile pictures
- ❌ **Empty State Illustrations** - Generic icons only
- ❌ **Tooltips** - No helpful hints
- ⚠️ **Dark Mode** - Dark mode CSS exists but toggle unclear

### Usability Issues
- ⚠️ **Mobile Experience** - Responsive but tablet/landscape unclear
- ⚠️ **Print Support** - No print stylesheets
- ⚠️ **Browser Support** - No compatibility matrix
- ❌ **Offline Functionality** - No offline page caching
- ❌ **Sync Status** - No visual indication of last sync time

---

## 9. DATA & BACKEND

### Data Models

#### User Document (users/{userId})
```typescript
{
  canvasToken: string | null,
  info: {
    name: string,
    email: string,
    verificationStatus: "unverified" | "verified",
    canvasBaseUrl: string | null
  },
  timetable: {},
  data: {
    courses: [],
    assignments: [],
    files: [],
    projects: {},
    notes: {},
    tasks: {
      "lms-sync": TaskConfig,
      "timetable-sync": TaskConfig
    }
  },
  createdAt: Date
}
```

#### LMS Collections (lms/{userId}/courses, assignments, announcements)
**Course:**
```typescript
{
  id: string,
  name: string,
  html_url: string,
  image_download_url?: string,
  type: "CanvasCourse" | "ClassroomCourse"
}
```

**Assignment:**
```typescript
{
  id: string,
  title: string,
  description: string,
  courseId: string,
  courseName: string,
  dueAt: string | null,
  url: string,
  submission: boolean,
  submissionState: string,
  submittedAt: string | null,
  projects: any[],
  missing: boolean,
  updatedAt: string,
  createdAt: string
}
```

**Announcement:**
```typescript
{
  id: string,
  title: string,
  message: string,
  courseId: string,
  courseName: string,
  postedAt: string,
  url: string,
  updatedAt: string
}
```

#### Timetable Collections (timetable/{userId}/days/{date})
```typescript
{
  date: string,
  events: StandardEvent[]
}

// StandardEvent
{
  title: string,
  type: "class" | "break" | "event" | "other",
  start: ISO8601,
  end: ISO8601,
  room?: string,
  teacher?: string,
  description?: string
}
```

#### Dashboard Pages & Tiles (localStorage)
```typescript
{
  id: string,
  tiles: TileInstance[],
  panels: PanelInstance[]
}

// TileInstance
{
  id: string,
  type: string,
  x: number,
  y: number,
  w: number,
  h: number,
  props?: Record<string, any>
}
```

### Firestore Collections Structure
```
users/
├── {userId}/
│   ├── (user data)
│   └── (LMS data embedded or separate collections)

lms/
├── {userId}/
│   ├── courses/{courseId}
│   ├── assignments/{assignmentId}
│   └── announcements/{announcementId}

timetable/
├── {userId}/
│   └── days/{date}
```

### Third-Party Integrations

#### Canvas LMS API
- **Auth:** Bearer token (user-provided)
- **Base:** Custom base URL (user-provided)
- **Endpoints Used:**
  - GET `/api/v1/courses`
  - GET `/api/v1/courses/:id/assignments`
  - GET `/api/v1/courses/:id/assignments/:id/submissions/:userId`
  - POST `/api/v1/courses/:id/assignments/:id/submissions`
  - GET `/api/v1/announcements`

#### Google Classroom API
- **Auth:** OAuth 2.0 (via Google account)
- **Scopes:** classroom.courses, classroom.coursework, classroom.rosters
- **Endpoints:** courses.list, courses.courseWork.list, courseWork.studentSubmissions.list

#### Google Drive API
- **Auth:** OAuth 2.0
- **Purpose:** File operations for assignments
- **Endpoints:** files.list, files.create, files.delete, files.download

#### OneDrive/Microsoft Graph API
- **Auth:** OAuth 2.0 (Azure AD)
- **Purpose:** File storage and sharing
- **Client Credentials:** NEXT_PUBLIC_AZURE_CLIENT_ID, AZURE_CLIENT_SECRET

#### iCal/ICS
- **Format:** RFC 5545 (parsed via ical.js)
- **Sources:** URL-based or file upload
- **Optional Auth:** Basic auth for URL imports

### API Endpoints Summary
**Total: 66 API routes**

| Category | Count | Example |
|----------|-------|---------|
| Authentication | 8 | auth/google/auth, auth/onedrive/disconnect |
| Canvas LMS | 6 | canvas/sync, canvas/assignments/submit |
| Google Classroom | 5 | googleclassroom/sync, googleclassroom/assignments |
| Generic LMS | 5 | lms/assignments, lms/sync |
| Timetable | 4 | timetable/setup/ical, timetable/fetch |
| Files/OneDrive | 9 | files/list, files/create, files/download |
| Notes | 2 | notes/create, notes/update |
| Schedule | 4 | schedule/create, schedule/addElement |
| Projects | 3 | projects/create, projects/files/attach |
| Tasks | 2 | tasks/status, tasks/todo |
| Chat | 5 | chat/create, chat/send |
| Search | 1 | search/ |

---

## 10. TESTING & QUALITY ASSURANCE

### Current State
- ❌ **No Automated Tests** - 0 test files found
- ❌ **No Test Framework** - No Jest, Vitest, Playwright, Cypress
- ❌ **No Test Coverage** - No coverage tracking
- ⚠️ **Manual Testing Only** - Appears to be dev-testing during development
- ✅ **TypeScript Strict Mode** - Good compile-time checks
- ✅ **ESLint Configured** - Code quality linting
- ✅ **Prettier Configured** - Code formatting

### QA Measures Present
1. **Type Safety:**
   - TypeScript strict mode enabled
   - Type checking on all files
   - Firebase type definitions imported

2. **Code Quality:**
   - ESLint with multiple plugins (prettier, import, unused-imports)
   - Prettier auto-formatting
   - No obvious code smells

3. **API Safety:**
   - Bearer token validation on all protected routes
   - Firebase ID token verification
   - Basic input checks (required fields)

### QA Gaps
- ❌ **No Unit Testing** - Business logic untested
- ❌ **No Integration Testing** - API interactions untested
- ❌ **No E2E Testing** - User flows untested
- ❌ **No Load Testing** - Performance under load unknown
- ❌ **No Security Testing** - OWASP checks, penetration testing
- ❌ **No Accessibility Testing** - No automated a11y checks
- ❌ **No Component Testing** - No Storybook or visual testing
- ❌ **No Performance Audits** - Lighthouse not configured
- ⚠️ **No Staging Environment** - Unclear deployment strategy

### Development Experience
- ✅ TypeScript with auto-completion
- ✅ Next.js fast refresh
- ✅ Clear file organization
- ⚠️ No mock data generators
- ⚠️ No API mocking (MSW, etc.)
- ⚠️ No component preview tools

---

## SUMMARY OF CRITICAL GAPS

### High Priority (Must Have)
1. **Error Boundary & Global Error Handling** - Crashes without user feedback
2. **Input Validation** - Data integrity at risk
3. **Loading States & Skeletons** - UX feels slow/unresponsive
4. **Settings Pages Implementation** - Essential user features missing
5. **API Error Recovery** - Network failures cause silent failures

### Medium Priority (Should Have)
6. **Accessibility (WCAG 2.1 AA)** - Compliance & inclusivity
7. **Form Validation & Feedback** - UX clarity
8. **Search UI** - API exists but not exposed
9. **Unit Tests** - Code reliability
10. **Offline Support** - Mobile resilience

### Low Priority (Nice to Have)
11. **UI Components Library** - Reduce duplication
12. **Analytics** - User insights
13. **Performance Optimization** - Speed improvements
14. **E2E Tests** - Full user flow testing
15. **Documentation** - Developer onboarding

