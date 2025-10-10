import api from './api';

class SettingsService {
  constructor() {
    // FIXED: Removed hardcoded baseURL and xpURL
    this.cache = null;
    this.cacheTimestamp = null;
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes - increased cache time
    
    // Try to restore cache from localStorage on initialization
    this.restoreCacheFromStorage();
  }

  // Save cache to localStorage
  saveCacheToStorage() {
    if (this.cache && this.cacheTimestamp) {
      try {
        localStorage.setItem('vocalink_settings_cache', JSON.stringify({
          data: this.cache,
          timestamp: this.cacheTimestamp
        }));
      } catch (error) {
        console.warn('Failed to save settings cache to localStorage:', error);
      }
    }
  }

  // Restore cache from localStorage
  restoreCacheFromStorage() {
    try {
      const cached = localStorage.getItem('vocalink_settings_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid
        if (now - timestamp < this.cacheExpiry) {
          this.cache = data;
          this.cacheTimestamp = timestamp;
        } else {
          // Cache expired, remove it
          localStorage.removeItem('vocalink_settings_cache');
        }
      }
    } catch (error) {
      console.warn('Failed to restore settings cache from localStorage:', error);
      localStorage.removeItem('vocalink_settings_cache');
    }
  }

  // Get user's current settings from profile
  async getUserSettings(forceRefresh = false) {
    try {
      // Check cache first unless forced refresh
      if (!forceRefresh && this.cache && this.cacheTimestamp) {
        const now = Date.now();
        if (now - this.cacheTimestamp < this.cacheExpiry) {
          return this.cache;
        }
      }
      // Use the new settings endpoint instead of /users/me
      const response = await api.get('/settings');
      
      if (response.data.success) {
        const settingsData = response.data.data;
        
        // Cache the result directly since backend now returns proper structure
        this.cache = settingsData;
        this.cacheTimestamp = Date.now();
        
        // Save to localStorage for persistence across page refreshes
        this.saveCacheToStorage();
        
        return settingsData;
      } else {
        throw new Error(response.data.message || 'Failed to get user settings');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to get user settings');
      }
      throw error;
    }
  }

  // Clear cache when settings are updated
  clearCache() {
    this.cache = null;
    this.cacheTimestamp = null;
    // Also remove from localStorage
    try {
      localStorage.removeItem('vocalink_settings_cache');
    } catch (error) {
      console.warn('Failed to clear settings cache from localStorage:', error);
    }
  }

