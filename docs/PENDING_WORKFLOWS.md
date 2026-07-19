# Architecture for Pending Workflows

This document outlines the architecture for the remaining key modules: the Daily Research Log, the Employee Profile, and the Settings configuration.

## 1. Daily Research Log Architecture

### Overview
According to the SRS, employees should NEVER write long reports. Instead, they complete a fast (3-5 minutes) Daily Research Log. This data fuels the AI Engine to generate daily summaries, detect bottlenecks, and track product maturity automatically.

### Components
- **`src/pages/ResearchLog.tsx`**: A focused, wizard-like form or a clean single-page form using `react-hook-form` and `zod` for robust validation.
- **Fields**: Date, Product Selection, Experiment Selection, Objective, Activities, Problems, Achievements, Time Spent, and Completion Status.
- **Future Integration**: Upon submission, this will trigger the Firebase Cloud Function (`analyzeDailyLog`) created in Phase 9.

### Edge Cases
- **Speed Constraints**: The form must be quick. Dropdowns for Product and Experiment must be populated asynchronously or cached via React Query.
- **Offline Mode**: Scientists might submit logs from a greenhouse with poor Wi-Fi. The Firebase SDK will handle offline queuing automatically, but the UI must provide clear feedback ("Saved Offline").

---

## 2. Employee Profile Architecture

### Overview
A comprehensive "Large Profile" that goes beyond basic HR details. It visualizes the scientist's research area, achievements, and an AI summary of their recent contributions. It strictly avoids attendance-based metrics.

### Components
- **`src/pages/EmployeeProfile.tsx`**: A dashboard-like view for an individual user.
- **Visuals**:
  - Header: Avatar, Designation, Core Skills.
  - Performance Graph: A mini-Recharts component showing knowledge creation and innovation over the past 6 months (as defined in the prompt: "Never calculate employee performance using attendance").
  - Timeline: A list of recent logs and completed experiments.

### Edge Cases
- **Self vs. Colleague View**: Scientists viewing their own profile might see edit options. Viewing others might be read-only.
- **Data Aggregation**: Aggregating yearly logs dynamically on the client could be expensive; in a production setting, Cloud Functions would aggregate this into a daily summary field on the user document.

---

## 3. Settings Architecture

### Overview
A standard configuration module for application preferences and RBAC (Role-Based Access Control) preview.

### Components
- **`src/pages/Settings.tsx`**: A multi-tab layout (Profile, Notifications, Security, System).
- **Features**: Toggle Dark/Light mode (integrating with the Tailwind `.dark` class), manage email preferences, and view system audit logs (for Admins).

### Edge Cases
- **Role Enforcement**: The "System" and "Audit Logs" tabs must only be visible/accessible if `userRole === 'Admin'`.
