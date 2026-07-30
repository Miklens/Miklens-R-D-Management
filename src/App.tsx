import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TaskProvider } from './contexts/TaskContext';
import { ExperimentProvider } from './contexts/ExperimentContext';
import { RefreshCw } from 'lucide-react';

// Lazy Loaded Pages for Instant Load Speed
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Employees = lazy(() => import('./pages/Employees').then((m) => ({ default: m.Employees })));
const Products = lazy(() => import('./pages/Products').then((m) => ({ default: m.Products })));
const Experiments = lazy(() => import('./pages/Experiments').then((m) => ({ default: m.Experiments })));
const ResearchLog = lazy(() => import('./pages/ResearchLog').then((m) => ({ default: m.ResearchLog })));
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile').then((m) => ({ default: m.EmployeeProfile })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Projects = lazy(() => import('./pages/Projects').then((m) => ({ default: m.Projects })));
const Tasks = lazy(() => import('./pages/Tasks').then((m) => ({ default: m.Tasks })));
const Documents = lazy(() => import('./pages/Documents').then((m) => ({ default: m.Documents })));
const Calendar = lazy(() => import('./pages/Calendar').then((m) => ({ default: m.Calendar })));
const AIInsights = lazy(() => import('./pages/AIInsights').then((m) => ({ default: m.AIInsights })));
const Notifications = lazy(() => import('./pages/Notifications').then((m) => ({ default: m.Notifications })));
const AuditLogs = lazy(() => import('./pages/AuditLogs').then((m) => ({ default: m.AuditLogs })));
const TeamActivity = lazy(() => import('./pages/TeamActivity').then((m) => ({ default: m.TeamActivity })));
const TimeMotion = lazy(() => import('./pages/TimeMotion').then((m) => ({ default: m.TimeMotion })));

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
          <TaskProvider>
            <ExperimentProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route element={<AuthLayout />}>
                      <Route path="/login" element={<Login />} />
                    </Route>

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route element={<DashboardLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/experiments" element={<Experiments />} />
                        <Route path="/research-log" element={<ResearchLog />} />
                        <Route path="/profile" element={<EmployeeProfile />} />
                        <Route path="/profile/:userId" element={<EmployeeProfile />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/ai-insights" element={<AIInsights />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/time-motion" element={<TimeMotion />} />
                        <Route path="/settings" element={<Settings />} />
                      </Route>
                    </Route>

                    {/* Management/Admin-only routes */}
                    <Route element={<ProtectedRoute allowedRoles={['Admin', 'Management']} />}>
                      <Route element={<DashboardLayout />}>
                        <Route path="/employees" element={<Employees />} />
                        <Route path="/reports" element={<TeamActivity />} />
                        <Route path="/team-activity" element={<TeamActivity />} />
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
          </TaskProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
