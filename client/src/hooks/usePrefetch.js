import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import blogService from '../services/blogService';
import { userService } from '../services/userService';
import seriesService from '../services/seriesService';

/**
 * Hook to prefetch data on route hover
 * Usage: Add onMouseEnter={() => prefetch...} to Link components
 */

export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchBlog = (blogId) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.blogs.detail(blogId),
      queryFn: () => blogService.getBlogById(blogId),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchBlogBySlug = (slug) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.blogs.bySlug(slug),
      queryFn: () => blogService.getBlogBySlug(slug),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchUserProfile = (userId) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.user.profile(userId),
      queryFn: () => userService.getUserProfile(userId),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchSeries = (seriesId) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.series.detail(seriesId),
      queryFn: () => seriesService.getSeriesById(seriesId),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchDashboard = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(),
      queryFn: () => dashboardService.getUserStats(),
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    prefetchBlog,
    prefetchBlogBySlug,
    prefetchUserProfile,
    prefetchSeries,
    prefetchDashboard,
  };
}

/**
 * Component to prefetch route data on hover
 */
export function PrefetchLink({ to, prefetchFn, children, ...props }) {
  const handleMouseEnter = () => {
    if (prefetchFn) {
      prefetchFn();
    }
  };

  return (
    <Link to={to} onMouseEnter={handleMouseEnter} {...props}>
      {children}
    </Link>
  );
}

/**
 * Hook to prefetch critical data on route mount
 */
export function usePrefetchCriticalData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch user profile if authenticated
    const accessToken = sessionStorage.getItem('accessToken');
    if (accessToken) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.me(),
        queryFn: () => userService.getMyProfile(),
      });

      queryClient.prefetchQuery({
        queryKey: queryKeys.settings.user(),
        queryFn: () => settingsService.getUserSettings(false),
      });
    }
  }, [queryClient]);
}
