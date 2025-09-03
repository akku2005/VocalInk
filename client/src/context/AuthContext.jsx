import { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

// Initial state
const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  isVerifying: false,
  error: null,
  twoFactorRequired: false,
  twoFactorSetup: false,
  accountLocked: false,
  lockoutUntil: null,
  requiresVerification: false,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_TOKENS: 'SET_TOKENS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOGOUT: 'LOGOUT',
  SET_VERIFYING: 'SET_VERIFYING',
  SET_2FA_REQUIRED: 'SET_2FA_REQUIRED',
  SET_2FA_SETUP: 'SET_2FA_SETUP',
  UPDATE_USER: 'UPDATE_USER',
  SET_ACCOUNT_LOCKED: 'SET_ACCOUNT_LOCKED',
  SET_REQUIRES_VERIFICATION: 'SET_REQUIRES_VERIFICATION',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case AUTH_ACTIONS.SET_USER:
      return { 
        ...state, 
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null 
      };
    
    case AUTH_ACTIONS.SET_TOKENS:
      return { 
        ...state, 
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null 
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return { 
        ...state, 
        error: action.payload,
        isLoading: false,
        isVerifying: false 
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { 
        ...state, 
        error: null,
        accountLocked: false,
        lockoutUntil: null,
        requiresVerification: false
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return { 
        ...initialState, 
        isLoading: false 
      };
    
    case AUTH_ACTIONS.SET_VERIFYING:
      return { ...state, isVerifying: action.payload };
    
    case AUTH_ACTIONS.SET_2FA_REQUIRED:
      return { ...state, twoFactorRequired: action.payload };
    
    case AUTH_ACTIONS.SET_2FA_SETUP:
      return { ...state, twoFactorSetup: action.payload };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return { ...state, user: { ...state.user, ...action.payload } };
    
    case AUTH_ACTIONS.SET_ACCOUNT_LOCKED:
      return { 
        ...state, 
        accountLocked: action.payload.locked,
        lockoutUntil: action.payload.lockoutUntil,
        error: action.payload.message
      };
    
    case AUTH_ACTIONS.SET_REQUIRES_VERIFICATION:
      return { 
        ...state, 
        requiresVerification: action.payload.required,
        error: action.payload.message
      };
    
    default:
      return state;
  }
};

// Create context
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        
        const tokens = authService.getStoredTokens();
        console.log('📦 Stored tokens found:', !!tokens.accessToken, !!tokens.refreshToken);
        console.log('🔑 Access token (first 20 chars):', tokens.accessToken ? tokens.accessToken.substring(0, 20) + '...' : 'none');
        
        if (tokens.accessToken && tokens.refreshToken) {
          // Set the auth header first
          authService.setAuthHeader(tokens.accessToken);
          console.log('🔑 Auth header set');
          
          try {
            // Verify token and get user data
            console.log('👤 Fetching current user...');
            const user = await authService.getCurrentUser();
            console.log('👤 User data received:', user ? { email: user.email, id: user.id } : 'null');
            
            if (user) {
              // Token is valid, restore auth state
              console.log('✅ User data retrieved:', user.email);
              dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
              dispatch({ type: AUTH_ACTIONS.SET_TOKENS, payload: tokens });
              console.log('🎉 Auth state restored successfully');
            } else {
              // User data not found, clear tokens
              console.warn('⚠️ User data not found, clearing tokens');
              authService.clearTokens();
              dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            }
          } catch (error) {
            console.error('❌ Token validation failed:', error);
            console.error('❌ Error details:', {
              message: error.message,
              status: error.response?.status,
              data: error.response?.data,
              stack: error.stack
            });
            
            // If it's a 401 error, try to refresh the token
            if (error.response?.status === 401) {
              try {
                console.log('🔄 Attempting to refresh token...');
                const refreshResult = await authService.refreshToken();
                console.log('🔄 Refresh result:', refreshResult);
                
                if (refreshResult.success) {
                  // Token refreshed successfully, get user data
                  console.log('✅ Token refreshed successfully');
                  const user = await authService.getCurrentUser();
                  if (user) {
                    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
                    dispatch({ type: AUTH_ACTIONS.SET_TOKENS, payload: {
                      accessToken: refreshResult.accessToken,
                      refreshToken: refreshResult.refreshToken
                    }});
                    console.log('🎉 Auth state restored after token refresh');
                    return;
                  }
                }
              } catch (refreshError) {
                console.error('❌ Token refresh failed:', refreshError);
                console.error('❌ Refresh error details:', {
                  message: refreshError.message,
                  status: refreshError.response?.status,
                  data: refreshError.response?.data
                });
              }
            }
            
            // Clear invalid tokens
            console.log('🧹 Clearing invalid tokens');
            authService.clearTokens();
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        } else {
          // No tokens found
          console.log('📭 No tokens found, user not authenticated');
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('💥 Auth initialization error:', error);
        console.error('💥 Error details:', {
          message: error.message,
          stack: error.stack
        });
        authService.clearTokens();
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Actions
  const actions = {
    // Login
    login: async (email, password, twoFactorToken = null) => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        
        const response = await authService.login(email, password, twoFactorToken);
        
        if (response.twoFactorRequired) {
          // 2FA required
          dispatch({ type: AUTH_ACTIONS.SET_2FA_REQUIRED, payload: true });
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          return { success: true, twoFactorRequired: true };
        }
        
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.user });
        dispatch({ type: AUTH_ACTIONS.SET_TOKENS, payload: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        }});
        
        return { success: true };
      } catch (error) {
        // Handle specific error types
        if (error.accountLocked) {
          dispatch({ 
            type: AUTH_ACTIONS.SET_ACCOUNT_LOCKED, 
            payload: { 
              locked: true, 
              lockoutUntil: error.lockoutUntil,
              message: error.message
            } 
          });
          return { success: false, accountLocked: true, error: error.message };
        }
        
        if (error.requiresVerification) {
          dispatch({ 
            type: AUTH_ACTIONS.SET_REQUIRES_VERIFICATION, 
            payload: { 
              required: true, 
              message: error.message 
            } 
          });
          return { success: false, requiresVerification: true, error: error.message };
        }
        
        if (error.twoFactorRequired) {
          dispatch({ type: AUTH_ACTIONS.SET_2FA_REQUIRED, payload: true });
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          return { success: true, twoFactorRequired: true };
        }
        
        // Provide user-friendly error messages
        let errorMessage = error.message || 'Login failed';
        
        // Check if it's a non-existent email error
        if (errorMessage.includes('Invalid credentials')) {
          errorMessage = 'The email address or password you entered is incorrect. Please check your credentials and try again.';
        }
        
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // Register
    register: async (userData) => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        
        const response = await authService.register(userData);
        
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Registration failed';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // Verify email
    verifyEmail: async (email, code) => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_VERIFYING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        
        const response = await authService.verifyEmail(email, code);
        
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.user });
        dispatch({ type: AUTH_ACTIONS.SET_TOKENS, payload: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        }});
        
        return { success: true };
      } catch (error) {
        const errorMessage = error.message || 'Email verification failed';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // Resend verification
    resendVerification: async (email) => {
      try {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        const response = await authService.resendVerification(email);
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Failed to resend verification';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // Forgot password
    forgotPassword: async (email) => {
      try {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        const response = await authService.forgotPassword(email);
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Failed to send password reset';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // Reset password
    resetPassword: async (token, code, newPassword) => {
      try {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        const response = await authService.resetPassword(token, code, newPassword);
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Password reset failed';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // Change password
    changePassword: async (currentPassword, newPassword) => {
      try {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        const response = await authService.changePassword(currentPassword, newPassword);
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Password change failed';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // 2FA Setup
    setup2FA: async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        const response = await authService.setup2FA();
        dispatch({ type: AUTH_ACTIONS.SET_2FA_SETUP, payload: response });
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || '2FA setup failed';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // Verify 2FA Setup
    verify2FASetup: async (token) => {
      try {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        const response = await authService.verify2FASetup(token);
        
        // Update user with 2FA enabled
        dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: { twoFactorEnabled: true } });
        dispatch({ type: AUTH_ACTIONS.SET_2FA_SETUP, payload: false });
        
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || '2FA verification failed';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // Disable 2FA
    disable2FA: async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        const response = await authService.disable2FA();
        
        // Update user with 2FA disabled
        dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: { twoFactorEnabled: false } });
        
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Failed to disable 2FA';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // Logout
    logout: async () => {
      try {
        await authService.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    },

    // Logout all devices
    logoutAll: async () => {
      try {
        await authService.logoutAll();
      } catch (error) {
        console.error('Logout all error:', error);
      } finally {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    },

    // Clear error
    clearError: () => {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    },

    // Complete 2FA login - This method is deprecated since backend doesn't support it
    // Users should provide 2FA token during initial login
    complete2FALogin: async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        
        // Since the backend doesn't support separate 2FA completion,
        // we need to handle this differently
        const response = await authService.complete2FALogin();
        
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.user });
        dispatch({ type: AUTH_ACTIONS.SET_TOKENS, payload: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        }});
        dispatch({ type: AUTH_ACTIONS.SET_2FA_REQUIRED, payload: false });
        
        return { success: true };
      } catch (error) {
        const errorMessage = error.message || '2FA verification failed';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // Refresh token
    refreshToken: async () => {
      try {
        const response = await authService.refreshToken();
        dispatch({ type: AUTH_ACTIONS.SET_TOKENS, payload: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        }});
        return { success: true };
      } catch (error) {
        console.error('Token refresh failed:', error);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        return { success: false, error: 'Session expired' };
      }
    },

    // Get current user
    getCurrentUser: async () => {
      try {
        const user = await authService.getCurrentUser();
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        return { success: true, user };
      } catch (error) {
        console.error('Get current user failed:', error);
        return { success: false, error: error.message };
      }
    },
  };

  const value = {
    ...state,
    ...actions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};