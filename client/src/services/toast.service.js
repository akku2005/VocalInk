// Toast service that wraps the useToast hook for use in non-component contexts
let toastContext = null;

// Initialize the toast context (called from a component that has access to useToast)
export const initializeToastService = (showToastFn) => {
  toastContext = showToastFn;
};

// Show toast function that can be used anywhere
export const showToast = (message, type = 'info') => {
  if (toastContext) {
    toastContext(message, type);
  } else {
    console.warn('Toast service not initialized. Message:', message, 'Type:', type);
    // Fallback to console for development
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};

export default {
  showToast,
  initializeToastService
};
