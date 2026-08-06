# 🧪 Miklens R&D Management — Complete Project Knowledge Document

> **Purpose:** This document is for any AI assistant (or human developer) who joins this project.
> Read this file first — it explains everything about both apps, how they connect, and all critical rules.
> Last updated: 2026-08-06

---

## 1. PROJECT OVERVIEW

**Miklens R&D Management** is a **React + Vite + TypeScript** web application deployed on **Vercel**.

It is an internal research management platform for **Miklens** — an agricultural R&D company that develops and field-tests crop protection formulations (herbicides, fungicides, pesticides, nutrition products, biostimulants).

**Live URL:** `https://miklens-r-d-management.vercel.app`
**GitHub Repo:** `https://github.com/Miklens/Miklens-R-D-Management`
**Branch:** `main` (auto-deploys to Vercel on every push)

---

## 2. THE TWO APPS — HOW THEY RELATE

### App 1: Miklens Trial Manager (External)
- **What it is:** A **separate** mobile/web application used by field scientists to record real field trial data on-site.
- **Firebase Project:** Has its **own separate Firebase project** (separate from R&D Management).
- **Firestore Collections it owns:**
  - `trials` (legacy herbicide)
  - `herbicide_trials`
  - `fungicide_trials`
  - `pesticide_trials`
  - `nutrition_trials`
  - `biostimulant_trials`
  - `users` (field scientists and their roles)
  - `projects` (trial groupings)
  - `formulations` (product formulas being tested)
- **Who uses it:** Field scientists on tablets/phones at farm locations, recording GPS, crop observations, weed pressure, treatment applications, photo evidence.
- **Key Firestore fields per trial document:**
  ```
  Title, Crop, Weed/Target Pest, Treatment, Category, Status,
  ScientistName/AssignedTo/AssignedEmail, ProjectId, FormulationId,
  Latitude, Longitude, Area, Date, Observations, Photos (Google Drive URLs),
  Layout (CRD/RCBD), Replications, IsCompleted
  ```