  // Update user profile settings
  async updateProfileSettings(profileData) {
    try {
      const response = await api.patch('/settings/profile', profileData);
      
      if (response.data.success) {
        // Clear cache when settings are updated
        this.clearCache();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update profile settings');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to update profile settings');
      }
      throw error;
    }
  }

  // Update gamification settings
  async updateGamificationSettings(gamificationSettings) {
    try {
      const response = await api.patch('/settings/gamification', gamificationSettings);
      
      if (response.data.success) {
        // Clear cache when settings are updated
        this.clearCache();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update gamification settings');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to update gamification settings');
      }
      throw error;
    }
  }

  // Update privacy settings
  async updatePrivacySettings(privacySettings) {
    try {
      const response = await api.patch('/settings/privacy', privacySettings);
      
      if (response.data.success) {
        // Clear cache when settings are updated
        this.clearCache();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update privacy settings');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to update privacy settings');
      }
      throw error;
    }
  }

  // Update AI preferences
  async updateAIPreferences(aiPreferences) {
    try {
      const response = await api.patch('/settings/ai', aiPreferences);
      
      if (response.data.success) {
        // Clear cache when settings are updated
        this.clearCache();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update AI preferences');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to update AI preferences');
      }
      throw error;
    }
  }

  // Get notification preferences
  async getNotificationPreferences() {
    try {
      const response = await api.get('/notifications/preferences');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get notification preferences');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to get notification preferences');
      }
      throw error;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(notificationSettings) {
    try {
      const response = await api.patch('/settings/notifications', notificationSettings);
      
      if (response.data.success) {
        this.clearCache();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update notification preferences');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to update notification preferences');
      }
      throw error;
    }
  }

  // Change password - FIXED: Use correct endpoint
  async changePassword(passwordData) {
    try {
      const response = await api.patch('/settings/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to change password');
      }
      throw error;
    }
  }

  // Enable/disable two-factor authentication
  async toggleTwoFactor(enabled) {
    try {
      const response = await api.patch(`${this.baseURL}/me`, {
        twoFactorEnabled: enabled
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update two-factor authentication');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to update two-factor authentication');
      }
      throw error;
    }
  }

  // Enable two-factor authentication - FIXED: Use correct endpoint
  async enable2FA() {
    try {
      const response = await api.post('/settings/2fa/enable');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to enable two-factor authentication');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to enable two-factor authentication');
      }
      throw error;
    }
  }

  // Disable two-factor authentication - FIXED: Use correct endpoint
  async disable2FA() {
    try {
      const response = await api.post('/settings/2fa/disable');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to disable two-factor authentication');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to disable two-factor authentication');
      }
      throw error;
    }
  }

  // Terminate all sessions - FIXED: Use correct endpoint
  async terminateAllSessions() {
    try {
      const response = await api.delete('/settings/sessions');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to terminate sessions');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to terminate sessions');
      }
      throw error;
    }
  }

  // Update security settings - FIXED: Use correct endpoint
  async updateSecuritySettings(securitySettings) {
    try {
      const response = await api.patch('/settings/security', {
        ...securitySettings
      });
      
      if (response.data.success) {
        // Clear cache to force fresh data on next load
        this.clearCache();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update security settings');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to update security settings');
      }
      throw error;
    }
  }

  // Delete account
  async deleteAccount(confirmation) {
    try {
      const response = await api.delete(`${this.baseURL}/me`, {
        data: { confirmation }
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete account');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to delete account');
      }
      throw error;
    }
  }

  // Legacy method - no longer needed since backend returns proper structure
  // Kept for backward compatibility but now just returns data as-is
  transformBackendToFrontend(userData) {
    console.log('🔍 DEBUG: Backend data already in correct format:', userData);
    return userData;
  }

  // Legacy method - no longer needed since backend expects proper structure
  // Kept for backward compatibility but now just returns data as-is
  transformFrontendToBackend(settings) {
    console.log('🔍 DEBUG: Frontend data already in correct format:', settings);
    return settings;
  }

  // Generic settings section update method
  async updateSettingsSection(section, data) {
    try {
      const response = await api.patch(`/settings/${section}`, data);
      
      if (response.data.success) {
        // Clear cache when settings are updated
        this.clearCache();
        return response.data.data;
      } else {
        throw new Error(response.data.message || `Failed to update ${section} settings`);
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || `Failed to update ${section} settings`);
      }
      throw error;
    }
  }

  // Specific section update methods
  async updateProfileSection(profileData) {
    return this.updateSettingsSection('profile', profileData);
  }

  async updateAccountSection(accountData) {
    return this.updateSettingsSection('account', accountData);
  }

  async updatePrivacySection(privacyData) {
    return this.updateSettingsSection('privacy', privacyData);
  }

  async updateNotificationsSection(notificationData) {
    return this.updateSettingsSection('notifications', notificationData);
  }

  async updateAISection(aiData) {
    return this.updateSettingsSection('ai', aiData);
  }

  async updateGamificationSection(gamificationData) {
    return this.updateSettingsSection('gamification', gamificationData);
  }

  async updateAppearanceSection(appearanceData) {
    try {
      const response = await api.patch('/settings/appearance', appearanceData);
      
      if (response.data.success) {
        // Clear cache when settings are updated
        this.clearCache();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update appearance settings');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to update appearance settings');
      }
      throw error;
    }
  }

  // Get all settings from new endpoint
  async getAllSettings() {
    try {
      const response = await api.get('/settings');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get settings');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to get settings');
      }
      throw error;
    }
  }

  // Update account settings including notification preferences
  async updateAccountSettings(accountData) {
    try {
      const response = await api.patch('/settings/account', accountData);
      
      if (response.data.success) {
        // Clear cache when settings are updated
        this.clearCache();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update account settings');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to update account settings');
      }
      throw error;
    }
  }

  // Update security settings
  async updateSecurity(securityData) {
    try {
      const response = await api.patch('/settings/security', securityData);
      
      if (response.data.success) {
        this.clearCache();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update security settings');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to update security settings');
      }
      throw error;
    }
  }

  // REMOVED DUPLICATE: changePassword already exists above
  // REMOVED DUPLICATE: enable2FA already exists above
  
  // Verify 2FA token - FIXED: Use correct endpoint
  async verify2FA(token) {
    try {
      const response = await api.post('/settings/2fa/verify', { token });
      
      
      if (response.data.success) {
        this.clearCache();
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to verify 2FA');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to verify 2FA');
      }
      throw error;
    }
  }

  // REMOVED DUPLICATE: disable2FA already exists above
  
  // Get active sessions - FIXED: Use correct endpoint
  async getActiveSessions() {
    try {
      const response = await api.get('/settings/sessions');
      
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get active sessions');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to get active sessions');
      }
      throw error;
    }
  }

  // Revoke session - FIXED: Use correct endpoint
  async revokeSession(sessionId) {
    try {
      const response = await api.delete(`/settings/sessions/${sessionId}`);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to revoke session');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to revoke session');
      }
      throw error;
    }
  }

  // Revoke all sessions - FIXED: Use correct endpoint  
  async revokeAllSessions() {
    try {
      const response = await api.delete('/settings/sessions');
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to revoke all sessions');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to revoke all sessions');
      }
      throw error;
    }
  }

  // Data export - delegated to securityService
  // Export user data - FIXED: Use correct endpoint
  async exportUserData() {
    try {
      const response = await api.get('/settings/export');
      
      if (response.data.success) {
        // Create and download file
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vocalink-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to export user data');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to export user data');
      }
      throw error;
    }
  }

  // Account deletion - delegated to securityService
  // Delete account - FIXED: Use correct endpoint
  async deleteAccount(password, confirmText) {
    try {
      const response = await api.delete('/settings/account', {
        data: { password, confirmText }
      });
      
      if (response.data.success) {
        this.clearCache();
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete account');
      }
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Failed to delete account');
      }
      throw error;
    }
  }
}

export const settingsService = new SettingsService();
export default settingsService;