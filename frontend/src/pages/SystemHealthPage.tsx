import { Navigate } from "react-router-dom";
import { AdminHeader, SystemHealth } from "../components/admin";
import { useAuth } from "../contexts/AuthContext";
import { DnaLogo } from "../components/ui";

export function SystemHealthPage() {
  const { isAdmin, loading: authLoading } = useAuth();

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DnaLogo className="w-16 h-16" />
      </div>
    );
  }

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <AdminHeader />

        {/* Page Header */}
        <div className="mb-6">
          <h2 className="font-mono text-xl font-bold uppercase tracking-wider mb-2">System Health</h2>
          <p className="font-mono text-sm text-muted-foreground">
            Monitor API usage, infrastructure limits, and system performance.
          </p>
        </div>

        {/* System Health Component */}
        <SystemHealth />
      </div>
    </div>
  );
}
