import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMinimumLoading } from '../../hooks/useMinimumLoading';
import { DnaLogo } from '../../components/ui/DnaLogo';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const isLoading = useMinimumLoading(loading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <DnaLogo className="w-24 h-24" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
