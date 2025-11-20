import api, { apiHelpers } from './api';
import API_CONFIG from '../constants/apiConfig';
import { storage, sessionStorageHelper, cookieStorage } from '../utils/storage';
import locationService from './locationService';

class AuthService {
  constructor() {
    // No longer need baseURL - using centralized config
  }

  // Token management
  getStoredTokens() {
    const accessToken = sessionStorageHelper.getItem('accessToken');
    const refreshToken = sessionStorageHelper.getItem('refreshToken');
    return { accessToken, refreshToken };
  }

  setStoredTokens(accessToken, refreshToken) {
    sessionStorageHelper.setItem('accessToken', accessToken);
    sessionStorageHelper.setItem('refreshToken', refreshToken);
    cookieStorage.setItem('accessToken', accessToken, { path: '/', sameSite: 'Lax', secure: true });
    cookieStorage.setItem('refreshToken', refreshToken, { path: '/', sameSite: 'Lax', secure: true });
  }

  clearTokens() {
    sessionStorageHelper.removeItem('accessToken');
    sessionStorageHelper.removeItem('refreshToken');
    cookieStorage.removeItem('accessToken');
    cookieStorage.removeItem('refreshToken');
  }

  // Set auth header for requests
  setAuthHeader(token) {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }

  // Registration
  async register(userData) {
    try {
      const response = await apiHelpers.post('AUTH.REGISTER', userData);

      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Registration failed');
        throw error;
      }
    } catch (error) {
      
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Registration failed');
        throw customError;
      }
      
