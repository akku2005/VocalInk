import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Configuration
 * 
 * Centralized configuration for React Query with sensible defaults
 * for caching, refetching, and error handling.
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache settings
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 mins
      gcTime: 10 * 60 * 1000, // 10 minutes - cache kept for 10 mins (formerly cacheTime)
      
      // Refetching behavior
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch on reconnect
      refetchOnMount: true, // Refetch on component mount
      
      // Retry configuration
      retry: 1, // Retry failed requests once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Error handling
      useErrorBoundary: false, // Don't throw errors to error boundaries by default
      
      // Suspense
      suspense: false, // Don't use suspense by default
    },
    mutations: {
      // Retry configuration for mutations
      retry: 0, // Don't retry mutations by default
      
      // Error handling
      useErrorBoundary: false,
      
      // Default error handler
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

/**
 * Query Keys
 * Centralized query key factory for consistent cache management
 */
export const queryKeys = {
  // User queries
  user: {
    all: ['users'],
    me: () => [...queryKeys.user.all, 'me'],
    profile: (userId) => [...queryKeys.user.all, 'profile', userId],
    blogs: (userId) => [...queryKeys.user.all, userId, 'blogs'],
    badges: (userId) => [...queryKeys.user.all, userId, 'badges'],
    stats: (userId) => [...queryKeys.user.all, userId, 'stats'],
  },
  
  // Settings queries
  settings: {
    all: ['settings'],
    user: () => [...queryKeys.settings.all, 'user'],
    profile: () => [...queryKeys.settings.all, 'profile'],
    account: () => [...queryKeys.settings.all, 'account'],
    privacy: () => [...queryKeys.settings.all, 'privacy'],
    notifications: () => [...queryKeys.settings.all, 'notifications'],
    ai: () => [...queryKeys.settings.all, 'ai'],
    gamification: () => [...queryKeys.settings.all, 'gamification'],
    appearance: () => [...queryKeys.settings.all, 'appearance'],
    security: () => [...queryKeys.settings.all, 'security'],
  },
  
  // Security queries
  security: {
    all: ['security'],
    sessions: () => [...queryKeys.security.all, 'sessions'],
    backupCodes: () => [...queryKeys.security.all, 'backup-codes'],
  },
  
  // Blog queries
  blogs: {
    all: ['blogs'],
    list: (filters) => [...queryKeys.blogs.all, 'list', filters],
    detail: (id) => [...queryKeys.blogs.all, 'detail', id],
    bySlug: (slug) => [...queryKeys.blogs.all, 'slug', slug],
  },
  
  // Series queries
  series: {
    all: ['series'],
    list: (filters) => [...queryKeys.series.all, 'list', filters],
    detail: (id) => [...queryKeys.series.all, 'detail', id],
  },
  
  // Badge queries
  badges: {
    all: ['badges'],
    list: () => [...queryKeys.badges.all, 'list'],
    detail: (id) => [...queryKeys.badges.all, 'detail', id],
    progress: () => [...queryKeys.badges.all, 'progress'],
  },
  
  // Notification queries
  notifications: {
    all: ['notifications'],
    list: (params) => [...queryKeys.notifications.all, 'list', params],
    unread: () => [...queryKeys.notifications.all, 'unread'],
  },
  
  // Dashboard queries
  dashboard: {
    all: ['dashboard'],
    stats: () => [...queryKeys.dashboard.all, 'stats'],
    analytics: () => [...queryKeys.dashboard.all, 'analytics'],
  },
};

/**
 * Helper function to invalidate related queries
 */
export const invalidateQueries = {
  userProfile: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.me() }),
  userSettings: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.all }),
  userBlogs: (userId) => queryClient.invalidateQueries({ queryKey: queryKeys.user.blogs(userId) }),
  allBlogs: () => queryClient.invalidateQueries({ queryKey: queryKeys.blogs.all }),
  sessions: () => queryClient.invalidateQueries({ queryKey: queryKeys.security.sessions() }),
};

export default queryClient;
