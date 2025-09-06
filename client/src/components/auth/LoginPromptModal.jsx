import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Heart, MessageCircle, Bookmark, User, Lock } from 'lucide-react';
import Button from '../ui/Button';

const LoginPromptModal = ({ 
  action = 'interact',
  onClose, 
  title = 'Sign in to continue',
  message = 'Please sign in to access this feature'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSignIn = () => {
    setIsRedirecting(true);
    navigate('/login', { 
      state: { 
        from: location.pathname,
        message: `Please sign in to ${action}` 
      } 
    });
  };

  const handleSignUp = () => {
    setIsRedirecting(true);
    navigate('/register', { 
      state: { 
        from: location.pathname,
        message: `Please create an account to ${action}` 
      } 
    });
  };

  const getActionIcon = () => {
    switch (action) {
      case 'like':
        return <Heart className="w-8 h-8" style={{ color: 'rgb(var(--color-error))' }} />;
      case 'comment':
        return <MessageCircle className="w-8 h-8" style={{ color: 'rgb(var(--color-primary))' }} />;
      case 'bookmark':
        return <Bookmark className="w-8 h-8" style={{ color: 'rgb(var(--color-accent))' }} />;
      default:
        return <Lock className="w-8 h-8" style={{ color: 'var(--text-color)' }} />;
    }
  };

  const getActionText = () => {
    switch (action) {
      case 'like':
        return 'like posts';
      case 'comment':
        return 'leave comments';
      case 'bookmark':
        return 'bookmark posts';
      default:
        return 'access this feature';
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glassmorphism-card max-w-md w-full mx-4 overflow-hidden theme-transition">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            {getActionIcon()}
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
              <p className="text-sm text-text-secondary">Join our community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--secondary-btn-hover)] rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-color)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-text-secondary mb-6 text-center">
            {message} and {getActionText()}. Create an account to unlock all features!
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(var(--color-primary))' }}></div>
              <span className="text-text-secondary">Like and bookmark your favorite posts</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(var(--color-primary))' }}></div>
              <span className="text-text-secondary">Leave comments and join discussions</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(var(--color-primary))' }}></div>
              <span className="text-text-secondary">Create your own blog posts and series</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(var(--color-primary))' }}></div>
              <span className="text-text-secondary">Track your reading progress and analytics</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleSignIn}
              disabled={isRedirecting}
              className="w-full"
              size="lg"
            >
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
            
            <Button
              onClick={handleSignUp}
              disabled={isRedirecting}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Create Account
            </Button>
          </div>

          {/* Skip option */}
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-text-secondary hover:text-text-primary mt-4 py-2 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal; 