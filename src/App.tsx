import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExperimentProvider } from './contexts/ExperimentContext';
import { RefreshCw } from 'lucide-react';

import { lazyWithRetry } from './utils/lazyWithRetry';

// Lazy Loaded Pages for Instant Load Speed with Chunk Recovery
const Login = lazyWithRetry(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Employees = lazyWithRetry(() => import('./pages/Employees').then((m) => ({ default: m.Employees })));
const Products = lazyWithRetry(() => import('./pages/Products').then((m) => ({ default: m.Products })));
const Experiments = lazyWithRetry(() => import('./pages/Experiments').then((m) => ({ default: m.Experiments })));
const ResearchLog = lazyWithRetry(() => import('./pages/ResearchLog').then((m) => ({ default: m.ResearchLog })));
const EmployeeProfile = lazyWithRetry(() => import('./pages/EmployeeProfile').then((m) => ({ default: m.EmployeeProfile })));
const Settings = lazyWithRetry(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Projects = lazyWithRetry(() => import('./pages/Projects').then((m) => ({ default: m.Projects })));
const Documents = lazyWithRetry(() => import('./pages/Documents').then((m) => ({ default: m.Documents })));
const Calendar = lazyWithRetry(() => import('./pages/Calendar').then((m) => ({ default: m.Calendar })));
const AIInsights = lazyWithRetry(() => import('./pages/AIInsights').then((m) => ({ default: m.AIInsights })));
const Notifications = lazyWithRetry(() => import('./pages/Notifications').then((m) => ({ default: m.Notifications })));
const AuditLogs = lazyWithRetry(() => import('./pages/AuditLogs').then((m) => ({ default: m.AuditLogs })));
const TeamActivity = lazyWithRetry(() => import('./pages/TeamActivity').then((m) => ({ default: m.TeamActivity })));
const TimeMotion = lazyWithRetry(() => import('./pages/TimeMotion').then((m) => ({ default: m.TimeMotion })));
const FieldTrials = lazyWithRetry(() => import('./pages/FieldTrials').then((m) => ({ default: m.FieldTrials })));
const Diagnostics = lazyWithRetry(() => import('./pages/Diagnostics').then((m) => ({ default: m.Diagnostics })));
const Analytics = lazyWithRetry(() => import('./pages/Analytics').then((m) => ({ default: m.Analytics })));
const TrialProgressReport = lazyWithRetry(() => import('./pages/TrialProgressReport').then((m) => ({ default: m.TrialProgressReport })));

// Optimized React Query Client with Stale Caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
      refetchOnWindowFocus: false, // Prevent lag on tab switch
    },
  },
});

// Sleek Instant Page Loading Spinner
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center min-h-[400px]">
    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
      <RefreshCw className="w-5 h-5 animate-spin" />
      <span>Loading Miklens R&D Platform...</span>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ExperimentProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route element={<AuthLayout />}>
                    <Route path="/login" element={<Login />} />
                  </Route>

                  {/* Protected Routes (Everyone) */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/profile" element={<EmployeeProfile />} />
                      <Route path="/profile/:userId" element={<EmployeeProfile />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/documents" element={<Documents />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/ai-insights" element={<AIInsights />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/time-motion" element={<TimeMotion />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/analytics" element={<Analytics />} />
                    </Route>
                  </Route>

                  {/* Scientist Workbench (Admin & Scientist Only) */}
                  <Route element={<ProtectedRoute allowedRoles={['Admin', 'Scientist']} />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/experiments" element={<Experiments />} />
                      <Route path="/research-log" element={<ResearchLog />} />
                      <Route path="/trial-sync" element={<FieldTrials />} />
                    </Route>
                  </Route>

                    {/* Management/Admin-only routes */}
                    <Route element={<ProtectedRoute allowedRoles={['Admin', 'Management']} />}>
                      <Route element={<DashboardLayout />}>
                        <Route path="/employees" element={<Employees />} />
                        <Route path="/reports" element={<TeamActivity />} />
                        <Route path="/team-activity" element={<TeamActivity />} />
                        <Route path="/trial-progress" element={<TrialProgressReport />} />
                        <Route path="/diagnostics" element={<Diagnostics />} />
                      </Route>
                    </Route>

                    {/* Admin-only routes */}
                    <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                      <Route element={<DashboardLayout />}>
                        <Route path="/audit-logs" element={<AuditLogs />} />
                      </Route>
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ExperimentProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
