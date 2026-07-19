# System Architecture

## Overview
The Miklens Bio R&D Management Platform is a scalable, SaaS-ready, enterprise-grade web application built to track and manage research, products, employees, and experiments. It leverages a modern React stack with Firebase as the backend-as-a-service (BaaS). The architecture emphasizes high performance, offline capabilities, real-time synchronization, and a clean, maintainable structure.

## 1. High-Level Architecture
- **Client:** React 19 SPA (Single Page Application) built with Vite, acting as a Progressive Web App (PWA).
- **Backend/Database:** Firebase (Firestore, Authentication, Storage) handling real-time data sync, secure file storage, and user identity.
- **Serverless Compute:** Firebase Cloud Functions for backend logic (AI integrations, complex aggregations, report generation, audit logging).
- **AI Engine:** Integration with an external LLM via Cloud Functions (e.g., OpenAI API or Google Vertex AI) for analyzing logs, predicting completion, and generating insights.

## 2. Tech Stack Choices
- **Frontend Framework:** React 19 + Vite (for fast builds and modern features).
- **Styling:** TailwindCSS with Framer Motion (for premium Apple-inspired glassmorphism and animations).
- **Routing:** React Router (for client-side routing).
- **State Management & Data Fetching:** React Query (for caching, background updates, optimistic UI, and remote state management).
- **Forms & Validation:** React Hook Form + Zod (for performant, type-safe form handling).
- **Charting:** Recharts (for dashboards and analytics).
- **Backend:** Firebase (Authentication, Firestore, Storage, Functions).
- **Language:** TypeScript (for type safety and enterprise scalability).

## 3. Clean Architecture Implementation
The application will adhere to Clean Architecture principles to separate concerns, making the system testable, maintainable, and independent of specific frameworks where possible.

### Layers:
1. **Domain Layer (Entities):** Types, interfaces, Zod schemas, and core business rules (e.g., Product stages, Experiment logic).
2. **Data Layer (Services/Repositories):** Firebase Firestore interactions. Abstracts Firebase calls away from components.
3. **Application Layer (Hooks/Contexts):** Custom React hooks (using React Query) encapsulating use cases (e.g., `useCreateLog`, `useProductProgress`).
4. **Presentation Layer (UI):** React components, Pages, Layouts. Contains no direct database logic.

### Folder Structure
```
miklens-rnd/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, fonts
│   ├── components/         # Reusable UI components (Atomic design: atoms, molecules, organisms)
│   ├── config/             # Environment variables, Firebase initialization
│   ├── constants/          # Magic strings, static lists (e.g., Product Stages)
│   ├── contexts/           # React Contexts (Auth, Theme)
│   ├── hooks/              # Custom React Query and utility hooks
│   ├── layouts/            # Page layouts (Sidebar, Header, DashboardLayout)
│   ├── pages/              # Route components (Dashboard, Profile, Products)
│   ├── services/           # API calls, Firebase Firestore functions
│   ├── types/              # TypeScript interfaces and Zod schemas
│   ├── utils/              # Helper functions (formatting, date logic)
│   ├── App.tsx             # Root component, Router setup
│   └── main.tsx            # Entry point, Providers setup
```

## 4. Key Architectural Mechanisms

### 4.1 Realtime Synchronization & Offline Support
- **Firestore Offline Persistence:** Enabled by default. Users can create logs or edit data offline, and Firestore will sync changes when connectivity is restored.
- **Optimistic UI Updates:** React Query mutations will update the UI immediately before the server confirms the change, providing a fast, seamless experience.

### 4.2 Security & Permissions
- **Authentication:** Firebase Auth (Email/Password, possibly SSO for enterprise).
- **Role-Based Access Control (RBAC):** Users are assigned roles (`Admin`, `Management`, `Scientist`) via Firestore custom claims or a specific `users` collection.
- **Firestore Security Rules:** Strict rules to ensure Scientists only access their authorized projects, while Management has read-only access to broad datasets, and Admins have full access.
- **Audit Logging:** Critical changes (status updates, deletions) trigger Cloud Functions that write to an `audit_logs` collection.

### 4.3 AI Engine Integration
- **Trigger:** When a daily log is submitted, a Firestore trigger invokes a Cloud Function.
- **Processing:** The Cloud Function sends the log data and relevant context (Product history, previous experiments) to an AI API.
- **Output:** The AI generates an analysis, identifies risks, and updates the `daily_logs` document with `AI Notes` and the `products` document with updated `AI Summary`.

### 4.4 Scalability & SaaS Readiness
- **Multi-tenant Potential:** Although initially for Miklens Bio, the database structure and routing will be designed to potentially support a `tenantId` structure if it evolves into a multi-company SaaS platform.
- **Pagination & Indexing:** All Firestore queries for lists (Logs, Experiments) will use cursor-based pagination and compound indexes to ensure fast reads regardless of collection size.

## 5. UI/UX Strategy
- **Design Language:** Modern, Apple-inspired. Soft shadows, rounded corners, glassmorphism overlays for modals/sidebars.
- **Dark/Light Mode:** First-class support via Tailwind dark classes and a global context.
- **Animations:** Subtle micro-interactions using Framer Motion (page transitions, list item insertions).
- **Responsive:** Mobile-first approach, ensuring the platform is usable on tablets (lab environments) and phones (field trials).
