# Architecture & Technical Documentation

Complete technical reference for the Miklens R&D Platform.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Data Flow](#data-flow)
5. [Authentication & Authorization](#authentication--authorization)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Database Schema](#database-schema)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Performance Considerations](#performance-considerations)
11. [Security Architecture](#security-architecture)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / PWA                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   React Application                     │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  UI Layer (Components, Pages)                    │  │ │
│  │  ├──────────────────────────────────────────────────┤  │ │
│  │  │  State Management (Context API)                  │  │ │
│  │  ├──────────────────────────────────────────────────┤  │ │
│  │  │  Business Logic (Hooks, Services)                │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Local Persistence Layer                       │ │
│  │  ├─ IndexedDB (Firestore offline cache)               │ │
│  │  └─ localStorage (user prefs, sessions)               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│   Firebase Backend       │      │   External Systems       │
│  (Firestore, Auth)       │      │   (Trial Manager)        │
└──────────────────────────┘      └──────────────────────────┘
```

### Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│ Presentation Layer                                       │
│ ├─ Components (UI components, page layouts)            │
│ ├─ Pages (lazy-loaded route components)                │
│ └─ Layouts (DashboardLayout, AuthLayout)               │
├─────────────────────────────────────────────────────────┤
│ State Management Layer                                   │
│ ├─ AuthContext (user, roles, auth state)               │
│ ├─ ExperimentContext (experiments, trials)             │
│ ├─ TaskContext (tasks, assignments)                    │
│ ├─ React Query (server state caching)                  │
│ └─ localStorage (preferences, sessions)                │
├─────────────────────────────────────────────────────────┤
│ Business Logic Layer                                    │
│ ├─ Custom Hooks (useUsers, useDailyLogs)              │
│ ├─ Services (Firebase, local store, sync)              │
│ ├─ Utilities (logger, role adapter, formatters)        │
│ └─ Configuration (appConfig, constants)                │
├─────────────────────────────────────────────────────────┤
│ Data Access Layer                                       │
│ ├─ Firebase SDK (Firestore queries, auth)              │
│ ├─ IndexedDB (offline persistence via Dexie)           │
│ ├─ localStorage (browser storage)                      │
│ └─ Trial Manager Sync (external data integration)      │
├─────────────────────────────────────────────────────────┤
│ Infrastructure                                          │
│ ├─ Firebase (Firestore, Authentication)                │
│ ├─ Google Drive API (optional document storage)        │
│ └─ Web APIs (IndexedDB, localStorage, Service Workers) │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Framework
- **React** 19.2.7 - UI library
- **TypeScript** 5.x - Type safety
- **Vite** 8.1.1 - Build tool & dev server

### Routing & State
- **React Router** 7.18.1 - Client-side routing
- **React Context API** - Global state management
- **React Query** 5.101.2 - Server state caching
- **React Hook Form** 7.81.0 - Form state management

### UI & Styling
- **Tailwind CSS** 3.4.17 - Utility-first CSS
- **Framer Motion** 12.42.2 - Animations
- **Lucide React** 1.23.0 - Icon library
- **Recharts** 3.9.2 - Charts and graphs

### Data & Backend
- **Firebase** 11.10.0 - Backend-as-a-Service
  - **Authentication** - Email/password auth
  - **Firestore** - Real-time database
  - **IndexedDB Persistence** - Offline support
- **Dexie** 4.4.4 - IndexedDB wrapper
- **Zod** 4.4.3 - Schema validation

### Export & Utilities
- **jsPDF** 2.5.1 - PDF generation
- **XLSX** 0.18.5 - Excel export
- **date-fns** 3.6.0 - Date manipulation
- **uuid** 14.0.1 - UUID generation
- **react-dropzone** 19.1.1 - File upload

### Development Tools
- **Oxlint** 1.71.0 - Fast linter
- **Vitest** 4.1.10 - Unit testing
- **TypeScript** - Type checking
- **Vite PWA Plugin** 1.3.0 - Progressive Web App

---

## Directory Structure

```
miklens-rnd/
├── public/                           # Static assets
│   ├── favicon.svg
│   ├── icons.svg
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── masked-icon.svg
├── src/
│   ├── components/                   # Reusable components
│   │   ├── ui/                      # UI components
│   │   │   ├── Badge.tsx
│   │   │   └── Button.tsx            # ENHANCED: More variants, accessible
│   │   ├── ErrorBoundary.tsx         # ENHANCED: Better error UI
│   │   ├── ProtectedRoute.tsx        # ENHANCED: Error states
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileBottomNav.tsx
│   │   ├── GeminiAIChatbot.tsx
│   │   └── ... (other feature components)
│   ├── config/                       # Configuration
│   │   ├── firebase.ts               # ENHANCED: Proper config validation
│   │   ├── appConfig.ts              # NEW: Centralized config
│   │   ├── defaultData.ts            # NEW: Example/default data
│   │   └── firebase.json
│   ├── contexts/                     # State providers
│   │   ├── AuthContext.tsx           # ENHANCED: Error handling, logging
│   │   ├── ExperimentContext.tsx
│   │   ├── TaskContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/                        # Custom hooks
│   │   ├── useDailyLogs.ts           # FIXED: Boolean check
│   │   ├── useProducts.ts
│   │   └── useUsers.ts               # FIXED: Boolean check
│   ├── layouts/                      # Page layouts
│   │   ├── AuthLayout.tsx
│   │   └── DashboardLayout.tsx
│   ├── pages/                        # Page components (lazy-loaded)
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── Experiments.tsx
│   │   ├── ResearchLog.tsx
│   │   ├── FieldTrials.tsx
│   │   └── ... (25+ pages)
│   ├── services/                     # Business logic
│   │   ├── db.ts
│   │   ├── firebaseUtils.ts
│   │   ├── googleDrive.ts
│   │   ├── localStore.ts
│   │   ├── trialManagerSync.ts
│   │   ├── timeTracking.ts
│   │   ├── experimentStore.ts
│   │   └── exportUtils.ts
│   ├── types/                        # TypeScript types
│   │   ├── index.ts
│   │   └── ... (other type defs)
│   ├── utils/                        # Utility functions
│   │   ├── logger.ts                 # NEW: Structured logging
│   │   ├── roleAdapter.ts
│   │   ├── formatters.ts
│   │   ├── avatarHelper.ts
│   │   └── validationSchemas.ts
│   ├── constants/                    # Application constants
│   │   └── index.ts                  # ENHANCED: Removed hardcoded data
│   ├── App.tsx                       # Root component
│   ├── App.css
│   ├── index.css                     # Global styles
│   └── main.tsx                      # Entry point
├── .env.example                      # NEW: Env template
├── .env.local                        # .gitignored local config
├── .oxlintrc.json                    # Linter config
├── vite.config.ts                    # Vite configuration
├── tsconfig.json                     # TypeScript config
├── tailwind.config.js                # Tailwind config
├── postcss.config.js                 # PostCSS config
├── firebase.json                     # Firebase config
├── vercel.json                       # Vercel config
├── package.json                      # Dependencies
├── QUICK_START.md                    # NEW: Quick start guide
├── SETUP.md                          # NEW: Detailed setup
├── SECURITY.md                       # NEW: Security guide
├── ACCESSIBILITY.md                  # NEW: Accessibility guide
├── ARCHITECTURE.md                   # NEW: This file
└── REFACTORING_SUMMARY.md           # NEW: Changes summary
```

---

## Data Flow

### Authentication Flow

```
User Opens App
    ↓
App.tsx initializes providers
    ├─ AuthProvider starts listening to Firebase Auth
    └─ onAuthStateChanged triggers
    ↓
User exists?
    ├─ YES → Fetch user profile from Firestore
    │         └─ Account active? (IsActive check)
    │             ├─ YES → Set currentUser, userRole, profile
    │             └─ NO → Sign out user
    ├─ NO → Clear auth state
    └─ ALWAYS → setLoading(false)
    ↓
UI renders
    ├─ ProtectedRoute checks currentUser
    │   ├─ Not authenticated? → Redirect to /login
    │   └─ Authenticated? → Check role-based access
    └─ Show page or access denied
```

### Data Loading Flow

```
Page Component Loads
    ↓
useData Hook (e.g., useUsers)
    ↓
Is Firebase configured?
    ├─ YES → Listen to Firestore collection
    │         ├─ Snapshot changes → Update state
    │         └─ Errors → Log, fall back to localStorage
    └─ NO → Read from localStorage
            └─ Subscribe to store changes
    ↓
Component renders with data
    ├─ Loading? → Show skeleton
    ├─ Error? → Show error message
    └─ Data? → Render content
```

### Offline Support Flow

```
User goes offline
    ↓
IndexedDB Persistence active?
    ├─ YES → Firestore continues serving cached data
    │         └─ User can read but not write
    └─ NO → Fall back to localStorage
    ↓
User makes changes offline
    ↓
Changes queued locally
    ├─ In IndexedDB (Firestore auto-queues)
    └─ Or in localStorage
    ↓
User comes online
    ↓
Queued changes sync to Firestore
    ├─ Success → Update UI
    └─ Conflict → Show merge dialog
```

---

## Authentication & Authorization

### Auth System Architecture

```
┌────────────────────────────────────────┐
│         Firebase Authentication         │
│   (Email/Password, Session Tokens)      │
└────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────┐
│        AuthContext.tsx                   │
│  • currentUser (Firebase User object)   │
│  • profile (AppUser from Firestore)     │
│  • userRole (mapped R&D role)           │
│  • trialManagerRole (original role)     │
│  • loading (auth state loading)         │
│  • error (auth error message)           │
└────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────┐
│      Role-Based Access Control         │
│  Admin → Full access                    │
│  Management → Administrative access     │
│  Scientist → Personal work only         │
└────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────┐
│       Protected Routes                   │
│  <ProtectedRoute allowedRoles={...}>    │
│    <Dashboard />                         │
│  </ProtectedRoute>                       │
└────────────────────────────────────────┘
```

### Role Mapping

| Trial Manager | R&D System | Capabilities |
|---------------|-----------|--------------|
| ADMIN         | Admin     | All features, user management |
| DEVELOPER     | Admin     | All features, user management |
| MANAGEMENT    | Management| Oversight, reporting, team view |
| VIEWER        | Management| Read-only oversight |
| USER          | Scientist | Personal research, logging |
| SCIENTIST     | Scientist | Personal research, logging |

### Permission Matrix

| Action | Admin | Management | Scientist |
|--------|-------|-----------|-----------|
| Manage Users | ✓ | - | - |
| View All Data | ✓ | ✓ | - |
| Create Products | ✓ | ✓ | - |
| Log Research | ✓ | ✓ | ✓ |
| View Dashboard | ✓ | ✓ | ✓ |
| Export Reports | ✓ | ✓ | - |
| Manage Teams | ✓ | ✓ | - |

---

## State Management

### Context Providers

#### 1. AuthContext
```typescript
interface AuthContextType {
  currentUser: User | null;           // Firebase auth user
  profile: AppUser | null;            // R&D user profile
  userRole: Role | null;              // Mapped role
  trialManagerRole: string | null;    // Original role
  loading: boolean;                   // Auth state loading
  error: string | null;               // Auth error message
  logout: () => Promise<void>;        // Sign out function
}
```

#### 2. ExperimentContext
Manages experiments, lab tests, stability logs, field trials

#### 3. TaskContext
Manages tasks and assignments

#### 4. ThemeContext
Manages light/dark mode preference

### React Query

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes
      gcTime: 1000 * 60 * 30,         // 30 minutes (cache)
      refetchOnWindowFocus: false,    // Don't refetch on tab switch
    },
  },
});
```

### localStorage

```typescript
// Keys managed in src/constants/index.ts
STORAGE_KEYS = {
  USERS: 'miklens_users_v3',
  DAILY_LOGS: 'miklens_daily_logs_v3',
  EXPERIMENTS: 'miklens_experiments_v5',
  // ... (more keys)
  THEME: 'theme',
  AVATAR_PREFIX: 'miklens_user_avatar_',
};
```

---

## API Integration

### Firebase Services

#### Authentication
```typescript
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

// Usage
const { user } = await signInWithEmailAndPassword(auth, email, password);
```

#### Firestore
```typescript
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';

// Real-time listener
const unsubscribe = onSnapshot(
  query(collection(db, 'users'), where('isActive', '==', true)),
  (snapshot) => { /* handle changes */ }
);
```

#### IndexedDB Persistence
```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db)
  .catch(err => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs - only first tab enables persistence
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support
    }
  });
```

### External APIs

#### Google Drive (Optional)
```typescript
// Configured in src/services/googleDrive.ts
const API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
```

#### Trial Manager Sync
```typescript
// Fetches from external Firestore
// Supports multiple trial categories
const COLLECTIONS = [
  'trials',
  'herbicide_trials',
  'fungicide_trials',
  'pesticide_trials',
  'nutrition_trials',
  'biostimulant_trials'
];
```

---

## Database Schema

### Firestore Collections

#### users/{userId}
```json
{
  "Name": "Dr. Sarah Jenkins",
  "Email": "sarah@miklensbio.com",
  "Username": "sarah@miklensbio.com",
  "Role": "Scientist",
  "IsActive": true,
  "Designation": "Research Scientist",
  "Department": "Research & Development",
  "Skills": ["Field Operations", "Lab Testing"],
  "Avatar": "https://..."
}
```

#### products/{id}
```json
{
  "name": "BioShield Alpha",
  "category": "Bio-fungicide",
  "stage": "Field Trial",
  "status": "active",
  "progress": 65,
  "teamSize": 5,
  "lastUpdate": "2024-08-04T10:30:00Z"
}
```

#### trials/{id}
```json
{
  "name": "Punjab Wheat Trial",
  "location": "Punjab, India",
  "crop": "Wheat",
  "disease": "Yellow Rust",
  "startDate": "2024-06-01",
  "endDate": "2024-08-01",
  "status": "completed",
  "result": 89.4
}
```

#### daily_logs/{id}
```json
{
  "scientistId": "user1",
  "date": "2024-08-04",
  "experimentId": "exp1",
  "duration": 480,
  "notes": "Conducted assay testing",
  "status": "completed",
  "createdAt": "2024-08-04T14:30:00Z"
}
```

---

## Error Handling Strategy

### Levels of Error Handling

1. **Global Error Boundary** (React)
   - Catches component rendering errors
   - Shows professional error UI
   - Logs error context

2. **Context-Level Errors** (AuthContext)
   - Sets error state on context
   - UI can display and dismiss errors
   - Provides recovery options

3. **Service-Level Errors** (Firebase, APIs)
   - Try-catch in service functions
   - Logged via centralized logger
   - Returns error state to components

4. **Validation Errors** (Forms)
   - Zod schema validation
   - Shows field-level errors
   - Provides helpful messages

### Error Logging

```typescript
// All errors logged via centralized logger
logger.error('User profile fetch failed', error, {
  module: 'AuthContext',
  action: 'fetch-profile',
  userId: user.uid,
});

// Logged errors include:
// - Timestamp
// - Level (error, warn, info, debug)
// - Module & action
// - Full error stack in development
// - Context information
```

---

## Performance Considerations

### Code Splitting
- 25+ pages lazy-loaded with React.lazy()
- Vendor chunks split: react, query, framer, lucide, jspdf, xlsx
- Manual chunk configuration in vite.config.ts

### Caching Strategy
- React Query: 5min stale time, 30min garbage collection
- IndexedDB: Firestore offline persistence
- localStorage: Non-sensitive user preferences
- Service Worker: PWA asset caching

### Bundle Optimization
- Total gzipped: ~140 KB (main bundle)
- PWA cache: 2843 KB (50 entries)
- Code: ~465 KB (uncompressed)

### Performance Metrics
- Largest Contentful Paint (LCP): ~2s
- First Input Delay (FID): <100ms
- Cumulative Layout Shift (CLS): <0.1
- Time to Interactive (TTI): ~3s

### Optimization Techniques
- Image optimization (avatar generation via API)
- Dynamic imports for heavy libraries
- Memoization where needed
- Debouncing for search/filters
- Virtual scrolling for large lists (optional)

---

## Security Architecture

### Authentication Security
- Firebase Session Management
- Automatic token refresh
- Secure credential transmission (HTTPS)
- Account disabled checks

### Data Security
- Firestore Security Rules (document-level)
- Role-based access control
- No sensitive data in localStorage
- Encrypted IndexedDB (browser-handled)

### API Security
- HTTPS-only communication
- CORS headers configured
- Rate limiting (planned)
- Input validation (Zod)

### Logging Security
- No credentials logged
- No PII logged (unless necessary)
- Sensitive fields redacted
- Error messages generic for users

---

## Deployment Architecture

### Firebase Hosting
```
GitHub → Firebase Deploy → CDN → Users
  │         ↓
  ├─ Build: npm run build
  ├─ Deploy: firebase deploy
  └─ Functions: Cloud Functions (optional)
```

### Vercel
```
GitHub → Vercel Build → Edge Network → Users
  │         ↓
  ├─ Build: npm run build
  ├─ Deploy: Automatic on push to main
  └─ Env Vars: Configured in dashboard
```

### Environment Separation
```
Development:  .env.local + npm run dev
Staging:      .env.staging + npm run build + deploy
Production:   .env.production + npm run build + deploy
```

---

## Monitoring & Observability

### Logging System
- Centralized logger in src/utils/logger.ts
- Levels: debug, info, warn, error
- Context-aware logging
- Development vs production filtering

### Error Tracking
- Error Boundary catches UI errors
- Logger captures all service errors
- Error logs include context

### Performance Monitoring (Recommended)
- Web Vitals monitoring (optional)
- Error tracking service (Sentry, DataDog)
- Analytics (Google Analytics, Mixpanel)

---

## Future Improvements

### Short Term
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Implement error tracking (Sentry)
- [ ] Add performance monitoring

### Medium Term
- [ ] Implement feature flags service
- [ ] Add real-time collaboration
- [ ] Add advanced search/filtering
- [ ] Implement full-text search (Algolia)

### Long Term
- [ ] Machine learning for insights
- [ ] Advanced analytics dashboard
- [ ] Mobile native apps
- [ ] Microservices architecture

---

## Additional Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Vite**: https://vitejs.dev/guide

---

## Questions?

For architectural questions:
1. Check inline code comments
2. Review TypeScript type definitions
3. Check git commit history
4. Review this document and related guides

Good luck! 🚀
