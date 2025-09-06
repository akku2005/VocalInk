import { createContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Toast from './Toast';

const ToastContext = createContext();

export { ToastContext };

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, ...toast };
    
    setToasts(prev => [...prev, newToast]);
    
    // Return the toast ID for potential removal
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      title: options.title || 'Success',
      duration: options.duration || 4000,
      action: options.action
    });
  }, [addToast]);

  const showError = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      title: options.title || 'Error',
      duration: options.duration || 6000,
      action: options.action
    });
  }, [addToast]);

  const showWarning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      message,
      title: options.title || 'Warning',
      duration: options.duration || 5000,
      action: options.action
    });
  }, [addToast]);

  const showInfo = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      title: options.title || 'Information',
      duration: options.duration || 4000,
      action: options.action
    });
  }, [addToast]);

  const showToast = useCallback((message, type = 'info', options = {}) => {
    switch (type) {
      case 'success':
        return showSuccess(message, options);
      case 'error':
        return showError(message, options);
      case 'warning':
        return showWarning(message, options);
      case 'info':
      default:
        return showInfo(message, options);
    }
  }, [showSuccess, showError, showWarning, showInfo]);

  const value = {
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastPortal toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastPortal = ({ toasts, onRemove }) => {
  // Only render portal on client side
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            {...toast}
            onClose={onRemove}
          />
        </div>
      ))}
    </div>,
    document.body
  );
};

export default ToastProvider; 