import { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import securityService from '../services/securityService';

// Cache keys for localStorage
const CACHE_KEYS = {
  USER_PROFILE: 'vocalink_user_profile',
  USER_PROFILE_TIMESTAMP: 'vocalink_user_profile_timestamp'
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Helper functions for caching
const getCachedUserProfile = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.USER_PROFILE);
    const timestamp = localStorage.getItem(CACHE_KEYS.USER_PROFILE_TIMESTAMP);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.warn('Failed to get cached user profile:', error);
  }
  return null;
};

const setCachedUserProfile = (profile) => {
  try {
    localStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(profile));
    localStorage.setItem(CACHE_KEYS.USER_PROFILE_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.warn('Failed to cache user profile:', error);
  }
};

const clearCachedUserProfile = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.USER_PROFILE);
    localStorage.removeItem(CACHE_KEYS.USER_PROFILE_TIMESTAMP);
  } catch (error) {
    console.warn('Failed to clear cached user profile:', error);
  }
};

// Initial state
const initialState = {
  user: null,
  userProfile: null, // Detailed user profile data
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: true, // Start with loading true to prevent premature redirects
  error: null,
  accountLocked: false,
  lockoutUntil: null,
  requiresVerification: false,
  twoFactorRequired: false,
  // Add pending 2FA credentials
  pending2FACredentials: {
    email: null,
    password: null
  }
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN_START: 'REFRESH_TOKEN_START',
  REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
  REFRESH_TOKEN_FAILURE: 'REFRESH_TOKEN_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
  SET_TWO_FACTOR_REQUIRED: 'SET_TWO_FACTOR_REQUIRED',
  SET_TWO_FACTOR_SETUP: 'SET_TWO_FACTOR_SETUP',
  SET_ACCOUNT_LOCKED: 'SET_ACCOUNT_LOCKED',
  SET_REQUIRES_VERIFICATION: 'SET_REQUIRES_VERIFICATION',
  UPDATE_USER: 'UPDATE_USER',
  // Add new actions for 2FA credentials
  STORE_2FA_CREDENTIALS: 'STORE_2FA_CREDENTIALS',
  CLEAR_2FA_CREDENTIALS: 'CLEAR_2FA_CREDENTIALS',
  RESET_LOGIN_ATTEMPT: 'RESET_LOGIN_ATTEMPT',
  SET_USER_PROFILE: 'SET_USER_PROFILE'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: !!(action.payload.accessToken && action.payload.refreshToken),
        loading: false,
        error: null,
        twoFactorRequired: false,
        pending2FACredentials: { email: null, password: null },
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        pending2FACredentials: { email: null, password: null },
      };
    case AUTH_ACTIONS.LOGOUT:
      // Clear cached user profile on logout
      clearCachedUserProfile();
      return {
        ...initialState,
        loading: false,
      };
    case AUTH_ACTIONS.REFRESH_TOKEN_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.REFRESH_TOKEN_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case AUTH_ACTIONS.SET_TWO_FACTOR_REQUIRED:
      return {
        ...state,
        twoFactorRequired: action.payload,
      };
    case AUTH_ACTIONS.SET_TWO_FACTOR_SETUP:
      return {
        ...state,
        twoFactorSetup: action.payload,
      };
    case AUTH_ACTIONS.SET_ACCOUNT_LOCKED:
      return {
        ...state,
        accountLocked: action.payload.locked,
        lockoutUntil: action.payload.lockoutUntil,
        error: action.payload.message,
      };
    case AUTH_ACTIONS.SET_REQUIRES_VERIFICATION:
      return {
        ...state,
        requiresVerification: action.payload.required,
        error: action.payload.message,
      };
    case AUTH_ACTIONS.STORE_2FA_CREDENTIALS:
      return {
        ...state,
        pending2FACredentials: {
          email: action.payload.email,
          password: action.payload.password,
        },
      };
    case AUTH_ACTIONS.CLEAR_2FA_CREDENTIALS:
      return {
        ...state,
        pending2FACredentials: {
          email: null,
          password: null,
        },
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case AUTH_ACTIONS.RESET_LOGIN_ATTEMPT:
      return {
        ...state,
        error: null,
        loading: false,
        accountLocked: false,
        lockoutUntil: null,
        requiresVerification: false,
        twoFactorRequired: false,
        pending2FACredentials: {
          email: null,
          password: null
        }
      };
    case AUTH_ACTIONS.SET_USER_PROFILE:
      // Cache the user profile when setting it
      if (action.payload) {
        setCachedUserProfile(action.payload);
      }
      return {
        ...state,
        userProfile: action.payload,
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

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        
        // Store current route before authentication check
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
          localStorage.setItem('intendedRoute', currentPath);
        }
        
        // Check for cached user profile first
        const cachedProfile = getCachedUserProfile();
        if (cachedProfile) {
          console.log('📦 Using cached user profile');
          dispatch({ type: AUTH_ACTIONS.SET_USER_PROFILE, payload: cachedProfile });
        }
        
        const tokens = authService.getStoredTokens();
        console.log('📦 Stored tokens found:', !!tokens.accessToken, !!tokens.refreshToken);
        console.log('🔑 Access token (first 20 chars):', tokens.accessToken ? tokens.accessToken.substring(0, 20) + '...' : 'none');
        
        if (tokens.accessToken && tokens.refreshToken) {
          // Set the auth header first
          authService.setAuthHeader(tokens.accessToken);
          console.log('🔑 Auth header set');
          
          // Immediately set authenticated state to prevent redirect during token verification
          dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user: null, ...tokens } });
          console.log('🔐 Optimistically set authenticated state');
          
          try {
            // Verify token and get user data
            console.log('👤 Fetching current user...');
            const user = await authService.getCurrentUser();
            console.log('👤 User data received:', user ? { email: user.email, id: user.id } : 'null');
            
            if (user) {
              // Token is valid, update with user data
              console.log('✅ User data retrieved:', user.email);
              dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, ...tokens } });
              console.log('🎉 Auth state restored successfully');
            } else {
              // User data not found, clear tokens
              console.warn('⚠️ User data not found, clearing tokens');
              authService.clearTokens();
              clearCachedUserProfile();
              dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            }
          } catch (error) {
            console.error('❌ Token verification failed:', error.message);
            // Token might be expired, try to refresh
            try {
              console.log('🔄 Attempting token refresh...');
              const refreshResult = await authService.refreshToken();
              if (refreshResult.success) {
                console.log('✅ Token refreshed successfully');
                const user = await authService.getCurrentUser();
                if (user) {
                  dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { 
                    user, 
                    accessToken: refreshResult.accessToken, 
                    refreshToken: refreshResult.refreshToken 
                  } });
                  console.log('🎉 Auth state restored after refresh');
                } else {
                  console.warn('⚠️ User data not found after refresh');
                  authService.clearTokens();
                  clearCachedUserProfile();
                  dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                }
              } else {
                console.error('❌ Token refresh failed:', refreshResult.error);
                authService.clearTokens();
                clearCachedUserProfile();
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
              }
            } catch (refreshError) {
              console.error('❌ Token refresh error:', refreshError.message);
              authService.clearTokens();
              clearCachedUserProfile();
              dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            }
          }
        } else {
          console.log('📝 No stored tokens found');
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Actions
  const actions = {
    // Login
    login: async (email, password, twoFactorToken = null) => {
      console.log('[AuthContext] login: Execution started.');
      try {
        dispatch({ type: AUTH_ACTIONS.LOGIN_START });
        console.log('[AuthContext] login: Calling authService.login...');
        const response = await authService.login(email, password, twoFactorToken);
        console.log('[AuthContext] login: authService.login responded successfully:', response);
        
        if (response.twoFactorRequired) {
          console.log('[AuthContext] login: 2FA required based on response. Dispatching SET_TWO_FACTOR_REQUIRED.');
          dispatch({ type: AUTH_ACTIONS.SET_TWO_FACTOR_REQUIRED, payload: true });
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          return { success: true, twoFactorRequired: true };
        }
        
        console.log('[AuthContext] login: Login successful. Dispatching LOGIN_SUCCESS.');
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response });
        
        return { success: true };
      } catch (error) {
        console.error('[AuthContext] login: Caught an error:', error);
        console.log('[AuthContext] login: Checking error properties...');
        console.log(`[AuthContext] login: Does error have twoFactorRequired? ${!!error.twoFactorRequired}`);
        console.log(`[AuthContext] login: Does error have accountLocked? ${!!error.accountLocked}`);
        console.log(`[AuthContext] login: Does error have requiresVerification? ${!!error.requiresVerification}`);

        // Handle specific error types
        if (error.accountLocked) {
          console.log('[AuthContext] login: Handling account locked error.');
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
          console.log('[AuthContext] login: Handling requires verification error.');
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
          console.log('[AuthContext] login: Handling 2FA required error. Dispatching SET_TWO_FACTOR_REQUIRED.');
          dispatch({ type: AUTH_ACTIONS.SET_TWO_FACTOR_REQUIRED, payload: true });
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          console.log('[AuthContext] login: Returning success with twoFactorRequired=true.');
          return { success: true, twoFactorRequired: true };
        }
        
        console.log('[AuthContext] login: Handling generic login failure. Dispatching LOGIN_FAILURE.');
        // Provide user-friendly error messages
        let errorMessage = error.message || 'Login failed';
        
        // Check if it's a non-existent email error
        if (errorMessage.includes('Invalid credentials')) {
          errorMessage = 'The email address or password you entered is incorrect. Please check your credentials and try again.';
        }
        
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // Register
    register: async (userData) => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        
        console.log('🔐 AuthContext: Starting registration for:', userData.email);
        const response = await authService.register(userData);
        console.log('🔐 AuthContext: AuthService response:', response);
        
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        
        // AuthService.register returns the server response directly if successful
        // Server response format: { success: true, message: "...", userId: "...", email: "...", isVerified: false }
        if (response && response.success) {
          console.log('✅ AuthContext: Registration successful');
          return { success: true, data: response };
        } else {
          console.error('❌ AuthContext: Registration failed - invalid response:', response);
          const errorMessage = response?.message || 'Registration failed';
          dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
          return { success: false, error: errorMessage };
        }
      } catch (error) {
        console.error('❌ AuthContext: Registration error caught:', error);
        const errorMessage = error.message || 'Registration failed';
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // Verify email
    verifyEmail: async (email, code) => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        
        const response = await authService.verifyEmail(email, code);
        
        if (response && response.success) {
          dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response });
          return { success: true, data: response };
        } else {
          const errorMessage = response?.message || 'Email verification failed';
          dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
          return { success: false, error: errorMessage };
        }
      } catch (error) {
        const errorMessage = error.message || 'Email verification failed';
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
        return { success: false, error: errorMessage };
      } finally {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
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
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
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
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
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
        const errorMessage = error.message || 'Failed to reset password';
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
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
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    // 2FA Methods
    setup2FA: async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        const response = await securityService.generate2FASecret();
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Failed to setup 2FA';
        return { success: false, error: errorMessage };
      }
    },

    verify2FASetup: async (token) => {
      try {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        const response = await securityService.enable2FA(token);
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Failed to verify 2FA setup';
        return { success: false, error: errorMessage };
      }
    },

    disable2FA: async (token, password) => {
      try {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        const response = await securityService.disable2FA(password, token);
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Failed to disable 2FA';
        return { success: false, error: errorMessage };
      }
    },

    // Session Management Methods
    getActiveSessions: async () => {
      try {
        const response = await securityService.getActiveSessions();
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Failed to get active sessions';
        return { success: false, error: errorMessage };
      }
    },

    revokeSession: async (sessionId) => {
      try {
        const response = await securityService.revokeSession(sessionId);
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Failed to revoke session';
        return { success: false, error: errorMessage };
      }
    },

    revokeAllSessions: async () => {
      try {
        const response = await securityService.revokeAllSessions();
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Failed to revoke all sessions';
        return { success: false, error: errorMessage };
      }
    },

    // Data Export and Account Management
    exportUserData: async () => {
      try {
        const response = await securityService.exportUserData();
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Failed to export user data';
        return { success: false, error: errorMessage };
      }
    },

    deleteAccount: async (password, confirmText) => {
      try {
        const response = await securityService.deleteAccount(password, confirmText);
        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || 'Failed to delete account';
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

    // Refresh token
    refreshToken: async () => {
      try {
        const response = await authService.refreshToken();
        dispatch({ type: AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS, payload: response });
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
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user } });
        return { success: true, user };
      } catch (error) {
        console.error('Get current user failed:', error);
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
        return { success: false, error: error.message };
      }
    },

    // Store 2FA credentials
    store2FACredentials: (email, password) => {
      dispatch({ 
        type: AUTH_ACTIONS.STORE_2FA_CREDENTIALS, 
        payload: { email, password } 
      });
    },

    // Clear 2FA credentials
    clear2FACredentials: () => {
      dispatch({ type: AUTH_ACTIONS.CLEAR_2FA_CREDENTIALS });
    },

    resetLoginAttempt: () => {
      dispatch({ type: AUTH_ACTIONS.RESET_LOGIN_ATTEMPT });
    },

    setTwoFactorRequired: (isRequired) => {
      dispatch({ type: AUTH_ACTIONS.SET_TWO_FACTOR_REQUIRED, payload: isRequired });
    },

    // Fetch user profile data with caching
    fetchUserProfile: async (forceRefresh = false) => {
      try {
        // Check cache first unless force refresh is requested
        if (!forceRefresh) {
          const cachedProfile = getCachedUserProfile();
          if (cachedProfile) {
            console.log('📦 Using cached user profile, skipping API call');
            dispatch({ type: AUTH_ACTIONS.SET_USER_PROFILE, payload: cachedProfile });
            return { success: true, profile: cachedProfile, fromCache: true };
          }
        }
        
        console.log('🚀 Fetching fresh user profile from API');
        const profile = await userService.getMyProfile();
        dispatch({ type: AUTH_ACTIONS.SET_USER_PROFILE, payload: profile });
        return { success: true, profile, fromCache: false };
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        return { success: false, error: error.message };
      }
    },

    // Clear user profile cache
    clearUserProfileCache: () => {
      clearCachedUserProfile();
      dispatch({ type: AUTH_ACTIONS.SET_USER_PROFILE, payload: null });
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
