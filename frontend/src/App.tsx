import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
  PersonalityPage,
  AccountPage,
  LoginPage,
  SignupPage,
  AdminSpotsPage,
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

                {/* Protected Dashboard Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardOverview />} />
                  <Route path="triggers" element={<TriggersPage />} />
                  <Route path="spot" element={<SpotPage />} />
                  <Route path="alerts" element={<AlertsPage />} />
                  <Route path="personality" element={<PersonalityPage />} />
                  <Route path="account" element={<AccountPage />} />
                </Route>

                {/* Admin Routes (protected by isAdmin check in component) */}
                <Route
                  path="/admin/spots"
                  element={
                    <ProtectedRoute>
                      <AdminSpotsPage />
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
