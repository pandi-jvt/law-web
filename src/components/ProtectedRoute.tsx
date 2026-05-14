import { Navigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import Loader from 'components/Loader';

// ==============================|| PROTECTED ROUTE - REDIRECT TO LOGIN IF NO SESSION ||============================== //

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps): React.ReactElement {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
