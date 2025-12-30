import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { userService } from '../services/userService';
import { useToast } from './useToast';

/**
 * Hook to fetch current user profile
 */
export function useMyProfile(options = {}) {
  return useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: () => userService.getMyProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch user profile by ID
 */
export function useUserProfile(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: () => userService.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (profileData) => userService.updateProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.user() });
      showToast('Profile updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update profile', 'error');
    },
  });
}

/**
 * Hook to fetch user blogs
 */
export function useUserBlogs(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.user.blogs(userId),
    queryFn: () => userService.getUserBlogs(userId),
    enabled: !!userId,
    ...options,
  });
}

/**
 * Hook to fetch user badges
 */
export function useUserBadges(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.user.badges(userId),
    queryFn: () => userService.getUserBadges(userId),
    enabled: !!userId,
    ...options,
  });
}

/**
 * Hook to follow/unfollow user
 */
export function useFollowUser() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ userId, action }) => 
      action === 'follow' 
        ? userService.followUser(userId)
        : userService.unfollowUser(userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile(variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
      showToast(
        variables.action === 'follow' ? 'User followed successfully' : 'User unfollowed successfully',
        'success'
      );
    },
    onError: (error) => {
      showToast(error.message || 'Action failed', 'error');
    },
  });
}
