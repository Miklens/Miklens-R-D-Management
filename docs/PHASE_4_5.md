# Phase 4 & 5 Architecture: Authentication and Dashboard

## Phase 4: Authentication Architecture

### Overview
Authentication will rely on Firebase Authentication. We'll use an Email/Password provider for now, but the architecture will support extending to SSO or Google Auth easily.

### Components
- **`src/config/firebase.ts`**: Initializes the Firebase app and exports the `auth` instance.
- **`src/contexts/AuthContext.tsx`**: A React Context provider that uses Firebase's `onAuthStateChanged` to maintain the user's authentication state globally. It will also fetch the user's role from the `users` Firestore collection.
- **`src/components/ProtectedRoute.tsx`**: A wrapper component for routes that require authentication. If the user is not authenticated, it redirects them to the login page.
- **`src/layouts/AuthLayout.tsx`**: A simple layout centered on the screen, possibly with a split-screen design (branding on one side, login form on the other).
- **`src/pages/Login.tsx`**: The login form utilizing `react-hook-form` and `zod` for client-side validation.

### Edge Cases
- **Stale Auth State**: Handling the initial loading state before Firebase resolves the user. `AuthContext` must expose an `isLoading` flag.
- **Missing Firestore Role**: If a user exists in Auth but has no corresponding record in the `users` collection, the system should treat them as unauthorized or a guest until an Admin assigns a role.

---

## Phase 5: Dashboard Architecture

### Overview
The dashboard is the central hub. It needs a sidebar for navigation, a top header for user profile and notifications, and a main content area.

### Components
- **`src/layouts/DashboardLayout.tsx`**: The main shell. It contains the Sidebar, Header, and an `<Outlet />` for nested routes (Dashboard, Products, etc.).
- **`src/components/Sidebar.tsx`**: Navigation menu. It will use `lucide-react` icons. It should be responsive (collapsible on mobile).
- **`src/components/Header.tsx`**: Displays the user's name/avatar, breadcrumbs, and a theme toggle (Dark/Light mode).
- **`src/pages/Dashboard.tsx`**: The main executive dashboard view. It will render various stat cards, charts (using Recharts), and recent activity logs.

### Edge Cases
- **Mobile Navigation**: On small screens, the sidebar must become a drawer (off-canvas).
- **Role-Based Views**: The Dashboard needs to render different KPI cards based on the user's role. An Admin/Management user sees company-wide stats, while a Scientist sees personal stats and assigned project statuses.
- **Data Loading States**: When fetching data for charts, skeleton loaders must be displayed to maintain the "premium Apple-inspired" feel and avoid layout shift.