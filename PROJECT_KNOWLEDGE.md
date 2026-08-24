# 🧪 Miklens R&D Management — Complete Project Knowledge & Dual-App Integration Document

> **Purpose:** This document is the **Single Source of Truth** for any developer or AI assistant joining this project.
> It comprehensively documents both connected applications, their filesystem locations, data architectures, schemas, connection bridges, and mandatory development rules.
> **Last updated:** August 24, 2026

---

## 1. PROJECT OVERVIEW & APPS ARCHITECTURE

The **Miklens Agricultural R&D Ecosystem** consists of **two interconnected applications** operating as a unified two-tier platform:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       APP 1: MIKLENS HERBICIDE TRIAL MANAGER 7                             │
│                     (Field Application - Data Entry & Collection)                          │
│                                                                                             │
│ • Path: C:\Users\DELL\Desktop\APPS\trial manager 7 kiro\Miklens-herbicide-trial-manager-7-main│
│ • Stack: React 19 + Vite + Tailwind v4 + Capacitor (Android/PWA) + Firebase v12            │
│ • Users: Field Scientists, Agronomists, Research Technicians on tablets & phones            │
│ • Role: Captures GPS locations, CRD/RCBD trial layouts, weed counts, spray logs & photos     │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               │ Writes field trial collections & scientist profiles
                                               ▼
                     ┌──────────────────────────────────────────────────┐
                     │    TRIAL MANAGER 7 FIREBASE FIRESTORE PROJECT    │
                     │                                                  │
                     │  Collections:                                    │
                     │   • trials (legacy herbicide)                    │
                     │   • herbicide_trials                             │
                     │   • fungicide_trials                             │
                     │   • pesticide_trials                             │
                     │   • nutrition_trials                             │
                     │   • biostimulant_trials                          │
                     │   • users (field scientist directory)            │
                     │   • projects, formulations, organisations        │
                     └─────────────────────────┬────────────────────────┘
                                               │
                                               │ Read-Only Live Data Sync
                                               │ (src/services/trialManagerSync.ts)
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                         APP 2: MIKLENS R&D MANAGEMENT (THIS APP)                            │
│                        (Executive Control Tower & Management Dashboard)                     │
│                                                                                             │
│ • Path: C:\Users\DELL\Desktop\APPS\Miklens-R-D-Management-main                              │
│ • Live URL: https://miklens-r-d-management.vercel.app                                       │
│ • Stack: React 18/19 + TypeScript + Vite + Tailwind v3 + Firebase v11                        │
│ • Users: R&D Directors, Head Scientists, Executive Management                              │
│ • Role: Consumes trial data via dynamic sync, manages daily research logs, global tasks,     │
│         time & motion analytics, PDF/Excel master reports, and multi-key Gemini AI chat.    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DETAILED APP BREAKDOWN

### App 1: Miklens Herbicide Trial Manager 7
- **Directory Path:** `C:\Users\DELL\Desktop\APPS\trial manager 7 kiro\Miklens-herbicide-trial-manager-7-main`
- **Primary Function:** Field data collection for trial sites across 5 product categories (Herbicide, Fungicide, Pesticide, Nutrition, Biostimulant).
- **Firebase Project:** Owned by Trial Manager (independent from R&D Management).
- **Key Firestore Schema Fields per Trial Document:**
  ```json
  {
    "ID": "trial_document_id",
    "Title": "Pre-emergence Herbicide Evaluation on Maize",
    "Category": "herbicide",
    "Crop": "Maize",
    "Weed": "Amaranthus retroflexus",
    "TargetPest": "Weed pressure",
    "Treatment": "BioShield Alpha @ 2.5 L/ha",
    "ScientistName": "Pavan Dev",
    "AssignedTo": "pavan@miklens.com",
    "CreatedBy": "user_uid_123",
    "ProjectId": "PROJ-2026-001",
    "FormulationId": "FORM-99",
    "Latitude": 12.9716,
    "Longitude": 77.5946,
    "Area": "0.5 ha",
    "Date": "2026-07-30 11:03 AM",
    "Status": "InProgress",
    "Layout": "RCBD",
    "Replications": 4,
    "WCE": 92.5,
    "Observations": "Excellent weed suppression observed at 14 DAT.",
    "PhotoURLs": "[\"https://drive.google.com/uc?id=1AbCdEfG...\"]",
    "IsCompleted": false
  }
  ```

---

