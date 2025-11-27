import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthCheck = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If not loading and not authenticated, only redirect for protected routes
    if (!loading && !isAuthenticated) {
      // Define protected routes that require authentication
      const protectedRoutes = [
        '/dashboard',
        '/analytics',
        '/rewards',
        '/notifications',
        '/create-blog',
        '/create-series',
        '/edit-blog',
        '/series/timeline',
        '/settings',
        '/2fa-setup',
        '/test'
      ];

      // Define guest-only routes
      const guestRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

      const currentPath = location.pathname;

      // Check if current path is a protected route
      const isProtectedRoute = protectedRoutes.some(route =>
        currentPath.startsWith(route) ||
        (route.includes('/:') && currentPath.match(new RegExp(route.replace('/:.*', '/.*'))))
      );

      // Check if current path is a guest route
      const isGuestRoute = guestRoutes.some(route => currentPath.startsWith(route));

      // Only redirect to login if trying to access a protected route
      if (isProtectedRoute) {
        navigate('/login', {
          state: {
            from: location.pathname,
            message: 'Please log in to access this feature.'
          }
        });
      }

      // Redirect authenticated users away from guest routes
      if (isGuestRoute && isAuthenticated) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, loading, navigate, location.pathname]);

  // Show loading spinner while checking authentication
  if (loading) {
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