# Phase 12 & 13 Architecture: Testing and Deployment

## Phase 12: Testing Strategy

### Overview
Enterprise software requires rigorous testing to prevent regressions. Since this platform manages sensitive R&D data, ensuring data integrity is paramount.

### Tools & Layers
1. **Unit Testing (Vitest & Testing Library)**:
   - All complex utility functions (e.g., date formatting, progress calculation).
   - Custom React Hooks (`useProducts`, `useAuth`).
   - Pure UI Components (Buttons, Modals) using DOM testing.
2. **Integration Testing**:
   - Testing the interaction between components (e.g., submitting a form updates a list).
3. **E2E Testing (Future Implementation)**:
   - Playwright to simulate user journeys (Login -> Create Log -> View Dashboard).
4. **Security Rules Testing**:
   - Using the Firebase Emulator Suite to write assertions against `firestore.rules` to ensure Scientists cannot overwrite Management data.

---

## Phase 13: Deployment & SaaS Readiness

### Overview
The application is built as a static Single Page Application (SPA) with serverless backend components. It must support high availability and offline capabilities (PWA).

### Infrastructure
1. **Frontend Hosting**: Firebase Hosting. It provides fast global CDN, automatic SSL, and easy rollback capabilities.
2. **Backend**:
   - Firestore (Database)
   - Cloud Storage (Files, images)
   - Cloud Functions (Node.js runtime for AI and scheduled jobs)
3. **CI/CD Pipeline**:
   - GitHub Actions will be configured.
   - On Push to `main`: Run `npm run test`, `npm run build`, and `firebase deploy --only hosting,functions`.

### SaaS Scalability Strategy
While initially for Miklens Bio, the architecture supports multi-tenancy:
- **Tenant ID**: The `users` and `products` collections have root-level security rules but can be scoped down using a `tenantId` field if the platform is commercialized to other R&D firms.
- **PWA Configuration**: `vite-plugin-pwa` will generate the service worker, enabling scientists in remote field trials (with poor connectivity) to log data offline, syncing automatically when back online via Firestore's offline persistence layer.
