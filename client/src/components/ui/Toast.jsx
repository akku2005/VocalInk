import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  X,
  AlertTriangle
} from 'lucide-react';

const toastTypes = {
  success: {
    icon: CheckCircle,
    className: 'backdrop-blur-md bg-white/10 dark:bg-black/20 border-white/20 dark:border-white/10 text-success-700 dark:text-success-400',
    iconClassName: 'text-success-500',
    glowColor: 'from-success/20 to-success/10'
  },
  error: {
    icon: XCircle,
    className: 'backdrop-blur-md bg-white/10 dark:bg-black/20 border-white/20 dark:border-white/10 text-error-700 dark:text-error-400',
    iconClassName: 'text-error-500',
    glowColor: 'from-error/20 to-error/10'
  },
  warning: {
    icon: AlertTriangle,
    className: 'backdrop-blur-md bg-white/10 dark:bg-black/20 border-white/20 dark:border-white/10 text-warning-700 dark:text-warning-400',
    iconClassName: 'text-warning-500',
    glowColor: 'from-warning/20 to-warning/10'
  },
  info: {
    icon: Info,
    className: 'backdrop-blur-md bg-white/10 dark:bg-black/20 border-white/20 dark:border-white/10 text-primary-700 dark:text-primary-400',
    iconClassName: 'text-primary-500',
    glowColor: 'from-primary/20 to-primary/10'
  }
};

const Toast = ({ 
  id, 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose, 
  action 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, 300);
  };

  const handleAction = () => {
    action?.onClick?.();
    handleClose();
  };

  if (!isVisible) return null;

  const toastConfig = toastTypes[type];
  const Icon = toastConfig.icon;

  return (
    <div
      className={cn(
        'relative w-full max-w-sm backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl shadow-2xl p-4 transition-all duration-300 ease-in-out overflow-hidden',
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Glassmorphism backdrop with colored glow */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-30',
        toastConfig.glowColor
      )}></div>
      
      {/* Content */}
      <div className="relative flex items-start gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', toastConfig.iconClassName)} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-medium text-sm mb-1 text-text-primary">{title}</h4>
          )}
          {message && (
            <p className="text-sm text-text-primary">{message}</p>
          )}
          
          {action && (
            <button
              onClick={handleAction}
              className="mt-2 text-sm font-medium underline hover:no-underline transition-all text-text-primary hover:text-primary-500"
            >
              {action.text}
            </button>
          )}
        </div>

        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-all duration-200"
          aria-label="Close notification"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Subtle border glow */}
      <div className={cn(
        'absolute inset-0 rounded-xl border border-white/30 dark:border-white/20 pointer-events-none',
        `border-${type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'primary'}/30`
      )}></div>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-b-xl transition-all duration-100 ease-linear">
          <div 
            className="h-full bg-current transition-all duration-100 ease-linear"
            style={{ 
              width: isExiting ? '0%' : '100%',
              transitionDuration: `${duration}ms`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast; 