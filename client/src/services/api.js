import axios from 'axios';
import API_CONFIG from '../constants/apiConfig';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add device fingerprint for JWT validation
    const deviceFingerprint = localStorage.getItem('deviceFingerprint');
    if (deviceFingerprint) {
      config.headers['X-Device-Fingerprint'] = deviceFingerprint;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Check if it's a 2FA or verification requirement
      const responseData = error.response.data;
      if (responseData.twoFactorRequired || responseData.requiresVerification) {
        // Don't clear tokens for 2FA or verification requirements
        // These are handled by the auth context
        return Promise.reject(error);
      }
      
      // Try to refresh the token
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log('Attempting automatic token refresh...');
          
          // Call the refresh token endpoint
          const refreshResponse = await api.post('/auth/refresh-token', {
            refreshToken
          });
          
          if (refreshResponse.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
            
            // Update stored tokens
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Update the current request's authorization header
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            
            // Retry the original request
            console.log('Token refreshed, retrying original request...');
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Automatic token refresh failed:', refreshError);
      }
      
      // If refresh failed, clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }

    // Handle 423 Locked errors (account lockout)
    if (error.response?.status === 423) {
      console.warn('Account locked:', error.response.data);
      // Don't redirect - let the component handle this
    }

    // Handle 429 Rate limit errors
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
    }

    return Promise.reject(error);
  }
);

// Retry logic for failed requests
const retryRequest = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && shouldRetry(error)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const shouldRetry = (error) => {
  // Retry on network errors or 5xx server errors
  // Don't retry on 4xx client errors (except 429 rate limit)
  return !error.response || (error.response.status >= 500 && error.response.status < 600);
};

// API service methods
export const apiService = {
  // Generic request methods
  get: (url, config = {}) => retryRequest(() => api.get(url, config)),
  post: (url, data = {}, config = {}) => retryRequest(() => api.post(url, data, config)),
  put: (url, data = {}, config = {}) => retryRequest(() => api.put(url, data, config)),
  patch: (url, data = {}, config = {}) => retryRequest(() => api.patch(url, data, config)),
  delete: (url, config = {}) => retryRequest(() => api.delete(url, config)),

  // File upload
  upload: (url, file, onProgress, config = {}) => {
    const formData = new FormData();
    formData.append('file', file);

    return retryRequest(() => api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
      onUploadProgress: onProgress,
    }));
  },

  // Download file
  download: (url, filename, config = {}) => {
    return retryRequest(() => api.get(url, {
      ...config,
      responseType: 'blob',
    })).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },
};

// Error handling utilities
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          type: 'validation',
          message: data.message || 'Invalid request data',
          errors: data.errors || [],
        };
      case 401:
        // Handle specific 2FA and verification requirements
        if (data.twoFactorRequired) {
          return {
            type: 'two_factor',
            message: data.message || 'Two-factor authentication code required',
            twoFactorRequired: true,
          };
        }
        if (data.requiresVerification) {
          return {
            type: 'verification',
            message: data.message || 'Email verification required',
            requiresVerification: true,
          };
        }
        return {
          type: 'auth',
          message: data.message || 'Authentication required',
        };
      case 403:
        return {
          type: 'permission',
          message: data.message || 'You do not have permission to perform this action',
        };
      case 404:
        return {
          type: 'not_found',
          message: data.message || 'The requested resource was not found',
        };
      case 423:
        return {
          type: 'account_locked',
          message: data.message || 'Account temporarily locked',
          lockoutUntil: data.lockoutUntil,
        };
      case 429:
        return {
          type: 'rate_limit',
          message: data.message || 'Too many requests. Please try again later.',
        };
      case 500:
        return {
          type: 'server',
          message: data.message || 'Internal server error. Please try again later.',
        };
      default:
        return {
          type: 'unknown',
          message: data.message || 'An unexpected error occurred',
        };
    }
  } else if (error.request) {
    // Request was made but no response received
    return {
      type: 'network',
      message: 'Network error. Please check your connection.',
    };
  } else {
    // Something else happened
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred',
    };
  }
};

// Request/Response logging removed for production

// Helper functions using centralized API configuration
export const apiHelpers = {
  // Get full URL for an endpoint
  getUrl: (endpointKey, params = {}) => {
    return API_CONFIG.getFullUrl(endpointKey, params);
  },

  // Make authenticated requests
  get: (endpointKey, params = {}, config = {}) => {
    const url = API_CONFIG.getFullUrl(endpointKey, params);
    return api.get(url, config);
  },

  post: (endpointKey, data = {}, params = {}, config = {}) => {
    const url = API_CONFIG.getFullUrl(endpointKey, params);
    return api.post(url, data, config);
  },

  put: (endpointKey, data = {}, params = {}, config = {}) => {
    const url = API_CONFIG.getFullUrl(endpointKey, params);
    return api.put(url, data, config);
  },

  patch: (endpointKey, data = {}, params = {}, config = {}) => {
    const url = API_CONFIG.getFullUrl(endpointKey, params);
    return api.patch(url, data, config);
  },

  delete: (endpointKey, params = {}, config = {}) => {
    const url = API_CONFIG.getFullUrl(endpointKey, params);
    return api.delete(url, config);
  },

  // Upload files
  upload: (endpointKey, formData, params = {}, config = {}) => {
    const url = API_CONFIG.getFullUrl(endpointKey, params);
    return api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    });
  },
};

// Export both the axios instance and helpers
export default api; 