### App 2: Miklens R&D Management (This App)
- **Directory Path:** `C:\Users\DELL\Desktop\APPS\Miklens-R-D-Management-main`
- **Primary Function:** Central R&D operations control tower, data aggregation, executive reporting, AI insights, and analytics.
- **Firebase Projects Used:**
  1. **R&D Firebase (Primary):** Initialized via Vercel environment variables (`src/config/firebase.ts`). Handles R&D app user login and stores scientist work logs in `rnd_daily_logs`.
  2. **Trial Manager Firebase (Secondary):** Connected dynamically at runtime (`src/services/trialManagerSync.ts`) using credentials entered by the user in Settings.

---

## 3. THE SYNCHRONIZATION BRIDGE (`trialManagerSync.ts`)

The integration engine connecting App 1 and App 2 lives in `src/services/trialManagerSync.ts`.

### How the Integration Operates:
1. **Credentials Storage:** User inputs App 1's Firebase `apiKey` and `projectId` in Settings (`/settings`). Credentials are stored in `localStorage` under key `miklens_rnd_firebase_config_v1`.
2. **On-Demand Sync Trigger:** When a scientist or manager clicks **"Sync Live Data"** on the Trial Sync page (`/trial-sync`):
   - `trialManagerSync.ts` initializes a secondary Firebase app instance pointing to App 1's Firestore.
   - Authenticates using `signInWithEmailAndPassword`.
   - Reads up to 500 records from all 6 trial collections (`trials`, `herbicide_trials`, `fungicide_trials`, `pesticide_trials`, `nutrition_trials`, `biostimulant_trials`) and the `users` directory.
3. **Data Normalization:**
   - **Dates:** Converts dates (`DD-MM-YYYY`, `YYYY-MM-DD`, timestamps) into standard ISO strings via `parseFlexibleDateStr()`.
   - **Weed Control Efficacy (WCE %):** Normalizes efficacy values or converts raw weed cover percentages via `computeCorrectWCE()`.
   - **Photos:** Formats Google Drive photo URLs into embeddable `lh3.googleusercontent.com` URLs.
   - **Scientist Names:** Normalizes user IDs and handles into clean display names via `formatCleanScientistName()`.
4. **Local Caching:**
   - Stores normalized `ExternalFieldTrial[]` records into browser **Dexie.js (IndexedDB)** and `localStorage` (`miklens_rnd_synced_trials_v1`).
   - Allows all dashboard pages to render instant offline analyses.

---

## 4. LOCAL STORAGE & DATABASE KEYS MAP

| Storage Target | Engine | Key / Collection Name | Description |
| :--- | :--- | :--- | :--- |
| **Synced Field Trials** | IndexedDB (Dexie) + localStorage | `miklens_rnd_synced_trials_v1` | Synced trials from App 1 |
| **Daily Research Logs** | Firestore `rnd_daily_logs` + localStorage | `miklens_daily_logs_v4` | Scientist daily work logs (dual-write) |
| **User Directory** | localStorage | `miklens_users_v4` | Scientist profiles synced from App 1 |
| **Trial Mgr Config** | localStorage | `miklens_rnd_firebase_config_v1` | App 1's connection credentials |
| **Experiments** | localStorage | `miklens_experiments_v5` | Lab experiment records |
| **Lab Tests** | localStorage | `miklens_lab_tests_v5` | Lab assay results |
| **Stability Logs** | localStorage | `miklens_stability_v5` | CIPAC shelf-life logs |
| **Field Trials (Local)**| localStorage | `miklens_field_trials_v5` | Local field trial records |
| **Observations** | localStorage | `miklens_observations_v5` | Observation logs |
| **Global Tasks** | localStorage | `miklens_tasks_v1` | Global tasks & milestones |
| **Theme Preference** | localStorage | `theme` | Light/Dark mode state (`'light'` \| `'dark'`) |

---

## 5. COMPLETE ROUTE & ACCESS GUARD MAP

