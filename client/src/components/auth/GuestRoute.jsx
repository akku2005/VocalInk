import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';
import { sessionStorageHelper } from '../../utils/storage';
import { storage } from '../../utils/storage';

const GuestRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { loading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is authenticated, redirect to intended destination or dashboard
  if (isAuthenticated) {
    // Check if there's a stored intended destination from localStorage
    if (!sessionStorageHelper.available) {
      return <Navigate to={redirectTo} replace />;
    }
    const intendedRoute = sessionStorageHelper.getItem('intendedRoute');
    if (intendedRoute && intendedRoute !== '/login' && intendedRoute !== '/register') {
      sessionStorageHelper.removeItem('intendedRoute');
      return <Navigate to={intendedRoute} replace />;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // User is not authenticated, allow access to guest route
  return children;
};

export default GuestRoute; 
