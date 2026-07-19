import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Products } from './pages/Products';
import { Experiments } from './pages/Experiments';
import { Reports } from './pages/Reports';
import { Analytics } from './pages/Analytics';
import { ResearchLog } from './pages/ResearchLog';
import { EmployeeProfile } from './pages/EmployeeProfile';
import { Settings } from './pages/Settings';
import { Projects } from './pages/Projects';
import { Tasks } from './pages/Tasks';
import { Documents } from './pages/Documents';
import { Calendar } from './pages/Calendar';
import { AIInsights } from './pages/AIInsights';
import { AuditLogs } from './pages/AuditLogs';
import { Notifications } from './pages/Notifications';
import { FieldTrials } from './pages/FieldTrials';
import { LaboratoryTests } from './pages/LaboratoryTests';
import { Observations } from './pages/Observations';
import { TeamActivity } from './pages/TeamActivity';
import { TimeMotion } from './pages/TimeMotion';
import { FormulationBuilder } from './pages/FormulationBuilder';
import { StabilityTracker } from './pages/StabilityTracker';
import { ProductPipeline } from './pages/ProductPipeline';
import { ErrorBoundary } from './components/ErrorBoundary';
const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected Routes - available to any authenticated role */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product-pipeline" element={<ProductPipeline />} />
                <Route path="/experiments" element={<Experiments />} />
                <Route path="/formulation-builder" element={<FormulationBuilder />} />
                <Route path="/stability-tracker" element={<StabilityTracker />} />
                <Route path="/research-log" element={<ResearchLog />} />
                <Route path="/profile" element={<EmployeeProfile />} />
                <Route path="/profile/:userId" element={<EmployeeProfile />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/ai-insights" element={<AIInsights />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/field-trials" element={<FieldTrials />} />
                <Route path="/lab-tests" element={<LaboratoryTests />} />
                <Route path="/observations" element={<Observations />} />
                <Route path="/time-motion" element={<TimeMotion />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Management/Admin-only routes */}
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Management']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/employees" element={<Employees />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/analytics" element={<Analytics />} />
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
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
