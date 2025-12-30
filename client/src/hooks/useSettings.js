import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../config/queryClient';
import settingsService from '../services/settingsService';
import { useToast } from './useToast';

/**
 * Hook to fetch user settings
 */
export function useUserSettings(options = {}) {
  return useQuery({
    queryKey: queryKeys.settings.user(),
    queryFn: () => settingsService.getUserSettings(false),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook to update profile settings
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (profileData) => settingsService.updateProfileSection(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.user() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
      showToast('Profile updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update profile', 'error');
    },
  });
}

/**
 * Hook to update account settings
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (accountData) => settingsService.updateAccountSection(accountData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.user() });
      showToast('Account settings updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update account settings', 'error');
    },
  });
}

/**
 * Hook to update privacy settings
 */
export function useUpdatePrivacy() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (privacyData) => settingsService.updatePrivacySettings(privacyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.user() });
      showToast('Privacy settings updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update privacy settings', 'error');
    },
  });
}

/**
 * Hook to update notification settings
 */
export function useUpdateNotifications() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (notificationData) => settingsService.updateNotificationsSection(notificationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.user() });
      showToast('Notification settings updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update notification settings', 'error');
    },
  });
}

/**
 * Hook to update AI preferences
 */
export function useUpdateAIPreferences() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (aiData) => settingsService.updateAISection(aiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.user() });
      showToast('AI preferences updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update AI preferences', 'error');
    },
  });
}

/**
 * Hook to update gamification settings
 */
export function useUpdateGamification() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (gamificationData) => settingsService.updateGamificationSection(gamificationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.user() });
      showToast('Gamification settings updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update gamification settings', 'error');
    },
  });
}

/**
 * Hook to update appearance settings
 */
export function useUpdateAppearance() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (appearanceData) => settingsService.updateAppearanceSection(appearanceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.user() });
      showToast('Appearance settings updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update appearance settings', 'error');
    },
  });
}

/**
 * Hook to update security settings
 */
export function useUpdateSecurity() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (securityData) => settingsService.updateSecurity(securityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.user() });
      showToast('Security settings updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update security settings', 'error');
    },
  });
}

/**
 * Hook to change password
 */
export function useChangePassword() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) => 
      settingsService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      showToast('Password changed successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to change password', 'error');
    },
  });
}
