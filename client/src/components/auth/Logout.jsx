import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../ui/LoadingSpinner';

const Logout = () => {
  const { logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        navigate('/login', { 
          state: { message: 'You have been successfully logged out.' }
        });
      } catch (error) {
        console.error('Logout error:', error);
        navigate('/login');
      }
    };

    performLogout();
  }, [logout, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-text-secondary">Logging you out...</p>
      </div>
    </div>
  );
};

export default Logout;
