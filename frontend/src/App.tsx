import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LocationProvider } from './contexts/LocationContext';
import { AuthProvider } from './contexts/AuthContext';
import { SurfTechLayout } from './components/layout/SurfTechLayout';
import { DashboardLayout } from './components/dashboard';
import { ProtectedRoute } from './components/auth';
import {
  LandingPage,
  DashboardOverview,
  TriggersPage,
  SpotPage,
  AlertsPage,
  AccountPage,
  LoginPage,
  SignupPage,
  ResetPasswordPage,
  AdminSpotsPage,
  AdminSpotDetailPage,
  UserManagementPage,
  InvestmentPage,
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <LocationProvider>
            <SurfTechLayout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/investment" element={<InvestmentPage />} />

                {/* Protected Dashboard Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardOverview />} />
                  <Route path="/triggers" element={<TriggersPage />} />
                  <Route path="/spots" element={<SpotPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/account" element={<AccountPage />} />
                </Route>

                {/* Admin Routes (protected by isAdmin check in component) */}
                <Route path="/admin" element={<Navigate to="/admin/spots" replace />} />
                <Route
                  path="/admin/spots"
                  element={
                    <ProtectedRoute>
                      <AdminSpotsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/spots/:id"
                  element={
                    <ProtectedRoute>
                      <AdminSpotDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/investment"
                  element={
                    <ProtectedRoute>
                      <InvestmentPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </SurfTechLayout>
          </LocationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