### App 2: Miklens R&D Management (This App)
- **What it is:** The **management dashboard** — pulls data FROM Trial Manager to show to management and R&D scientists.
- **Firebase Project:** Has its **own separate Firebase** for R&D-specific data (daily logs, tasks, etc.).
- **Firestore Collections it owns:**
  - `rnd_daily_logs` — Scientist daily work sessions
  - `users` (R&D app users — synced from Trial Manager's users collection)

### The Critical Link: `trialManagerSync.ts`

The bridge between the two apps is **`src/services/trialManagerSync.ts`**.

**How it works:**
1. The user saves their **Trial Manager Firebase credentials** in R&D Management Settings → stored in `localStorage` as `miklens_rnd_firebase_config_v1`
2. When user clicks **"Sync Live Data"** on the Experiments/Trial Sync page (`/trial-sync`), `trialManagerSync.ts`:
   - Initializes a **second Firebase app instance** pointing to Trial Manager's Firebase project
   - Authenticates using the stored email/password credentials
   - Reads all trial collections (up to 500 docs each across all 6 collections)
   - Also reads the `users` collection to sync scientist directory
   - Maps raw Firestore data to internal `ExternalFieldTrial` objects
   - Stores synced data in **browser IndexedDB** (via Dexie.js) + **localStorage** as backup
3. All R&D Management pages then call `getSyncedTrials()`, `getSyncedProjects()`, `getSyncedFormulations()` to read this cached data

**Key exported functions from `trialManagerSync.ts`:**
```typescript
getSyncedTrials()                      // ExternalFieldTrial[] from IndexedDB/localStorage
getSyncedProjects()                    // ExternalProject[]
getSyncedFormulations()                // ExternalFormulation[]
fetchTrialsFromFirebaseCloud(config)   // Live pull from Trial Manager Firebase
fetchTrialsFromDexie()                 // Read cached local IndexedDB data
saveSyncedTrials(trials)               // Save to IndexedDB + localStorage
getSavedFirebaseConfig()               // FirebaseConnectionConfig | null
saveFirebaseConfig(config)             // Save credentials to localStorage
```

---

## 3. TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (dark mode supported) |
| State Management | React Context API (AuthContext, ExperimentContext, TaskContext) |
| Server State | TanStack React Query (5-min cache, 30-min GC) |
| Database (R&D own) | Firebase Firestore (own project) |
| Database (Trial Mgr) | Firebase Firestore (separate project, read-only via sync) |
| Auth | Firebase Authentication (Email/Password + Google) |
| Local Cache | IndexedDB via Dexie.js + localStorage fallback |
| AI Features | Google Gemini API (10 API keys with automatic rotation) |
| Deployment | Vercel (auto-deploy from `main` branch) |
| Charts | Recharts |
| PDF Export | jsPDF + jsPDF-AutoTable |
| Icons | Lucide React |
| Animations | Framer Motion |
| Date Handling | date-fns |

---

## 4. FIREBASE PROJECTS — TWO SEPARATE INSTANCES

### R&D Management Firebase (Primary)
- Config loaded from **Vercel environment variables**:
  ```
  VITE_FIREBASE_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN
  VITE_FIREBASE_PROJECT_ID
  VITE_FIREBASE_STORAGE_BUCKET
  VITE_FIREBASE_MESSAGING_SENDER_ID
  VITE_FIREBASE_APP_ID
  ```
- Used for: User authentication, daily log storage (`rnd_daily_logs`)
- Initialized in: `src/config/firebase.ts`

### Trial Manager Firebase (Secondary — read-only)
- Config stored by user at runtime in `localStorage` key: `miklens_rnd_firebase_config_v1`
- Dynamically initialized when user clicks "Sync Live Data"
- **NEVER stored in code or env variables** — user enters credentials in UI
- Initialized in: `src/services/trialManagerSync.ts`

---

## 5. DATA STORAGE LAYERS

| Data | Storage | Key/Collection | Version Notes |
|------|---------|---------------|---------------|
| Synced trials (from Trial Mgr) | IndexedDB (Dexie) + localStorage | `miklens_rnd_synced_trials_v1` | Cached after each sync |
| Daily research logs | Firestore `rnd_daily_logs` + localStorage | `miklens_daily_logs_v4` | v4 cleared stale BioShield data |
| Experiment records | localStorage | `miklens_experiments_v5` | v5 cleared demo seeds |
| Lab test records | localStorage | `miklens_lab_tests_v5` | |
| Stability logs | localStorage | `miklens_stability_v5` | |
| Field trial records | localStorage | `miklens_field_trials_v5` | |
| Observations | localStorage | `miklens_observations_v5` | |
| Users (R&D app) | localStorage | `miklens_users_v4` | Synced from Trial Manager users |
| Trial Mgr Firebase config | localStorage | `miklens_rnd_firebase_config_v1` | User-entered credentials |

**Key Rule about localStorage versioning:** When bumping a version (e.g., v3 → v4), always add `localStorage.removeItem('old_key')` in the store file to force a clean slate on all users' browsers. Never change version numbers arbitrarily.

---

## 6. GLOBAL STATE CONTEXTS

### `AuthContext` (`src/contexts/AuthContext.tsx`)
- Provides: `currentUser` (Firebase Auth), `profile` (AppUser with role), `signIn()`, `signOut()`
- `profile.role` is one of: `'Admin'` | `'Scientist'` | `'Management'`
- Role controls route access

### `ExperimentContext` (`src/contexts/ExperimentContext.tsx`)
- Provides all R&D science records:
  - `experiments: ExperimentItem[]`
  - `labTests: LabTestItem[]`
  - `stabilityLogs: StabilityLogItem[]`
  - `fieldTrials: FieldTrialItem[]`
  - `observations: ObservationItem[]`
  - `allProducts: string[]` — **derived ONLY from real user-entered product names**
- Persisted to localStorage via `experimentStore.ts`
- **CRITICAL:** `allProducts` must NEVER have hardcoded/seeded product names

### `TaskContext` (`src/contexts/TaskContext.tsx`)
- Manages task assignments across the app

---

## 7. ROUTING & ROLE ACCESS

```
PUBLIC
  /login                 → Login page

ALL LOGGED-IN USERS
  /                      → Dashboard (ScientistHub)
  /products              → Product Portfolio
  /profile               → Own Employee Profile
  /profile/:userId       → Any Employee Profile
  /projects              → Projects
  /documents             → Documents
  /calendar              → Calendar
  /ai-insights           → Gemini AI Chat
  /notifications         → Notifications
  /time-motion           → Time & Motion Analysis
  /settings              → Settings
  /analytics             → Analytics & Efficacy

ADMIN + SCIENTIST ONLY
  /experiments           → Experiments & Testing (shows synced trial data)
  /research-log          → Daily Research Log
  /trial-sync            → Trial Manager Sync (connect + sync button)
  /tasks                 → Tasks

ADMIN + MANAGEMENT ONLY
  /employees             → Employee Management
  /reports               → Team Activity Reports
  /team-activity         → Team Activity
  /diagnostics           → System Diagnostics

ADMIN ONLY
  /audit-logs            → Audit Logs
```

---

## 8. KEY SERVICES (File-by-File)

### `src/services/trialManagerSync.ts` (29KB — most important)
- Core sync engine between Trial Manager Firebase and this app
- `fetchTrialsFromFirebaseCloud()` — authenticates + reads all 6 trial collections
- Also syncs `users` collection → merges into R&D user directory
- Converts Google Drive photo URLs to embeddable `lh3.googleusercontent.com` format
- Falls back to local Dexie IndexedDB if Firebase unavailable

### `src/services/localStore.ts`
- Manages `DailyLog[]` and `AppUser[]`
- **Dual-write:** writes to localStorage AND Firestore `rnd_daily_logs`
- FIXED BUG: After `addLog`, the Firestore doc ID is synced back to localStorage (so `deleteLog` works with correct Firestore ID)
- `deleteLog(id)`: removes from localStorage AND `deleteDoc` from Firestore (no ID prefix guards)
- Current keys: `miklens_users_v4`, `miklens_daily_logs_v4`

### `src/services/experimentStore.ts`
- CRUD for experiments, lab tests, stability logs, field trials, observations
- All seeds are empty arrays — no hardcoded demo data
- Keys: `miklens_experiments_v5`, `miklens_lab_tests_v5`, `miklens_stability_v5`, `miklens_field_trials_v5`, `miklens_observations_v5`

### `src/services/unifiedActivity.ts`
- Aggregates activities across multiple data sources into a unified format
- Generates `WeeklySummary` and `aiWeeklySummary` text for dashboard
- AI summary text: shows only numeric data (hours, counts) — does NOT include product/project names

### `src/services/executiveAnalytics.ts`
- Generates executive-level reports and KPIs for management
- Used in TeamActivity and Reports pages

### `src/hooks/useDailyLogs.ts`
- Real-time Firestore listener: `onSnapshot(rnd_daily_logs)` when Firebase configured
- Falls back to localStorage store when Firebase not configured
- Used by: Dashboard (ScientistHub), ResearchLog, TeamActivity

---

## 9. DATA FLOW — COMPLETE DIAGRAMS

### A. Trial Manager → R&D Management

```
Field Scientist (on-site)
  → Records trial in Miklens Trial Manager app
  → Saves to Trial Manager Firebase (own project)
     Collections: trials / herbicide_trials / fungicide_trials /
                  pesticide_trials / nutrition_trials / biostimulant_trials

R&D Manager or Scientist (in office)
  → Opens Miklens R&D Management app
  → Goes to /trial-sync
  → Clicks "Sync Live Data"
  → trialManagerSync.ts runs:
       1. initializeApp(trialManagerConfig)  ← second Firebase instance
       2. signInWithEmailAndPassword(...)    ← authenticate to Trial Mgr
       3. getDocs(query(collection, limit(500)))  ← read all 6 collections
       4. getDocs(users collection)          ← sync scientist directory
       5. Map data → ExternalFieldTrial[]
       6. saveSyncedTrials()                 ← Dexie IndexedDB + localStorage
  → All pages now call getSyncedTrials() to read cached data

Pages that consume synced trial data:
  - Experiments.tsx         → shows live trial cards with photos/GPS/status
  - Dashboard.tsx           → project counts, recent trial activity
  - Projects.tsx            → project list from getSyncedProjects()
  - Documents.tsx           → product names from getSyncedTrials()
  - TeamActivity.tsx        → audit feed from synced trials
  - Analytics.tsx           → efficacy charts and comparisons
  - AuditLogs.tsx           → work log feed
  - Employees.tsx           → scientist list from getUsers() (synced)
```

### B. Scientist Daily Log

```
Scientist → /research-log (ResearchLog.tsx)
  → Selects date, work type, product scope, time range
  → Submits form
  → addLog() in localStore.ts:
       1. Write to localStorage (miklens_daily_logs_v4)
       2. addDoc to Firestore rnd_daily_logs (async)
       3. After Firestore resolves: update local ID → Firestore doc ID

Dashboard (/  → ScientistHub.tsx)
  → useDailyLogs() hook: onSnapshot(rnd_daily_logs)
  → Filters logs: date === today (NO historical fallback)
  → Computes weekly stats (field/lab/office hours)
  → Generates AI Weekly Summary (numeric only, no product names)
  → Shows "No activities logged today" if today has no sessions

ResearchLog.tsx (right panel)
  → useDailyLogs() same Firestore stream
  → logsOnDate = sessions for selected date
  → pastLogs = sessions from other dates (collapsible "Past Sessions")
  → "Delete All (N)" button → deletes ALL user's sessions from Firestore
  → Individual delete buttons per session

deleteLog(id) in localStore.ts:
  → localStorage.filter(l => l.id !== id)
  → deleteDoc(doc(db, 'rnd_daily_logs', id))  ← always hits Firestore
```

---

## 10. HARDCODED DATA POLICY — STRICT RULES

### FORBIDDEN — Never add these strings back to code:
```
'BioShield Alpha (Bio-fungicide)'
'BioShield Alpha'
'BioShield Efficacy & Heat Stability Assay #101'
'Dr. Sarah Jenkins'
'Maize Pre-Emergent Trial' (as a hardcoded default, OK as a placeholder example)
```

### FORBIDDEN patterns:
```typescript
// WRONG — hardcoded product in allProducts
set.add('BioShield Alpha (Bio-fungicide)');

// WRONG — hardcoded option in dropdown
<option value="BioShield Alpha (Bio-fungicide)">BioShield Alpha</option>

// WRONG — hardcoded fallback string
productName: 'BioShield Alpha'

// WRONG — in AI summary text
`Active progress registered on: ${productNames.join(', ')}`
```

### CORRECT patterns:
```typescript
// CORRECT — dynamic from real user data
const { allProducts } = useExperiments();
allProducts.map(p => <option key={p} value={p}>{p}</option>)

// CORRECT — dynamic from synced trials
const syncedFormulations = getSyncedFormulations();
const productOptions = syncedFormulations.length > 0
  ? syncedFormulations.map(f => f.name)
  : ['Active Formulation'];  // Generic placeholder only

// CORRECT — AI summary: no product names
`This week you recorded ${hours}h across ${count} sessions.`
```

---

## 11. IMPORTANT BUGS FIXED (Reference History)

| Bug Description | Root Cause | Fix Applied |
|-----------------|-----------|-------------|
| Dashboard showed old BioShield sessions in "Today's Activities" | `scientistLogs.slice(0, 8)` fallback when no today logs | Removed fallback — now shows empty state |
| `deleteLog` never deleted from Firestore | `!id.startsWith('log-')` guard blocked Firestore deleteDoc | Removed guard — always call `deleteDoc` |
| ResearchLog couldn't see/delete Firestore sessions | Read from localStorage only (cleared by v4 bump) | Switched to `useDailyLogs()` Firestore hook |
| AI Weekly Summary showed "BioShield Alpha (Bio-fungicide)" | `activeScopes` list included parsed session product names | Removed `activeScopes` from summary text |
| `addLog` Firestore ID not synced back to localStorage | After `addDoc`, local ID remained as `log-timestamp` | `.then(docRef => update local ID to docRef.id)` |
| TS2339: `l.productName` on DailyLog type | `DailyLog` has no `productName` field | Removed invalid property access |
| TS2304/TS2367 multiple TypeScript errors | Wrong object property paths, type mismatches | Fixed across AuditLogs, Analytics, Observations, StabilityTracker |
| Build failed on Vercel (multiple times) | TypeScript errors in changed files | Fixed each error before pushing |

---

## 12. AI INTEGRATION

### Multi-Key Rotation System (`AIInsights.tsx`)
- **10 Gemini API keys** configured (VITE_GEMINI_API_KEY_1 through _10)
- When a key returns 429 (quota exhausted), automatically switches to next key
- Designed for low token consumption — concise system prompts

### Gemini Models Used (Rotated for variety/cost balance)
```
gemini-2.0-flash
gemini-2.0-flash-lite
gemini-1.5-flash
gemini-1.5-flash-8b
gemini-1.5-pro
gemini-pro
gemini-2.0-flash-exp
gemini-2.0-flash-thinking-exp-01-21
```

### Floating Chatbot Widget (`GeminiAIChatbot.tsx`)
- Always visible on all pages
- Context-aware prompt suggestions based on current page

---

## 13. EMPLOYEE / SCIENTIST SYSTEM

- **Users are synced FROM Trial Manager** — NOT created in R&D app directly
- On sync, `trialManagerSync.ts` reads `users` collection from Trial Manager Firebase
- Maps to `AppUser` and merges into `miklens_users_v4` localStorage
- Role mapping: Trial Manager `Admin` → `'Admin'`, else `'Scientist'`

### AppUser Type
```typescript
interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Scientist' | 'Management';
  designation: string;
  department: string;
  skills: string[];
  avatar: string;
  isActive: boolean;
}
```

### Key Pages
- `Employees.tsx` — Management view, PDF exports, performance overview
- `EmployeeProfile.tsx` — Full profile, skill radar chart, work history, PDF report generator

---

## 14. BUILT-IN SCIENTIFIC TOOLS

> Note: RCBD Plot Randomizer, CIPAC Shelf-Life Calculator, and 4PL Dose-Response Calculator are in the **Trial Manager app** — do NOT add duplicates here.

### In R&D Management:
- **Experiment Tracking** — CRUD for lab experiments with scientific outcomes
- **Lab Test Results** — Pass/fail verdicts, active ingredient assays
- **Stability Tracker** — CIPAC stability log tracking with temperature chambers
- **Observations** — Field/lab observations linked to experiments
- **Analytics** — Efficacy charts (dose-response curves, comparative analysis, dose-response overview)

---

## 15. FILE STRUCTURE MAP

```
src/
├── App.tsx                          ← Routes + global providers + lazy loading
├── main.tsx                         ← React entry point
├── contexts/
│   ├── AuthContext.tsx              ← Firebase Auth, AppUser profile, roles
│   ├── ExperimentContext.tsx        ← All R&D science data + allProducts
│   └── TaskContext.tsx              ← Task management global state
├── services/
│   ├── trialManagerSync.ts         ← THE BRIDGE to Trial Manager Firebase (29KB)
│   ├── localStore.ts               ← Daily logs + users (Firebase + localStorage)
│   ├── experimentStore.ts          ← Experiment CRUD (localStorage only, empty seeds)
│   ├── taskStore.ts                ← Task CRUD
│   ├── unifiedActivity.ts          ← Activity aggregation for dashboard stats
│   ├── executiveAnalytics.ts       ← Executive reports and KPIs
│   ├── executiveReportGenerator.ts ← PDF/CSV report generation
│   ├── timeTracking.ts             ← Time & motion analysis service
│   ├── firebaseUtils.ts            ← Firebase helper utilities
│   └── googleDrive.ts              ← Google Drive integration for photos
├── hooks/
│   └── useDailyLogs.ts             ← Real-time Firestore listener for logs
├── config/
│   ├── firebase.ts                 ← R&D Firebase init (from Vercel env vars)
│   └── defaultData.ts              ← Empty stubs only — NO hardcoded data
├── constants/
│   └── index.ts                    ← STORAGE_KEYS and app constants
├── types/
│   ├── index.ts                    ← AppUser, DailyLog, Task
│   ├── experimentTypes.ts          ← ExperimentItem, LabTestItem, StabilityLogItem, etc.
│   └── trialIntegrationTypes.ts    ← ExternalFieldTrial, ExternalProject, etc.
├── pages/
│   ├── Dashboard.tsx               ← Renders ScientistHub component
│   ├── ResearchLog.tsx             ← Daily work session logger (reads Firestore via useDailyLogs)
│   ├── Experiments.tsx             ← Synced trial data from Trial Manager
│   ├── FieldTrials.tsx             ← Trial sync UI (connect + sync button)
│   ├── AIInsights.tsx              ← Gemini AI chat with 10-key rotation
│   ├── Analytics.tsx               ← Efficacy analysis charts
│   ├── TeamActivity.tsx            ← Management audit feed
│   ├── Employees.tsx               ← Scientist directory + PDF exports
│   ├── EmployeeProfile.tsx         ← Individual profile + PDF report generator
│   ├── AuditLogs.tsx               ← Admin audit trail
│   ├── Products.tsx                ← Product portfolio view
│   ├── Projects.tsx                ← Projects list (from getSyncedProjects)
│   ├── Documents.tsx               ← Document management
│   ├── LaboratoryTests.tsx         ← Lab test CRUD
│   ├── StabilityTracker.tsx        ← Stability log CRUD
│   ├── Observations.tsx            ← Observation records CRUD
│   ├── Tasks.tsx                   ← Task management
│   ├── Calendar.tsx                ← Calendar view
│   ├── Notifications.tsx           ← Notification center
│   ├── Reports.tsx                 ← Reports page
│   ├── TimeMotion.tsx              ← Time & motion PDF reports
│   ├── Diagnostics.tsx             ← System health diagnostics
│   └── Settings.tsx                ← App settings
└── components/
    ├── ScientistHub.tsx            ← Main dashboard widget (weekly stats, AI summary)
    ├── GeminiAIChatbot.tsx         ← Floating AI chat widget
    ├── ScientistPerformanceOverview.tsx ← Per-scientist performance charts
    ├── Sidebar.tsx                 ← Navigation sidebar
    ├── ProtectedRoute.tsx          ← Role-based route guard
    ├── ErrorBoundary.tsx           ← React error boundary
    └── ...
```

---

## 16. ENVIRONMENT VARIABLES (Set in Vercel Dashboard)

```env
# R&D Management Firebase (own project)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Gemini AI Keys (10 keys for auto-rotation)
VITE_GEMINI_API_KEY_1=
VITE_GEMINI_API_KEY_2=
VITE_GEMINI_API_KEY_3=
VITE_GEMINI_API_KEY_4=
VITE_GEMINI_API_KEY_5=
VITE_GEMINI_API_KEY_6=
VITE_GEMINI_API_KEY_7=
VITE_GEMINI_API_KEY_8=
VITE_GEMINI_API_KEY_9=
VITE_GEMINI_API_KEY_10=
```

**Trial Manager Firebase credentials are NOT in env vars.**
They are stored by the user at runtime in `localStorage['miklens_rnd_firebase_config_v1']`.

---

## 17. GIT AND DEPLOYMENT

```
Local development
  ↓  git add .
  ↓  git commit -m "descriptive message"
  ↓  git push [remote] main
  ↓
Vercel detects push → auto-build triggered
  Build command: tsc -b && vite build
  ↓
  TypeScript errors → BUILD FAILS → no deployment
  Clean build     → DEPLOYED to miklens-r-d-management.vercel.app
```

**ALWAYS check for TypeScript errors before pushing.** Any `.ts`/`.tsx` type error will block deployment.

---

## 18. RULES FOR AI ASSISTANTS WORKING ON THIS PROJECT

1. **No hardcoded product names.** Use `allProducts` from `ExperimentContext` or `getSyncedTrials()`/`getSyncedFormulations()` from `trialManagerSync.ts`.

2. **Dual-write awareness.** `localStore.ts` writes to BOTH localStorage AND Firestore. When deleting, you must delete from BOTH. When adding, sync the Firestore doc ID back to localStorage.

3. **Two Firebase instances.** R&D app Firebase (env vars, `src/config/firebase.ts`) is completely separate from Trial Manager Firebase (user credentials, initialized dynamically in `trialManagerSync.ts`). Never mix them up.

4. **Role-based routing.** Roles are: `'Admin'` > `'Management'` > `'Scientist'`. Check `profile.role` before rendering admin-only UI.

5. **`allProducts` is derived, never seeded.** It is a `useMemo` that collects unique product names from all user-entered experiment/lab/stability/fieldtrial/observation records. Never add `set.add('hardcoded name')` to it.

6. **AI Summary must not expose product names.** The `aiWeeklySummary` string in `ScientistHub.tsx` and `unifiedActivity.ts` must only show numeric/statistical summaries. No product names, no project titles.

7. **Today's Activities panel shows ONLY today.** Never add fallback logic like `scientistLogs.slice(0, N)` for when there are no today logs. Show an empty state instead.

8. **ResearchLog reads from Firestore.** It uses `useDailyLogs()` hook (not `getLogsByUser` from localStorage) so all Firebase-saved sessions are visible and deletable.

9. **Vercel deploys on every push to `main`.** TypeScript errors = broken deployment. Always verify type safety.

10. **localStorage versioning.** When bumping versions (e.g., `_v3` → `_v4`), always add `localStorage.removeItem('old_key')` to force clean state. Document why the version was bumped.

11. **Photo URLs.** Trial photos from Google Drive are converted via `formatDriveImageUrl()` in `trialManagerSync.ts`. Only show real photos — no placeholder image fallbacks.

12. **Sync is manual.** Data from Trial Manager is NOT auto-synced. The scientist must manually click "Sync Live Data" on the `/trial-sync` page to refresh the local cache.

---

*This document covers the complete architecture as of August 2026.*
*Update this file whenever significant architectural changes are made.*