All routes are declared in [`App.tsx`](file:///c:/Users/DELL/Desktop/APPS/Miklens-R-D-Management-main/src/App.tsx) and wrapped in `<ThemeProvider>`, `<QueryClientProvider>`, `<AuthProvider>`, `<ExperimentProvider>`, and `<TaskProvider>`.

```
PUBLIC
  /login                 → Login page

ALL LOGGED-IN USERS
  /                      → Dashboard (ScientistHub widget)
  /products              → Product Portfolio
  /product-pipeline     → Stage-Gate Product Pipeline
  /formulation-builder   → Formulation Recipe Builder
  /stability-tracker     → Shelf-Life & Stability Tracker
  /tasks                 → Global Task & Milestone Center
  /profile               → Own Scientist Profile & Dossier
  /profile/:userId       → Target Scientist Profile & Dossier
  /projects              → Projects (derived from getSyncedProjects)
  /documents             → Document Management
  /calendar              → Calendar & Schedule
  /ai-insights           → Gemini AI Assistant (10-key rotation)
  /notifications         → Notification Center
  /time-motion           → Time & Motion Analysis
  /settings              → System Settings & Sync Credentials
  /analytics             → Analytics & Efficacy Comparisons

ADMIN + SCIENTIST ONLY
  /experiments           → Experiments & Testing (synced trial data)
  /research-log          → Daily Research Log (reads Firestore via useDailyLogs)
  /trial-sync            → Trial Manager Sync (Live Sync button)
  /lab-tests             → Lab Assays & QC Testing
  /observations          → Field Observations & Evidence Log

ADMIN + MANAGEMENT ONLY
  /employees             → Scientist Directory & Performance Overview
  /employees/:userId     → Target Employee Audit
  /reports               → Executive PDF/Excel Master Report Exporter
  /team-activity         → Team Activity & Audit Feed
  /trial-progress        → Trial Progress Report
  /approvals             → Management Stage-Gate Approvals
  /diagnostics           → System Health Diagnostics

ADMIN ONLY
  /audit-logs            → Admin Audit Trail
```

---

## 6. STRICT DEVELOPER & AI AGENT RULES

When writing code or adding features to this repository, **you MUST strictly adhere to the following 12 rules**:

1. **NO HARDCODED PRODUCT NAMES**: Never hardcode product strings like `'BioShield Alpha'` in components or initial state. Always derive products dynamically from `allProducts` (via `useExperiments()`) or `getSyncedFormulations()` (via `trialManagerSync.ts`).
2. **DUAL-WRITE LOG STORAGE**: [`localStore.ts`](file:///c:/Users/DELL/Desktop/APPS/Miklens-R-D-Management-main/src/services/localStore.ts) writes daily logs to BOTH `localStorage` AND Firestore (`rnd_daily_logs`). When adding a log, update the local ID to the Firestore doc ID upon promise resolution. When deleting, delete from BOTH.
3. **DO NOT MIX FIREBASE INSTANCES**: R&D app's primary Firebase (`src/config/firebase.ts`) is completely separate from App 1's Firebase (`trialManagerSync.ts`). Never mix their initialized auth or Firestore references.
4. **AI SUMMARY ANONYMITY**: The `aiWeeklySummary` text generated in `ScientistHub.tsx` and `unifiedActivity.ts` must ONLY display numeric metrics (hours, counts). Do NOT output specific product names or project titles.
5. **TODAY'S ACTIVITIES STRICT FILTER**: The "Today's Activities" widget on the Dashboard must show ONLY logs created today (`date === today`). Never add fallback logic like `.slice(0, N)` to display old logs when today has 0 logs. Show an empty state instead.
6. **RESEARCH LOG READS FIRESTORE**: `ResearchLog.tsx` must consume `useDailyLogs()` (the real-time Firestore hook), not `getLogsByUser` from `localStorage`, so all Firebase logs remain visible and deletable.
7. **ROLE-BASED GUARD INTEGRITY**: User roles are `'Admin'`, `'Management'`, and `'Scientist'`. Respect `profile.role` boundaries before rendering privileged buttons or routes.
8. **STORAGE VERSION BUMPING**: When modifying storage structures, bump the key version (e.g. `_v4` → `_v5`) and explicitly call `localStorage.removeItem('old_key')` to force clean cache invalidation on client browsers.
9. **THEME CONTEXT USAGE**: Always consume theme state via `useTheme()` from [`ThemeContext.tsx`](file:///c:/Users/DELL/Desktop/APPS/Miklens-R-D-Management-main/src/contexts/ThemeContext.tsx). Never create isolated local `useState` for dark mode in components.
10. **MULTI-KEY GEMINI ROTATION**: Keep the 10-key fallback mechanism intact in [`geminiEngine.ts`](file:///c:/Users/DELL/Desktop/APPS/Miklens-R-D-Management-main/src/services/geminiEngine.ts). If an API key encounters HTTP 429, rotate to the next key automatically.
11. **IMAGE URL FORMATTING**: Always format Google Drive photo URLs using `formatDriveImageUrl()` in `trialManagerSync.ts` to output valid `lh3.googleusercontent.com` URLs.
12. **VERCEL ZERO-ERROR BUILD**: Automatic Vercel deployment runs `tsc -b && vite build` on every push to `main`. Always run `npx tsc -b` locally before committing to ensure zero TypeScript errors.

---

## 7. VERIFICATION & BUILD COMMANDS

Run these commands in `C:\Users\DELL\Desktop\APPS\Miklens-R-D-Management-main` to verify code integrity:

```bash
# 1. Check TypeScript types
npx tsc -b

# 2. Run Vite production build check
npm run build

# 3. Run Vitest test suite
npm test

# 4. Run Oxlint code analysis
npm run lint
```
