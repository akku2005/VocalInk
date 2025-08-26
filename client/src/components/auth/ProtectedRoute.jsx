import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

const ProtectedRoute = ({ children, requireAuth = true, redirectTo = '/login' }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If route requires authentication and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with the intended destination
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If route is for guests only (like login/register) and user is authenticated
  if (!requireAuth && isAuthenticated) {
    // Redirect to dashboard or home
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and can access the route
  return children;
};

export default ProtectedRoute; 