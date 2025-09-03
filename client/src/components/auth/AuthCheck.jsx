import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthCheck = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      // Don't redirect if already on login or register page
      const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
      if (!publicRoutes.includes(location.pathname)) {
        navigate('/login', { 
          state: { 
            from: location.pathname,
            message: 'Please log in to continue.' 
          } 
        });
      }
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthCheck; 