      throw this.handleError(error);
    }
  }

  // Login
  async login(email, password, twoFactorToken = null) {
    try {
      // Ensure device fingerprint exists (stored locally for frontend use)
      this.ensureDeviceFingerprint();
      
      const loginData = { 
        email, 
        password
      };
      
      if (twoFactorToken) {
        loginData.twoFactorToken = twoFactorToken;
      }

      await locationService.captureLocation();
      const response = await apiHelpers.post('AUTH.LOGIN', loginData);
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        const { accessToken, refreshToken, deviceFingerprint: serverFingerprint } = response.data;
        
        // Store tokens only if login is completely successful
        this.setStoredTokens(accessToken, refreshToken);
        this.setAuthHeader(accessToken);
        
        // Store device fingerprint for security (use server's if provided, otherwise use local)
        if (serverFingerprint) {
          sessionStorageHelper.setItem('deviceFingerprint', serverFingerprint);
        }
        
        return response.data;
      } else {
        // Backend returned success: false in the response body
        // This means the request was successful but authentication failed
        const error = new Error(response.data.message || 'Login failed');
        
        // Add specific error properties for the frontend to handle
        if (response.data.twoFactorRequired) {
          error.twoFactorRequired = true;
        }
        if (response.data.requiresVerification) {
          error.requiresVerification = true;
        }
        if (response.data.accountLocked) {
          error.accountLocked = true;
          error.lockoutUntil = response.data.lockoutUntil;
        }
        
        // Improve error message for better user experience
        if (response.data.message === 'Invalid credentials') {
          error.message = 'The email address or password you entered is incorrect. Please check your credentials and try again.';
        }
        
        throw error;
      }
    } catch (error) {
      
      // If it's already our custom error, re-throw it
      if (error.twoFactorRequired || error.requiresVerification || error.accountLocked) {
        throw error;
      }
      
      // If it's an HTTP error (like 401, 500, etc.), handle it
      if (error.response) {
        // Check if the error response has specific error data
        if (error.response.data && !error.response.data.success) {
          const errorData = error.response.data;
          let errorMessage = errorData.message || 'Login failed';
          
          // Improve error message for better user experience
          if (errorMessage === 'Invalid credentials') {
            errorMessage = 'The email address or password you entered is incorrect. Please check your credentials and try again.';
          }
          
          const customError = new Error(errorMessage);
          
          // Add specific error properties
          if (errorData.twoFactorRequired) {
            customError.twoFactorRequired = true;
          }
          if (errorData.requiresVerification) {
            customError.requiresVerification = true;
          }
          if (errorData.accountLocked) {
            customError.accountLocked = true;
            customError.lockoutUntil = errorData.lockoutUntil;
          }
          
          throw customError;
        }
      }
      
      // Otherwise, handle it as a regular error
      throw this.handleError(error);
    }
  }

  // Complete 2FA login (when 2FA is required after initial login)
  // Note: This endpoint doesn't exist in the backend, so we need to handle 2FA during login
  async complete2FALogin() {
    try {
      // Since the backend doesn't have a separate 2FA completion endpoint,
      // we need to handle this differently. The backend expects 2FA token during login.
      // This method should not be called directly - 2FA should be handled in the login flow.
      throw new Error('2FA completion should be handled during login. Please use the login method with 2FA token.');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Email verification
  async verifyEmail(email, code) {
    try {
      const response = await apiHelpers.post('AUTH.VERIFY_EMAIL', { email, code });
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        const { accessToken, refreshToken, deviceFingerprint } = response.data;
        this.setStoredTokens(accessToken, refreshToken);
        this.setAuthHeader(accessToken);
        
        // Store device fingerprint for security
          if (deviceFingerprint) {
            sessionStorageHelper.setItem('deviceFingerprint', deviceFingerprint);
          }
        
        return response.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Email verification failed');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Email verification failed');
        throw customError;
      }
      
      throw this.handleError(error);
    }
  }

  // Resend verification code
  async resendVerification(email) {
    try {
      // FIXED: Use apiHelpers instead of this.baseURL
      const response = await apiHelpers.post('AUTH.RESEND_VERIFICATION', { email });
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to resend verification');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to resend verification');
        throw customError;
      }
      
      throw this.handleError(error);
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await apiHelpers.post('AUTH.FORGOT_PASSWORD', { email });
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to send password reset');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to send password reset');
        throw customError;
      }
      
      throw this.handleError(error);
    }
  }

  // Reset password
  async resetPassword(token, code, newPassword) {
    try {
      const response = await apiHelpers.post('AUTH.RESET_PASSWORD', {
        token,
        code,
        newPassword
      });
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Password reset failed');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Password reset failed');
        throw customError;
      }
      
      throw this.handleError(error);
    }
  }

  // Change password (authenticated)
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiHelpers.post('AUTH.CHANGE_PASSWORD', {
        currentPassword,
        newPassword
      });
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Password change failed');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Password change failed');
        throw customError;
      }
      
      throw this.handleError(error);
    }
  }

  // 2FA Setup
  async setup2FA() {
    try {
      const response = await apiHelpers.post('AUTH.SETUP_2FA');
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || '2FA setup failed');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || '2FA setup failed');
        throw customError;
      }
      
      throw this.handleError(error);
    }
  }

  // Verify 2FA Setup
  async verify2FASetup(token) {
    try {
      const response = await apiHelpers.post('AUTH.VERIFY_2FA', { token });
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || '2FA verification failed');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || '2FA verification failed');
        throw customError;
      }
      
      throw this.handleError(error);
    }
  }

  // Disable 2FA
  async disable2FA(token) {
    try {
      const response = await apiHelpers.post('AUTH.DISABLE_2FA', { token });
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to disable 2FA');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to disable 2FA');
        throw customError;
      }
      
      throw this.handleError(error);
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await apiHelpers.get('AUTH.ME');
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        // Backend returns user data in response.data.data
        const userData = response.data.data;
        return userData;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to get current user');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to get current user');
        throw customError;
      }
      
      throw this.handleError(error);
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = sessionStorageHelper.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiHelpers.post('AUTH.REFRESH', {
        refreshToken
      });

      // Check if the response indicates success or failure
      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        this.setStoredTokens(accessToken, newRefreshToken);
        this.setAuthHeader(accessToken);
        return response.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Token refresh failed');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Token refresh failed');
        throw customError;
      }
      
      throw this.handleError(error);
    }
  }

  // Logout
  async logout() {
    try {
      await apiHelpers.post('AUTH.LOGOUT');
    } catch (error) {
      // Silently handle logout errors
    } finally {
      this.clearTokens();
      this.setAuthHeader(null);
      // Clear device fingerprint
      sessionStorageHelper.removeItem('deviceFingerprint');
    }
  }

  // Logout all devices
  async logoutAll() {
    try {
      await apiHelpers.post('AUTH.LOGOUT_ALL');
    } catch (error) {
      // Silently handle logout errors
    } finally {
      this.clearTokens();
      this.setAuthHeader(null);
      // Clear device fingerprint
      sessionStorageHelper.removeItem('deviceFingerprint');
    }
  }

  // Get user sessions
  async getUserSessions() {
    try {
      const response = await apiHelpers.get('AUTH.SESSIONS');
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to get user sessions');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to get user sessions');
        throw customError;
      }
      
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Invalid request data');
        case 401:
          // Handle specific 2FA and verification requirements
          if (data.twoFactorRequired) {
            const customError = new Error(data.message || 'Two-factor authentication code required');
            customError.twoFactorRequired = true;
            return customError;
          }
          if (data.requiresVerification) {
            const customError = new Error(data.message || 'Email verification required');
            customError.requiresVerification = true;
            return customError;
          }
          return new Error(data.message || 'Authentication required');
        case 403:
          return new Error(data.message || 'Access forbidden');
        case 404:
          return new Error(data.message || 'Resource not found');
        case 423: {
          // Handle account lockout
          const customError = new Error(data.message || 'Account locked');
          customError.accountLocked = true;
          customError.lockoutUntil = data.lockoutUntil;
          return customError;
        }
        case 429:
          return new Error(data.message || 'Too many requests');
        case 500:
          return new Error(data.message || 'Internal server error');
        default:
          return new Error(data.message || 'An unexpected error occurred');
      }
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const tokens = this.getStoredTokens();
    return !!(tokens.accessToken && tokens.refreshToken);
  }

  // Get stored access token
  getAccessToken() {
    return storage.getItem('accessToken');
  }

  // Get device fingerprint
  getDeviceFingerprint() {
    return sessionStorageHelper.getItem('deviceFingerprint');
  }

  // Generate and store a consistent device fingerprint
  generateDeviceFingerprint() {
    // Generate a consistent device fingerprint based on browser capabilities
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown',
      navigator.maxTouchPoints || 'unknown'
    ];
    
    const fingerprintString = components.filter(Boolean).join('|');
    const fingerprint = btoa(fingerprintString).slice(0, 32); // Base64 encode and truncate
    
    // Store the fingerprint
    sessionStorageHelper.setItem('deviceFingerprint', fingerprint);
    return fingerprint;
  }

  // Ensure device fingerprint exists
  ensureDeviceFingerprint() {
    let fingerprint = this.getDeviceFingerprint();
    if (!fingerprint) {
      fingerprint = this.generateDeviceFingerprint();
    }
    return fingerprint;
  }

  // Initialize auth state
  async initializeAuth() {
    try {
      // Ensure device fingerprint exists
      this.ensureDeviceFingerprint();
      
      const tokens = this.getStoredTokens();
      if (tokens.accessToken) {
        this.setAuthHeader(tokens.accessToken);
        const user = await this.getCurrentUser();
        return { user, tokens };
      }
      return null;
    } catch (error) {
      this.clearTokens();
      this.setAuthHeader(null);
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService; 
