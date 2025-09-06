import api from './api';

class SettingsService {
  constructor() {
    this.baseURL = '/users';
    this.xpURL = '/xp';
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
          console.log('📦 Restored settings cache from localStorage');
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
          console.log('📦 Using cached settings data');
          return this.cache;
        }
      }

      console.log('🌐 Fetching fresh settings from API');
      const response = await api.get(`${this.baseURL}/me`);
      
      if (response.data.success) {
        const userData = response.data.data;
        
        // Transform backend data to frontend settings format
        const transformedData = this.transformBackendToFrontend(userData);
        
        // Cache the result
        this.cache = transformedData;
        this.cacheTimestamp = Date.now();
        
        // Save to localStorage for persistence across page refreshes
        this.saveCacheToStorage();
        
        return transformedData;
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
      const response = await api.patch(`${this.baseURL}/me`, profileData);
      
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
      const response = await api.put(`${this.xpURL}/settings`, {
        gamificationSettings
      });
      
      if (response.data.success) {
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
      const response = await api.patch(`${this.baseURL}/me`, {
        aiPreferences
      });
      
      if (response.data.success) {
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
      const response = await api.put('/notifications/preferences', {
        emailNotifications: notificationSettings.emailNotifications,
        pushNotifications: notificationSettings.pushNotifications,
        marketingEmails: notificationSettings.marketingEmails,
        notificationSettings: {
          newFollowers: notificationSettings.newFollowers,
          newLikes: notificationSettings.newLikes,
          newComments: notificationSettings.newComments,
          newMentions: notificationSettings.newMentions,
          badgeEarned: notificationSettings.badgeEarned,
          levelUp: notificationSettings.levelUp,
          seriesUpdates: notificationSettings.seriesUpdates,
          aiGenerations: notificationSettings.aiGenerations,
          weeklyDigest: notificationSettings.weeklyDigest,
          monthlyReport: notificationSettings.monthlyReport,
          emailDigestFrequency: notificationSettings.emailDigestFrequency,
          pushNotificationTime: notificationSettings.pushNotificationTime
        }
      });
      
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

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.patch(`${this.baseURL}/me/password`, {
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

  // Transform backend user data to frontend settings format
  transformBackendToFrontend(userData) {
    console.log('🔍 DEBUG: Raw userData from backend:', userData);
    console.log('🔍 DEBUG: userData.twoFactorEnabled:', userData.twoFactorEnabled);
    
    return {
      profile: {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        username: userData.name || '',
        displayName: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || '',
        email: userData.email || '',
        bio: userData.bio || '',
        avatar: userData.avatar || userData.profilePicture || null,
        coverImage: userData.coverImage || null,
        location: userData.address || '',
        website: userData.website || '',
        socialLinks: userData.socialLinks || {}
      },
      account: {
        visibility: userData.visibility || 'public',
        language: userData.language || 'en',
        timezone: userData.timezone || 'UTC',
        dateFormat: userData.dateFormat || 'MM/DD/YYYY',
        timeFormat: userData.timeFormat || '12h',
        twoFactorAuth: userData.twoFactorEnabled !== undefined ? userData.twoFactorEnabled : false
      },
      notifications: {
        emailNotifications: userData.emailNotifications !== undefined ? userData.emailNotifications : true,
        pushNotifications: userData.pushNotifications !== undefined ? userData.pushNotifications : true,
        marketingEmails: userData.marketingEmails !== undefined ? userData.marketingEmails : false,
        newFollowers: userData.notificationSettings?.newFollowers !== undefined ? userData.notificationSettings.newFollowers : true,
        newLikes: userData.notificationSettings?.newLikes !== undefined ? userData.notificationSettings.newLikes : true,
        newComments: userData.notificationSettings?.newComments !== undefined ? userData.notificationSettings.newComments : true,
        newMentions: userData.notificationSettings?.newMentions !== undefined ? userData.notificationSettings.newMentions : true,
        badgeEarned: userData.notificationSettings?.badgeEarned !== undefined ? userData.notificationSettings.badgeEarned : true,
        levelUp: userData.notificationSettings?.levelUp !== undefined ? userData.notificationSettings.levelUp : true,
        seriesUpdates: userData.notificationSettings?.seriesUpdates !== undefined ? userData.notificationSettings.seriesUpdates : true,
        aiGenerations: userData.notificationSettings?.aiGenerations !== undefined ? userData.notificationSettings.aiGenerations : true,
        weeklyDigest: userData.notificationSettings?.weeklyDigest !== undefined ? userData.notificationSettings.weeklyDigest : true,
        monthlyReport: userData.notificationSettings?.monthlyReport !== undefined ? userData.notificationSettings.monthlyReport : false,
        emailDigestFrequency: userData.notificationSettings?.emailDigestFrequency || 'weekly',
        pushNotificationTime: userData.notificationSettings?.pushNotificationTime || '18:00'
      },
      privacy: {
        profileVisibility: userData.visibility || 'public',
        postVisibility: userData.postVisibility || 'public', 
        allowSearch: userData.privacySettings?.allowSearch !== undefined ? userData.privacySettings.allowSearch : true,
        showOnlineStatus: userData.privacySettings?.showOnlineStatus !== undefined ? userData.privacySettings.showOnlineStatus : true,
        allowDirectMessages: userData.privacySettings?.allowDirectMessages !== undefined ? userData.privacySettings.allowDirectMessages : true,
        dataSharing: userData.privacySettings?.dataSharing !== undefined ? userData.privacySettings.dataSharing : false,
        analyticsSharing: userData.privacySettings?.analyticsSharing !== undefined ? userData.privacySettings.analyticsSharing : true,
        showEmail: userData.privacySettings?.showEmail !== undefined ? userData.privacySettings.showEmail : false
      },
      appearance: {
        theme: userData.theme || 'light',
        fontSize: userData.fontSize || 'medium',
        language: userData.language || 'en',
        compactMode: userData.compactMode !== undefined ? userData.compactMode : false,
        showAvatars: userData.showAvatars !== undefined ? userData.showAvatars : true,
        animationsEnabled: userData.animationsEnabled !== undefined ? userData.animationsEnabled : true
      },
      gamification: {
        showBadges: userData.gamificationSettings?.showBadges !== undefined ? userData.gamificationSettings.showBadges : true,
        showLevel: userData.gamificationSettings?.showLevel !== undefined ? userData.gamificationSettings.showLevel : true,
        showXP: userData.gamificationSettings?.showXP !== undefined ? userData.gamificationSettings.showXP : true,
        publicProfile: userData.gamificationSettings?.publicProfile !== undefined ? userData.gamificationSettings.publicProfile : true,
        emailNotifications: userData.gamificationSettings?.emailNotifications !== undefined ? userData.gamificationSettings.emailNotifications : true,
        pushNotifications: userData.gamificationSettings?.pushNotifications !== undefined ? userData.gamificationSettings.pushNotifications : true
      },
      ai: {
        preferredVoice: userData.aiPreferences?.preferredVoice || 'default',
        autoSummarize: userData.aiPreferences?.autoSummarize || false,
        speechToText: userData.aiPreferences?.speechToText || false,
        language: userData.aiPreferences?.language || 'en'
      },
      security: {
        lastPasswordChange: userData.updatedAt || new Date().toISOString(),
        lastLogin: userData.lastLoginAt || new Date().toISOString(),
        activeSessions: 1, // Default, not stored in backend yet
        loginHistory: [], // Default, not stored in backend yet
        failedLoginAttempts: userData.failedLoginAttempts || 0,
        lockoutUntil: userData.lockoutUntil || null,
        isVerified: userData.isVerified || false
      }
    };
    
    console.log('🔍 DEBUG: Transformed account object:', transformed.account);
    console.log('🔍 DEBUG: Final twoFactorAuth value:', transformed.account.twoFactorAuth);
    
    return transformed;
  }

  // Transform frontend settings to backend format
  transformFrontendToBackend(settings) {
    const backendData = {};

    // Profile fields
    if (settings.profile) {
      backendData.firstName = settings.profile.firstName;
      backendData.lastName = settings.profile.lastName;
      backendData.name = settings.profile.displayName;
      backendData.bio = settings.profile.bio;
      
      // Handle avatar - if it's base64, store it directly; if it's a URL, keep it
      if (settings.profile.avatar) {
        if (settings.profile.avatar.startsWith('data:image/')) {
          // It's a base64 image, store it directly
          backendData.avatar = settings.profile.avatar;
        } else if (settings.profile.avatar.startsWith('http://') || settings.profile.avatar.startsWith('https://')) {
          // It's an external URL, store it
          backendData.avatar = settings.profile.avatar;
        } else {
          // It might be a relative path, store as is
          backendData.avatar = settings.profile.avatar;
        }
      }
      
      // Handle cover image - same logic as avatar
      if (settings.profile.coverImage) {
        if (settings.profile.coverImage.startsWith('data:image/')) {
          // It's a base64 image, store it directly
          backendData.coverImage = settings.profile.coverImage;
        } else if (settings.profile.coverImage.startsWith('http://') || settings.profile.coverImage.startsWith('https://')) {
          // It's an external URL, store it
          backendData.coverImage = settings.profile.coverImage;
        } else {
          // It might be a relative path, store as is
          backendData.coverImage = settings.profile.coverImage;
        }
      }
      
      backendData.address = settings.profile.location;
      backendData.website = settings.profile.website;
      backendData.company = settings.profile.company;
      backendData.jobTitle = settings.profile.jobTitle;
      backendData.linkedin = settings.profile.linkedin;
      backendData.socialLinks = settings.profile.socialLinks;
      
      // Only include enum fields if they have valid values
      if (settings.profile.gender && settings.profile.gender.trim() !== '') {
        backendData.gender = settings.profile.gender;
      }
      if (settings.profile.occupation && settings.profile.occupation.trim() !== '') {
        backendData.occupation = settings.profile.occupation;
      }
      if (settings.profile.nationality && settings.profile.nationality.trim() !== '') {
        backendData.nationality = settings.profile.nationality;
      }
      if (settings.profile.mobile && settings.profile.mobile.trim() !== '') {
        backendData.mobile = settings.profile.mobile;
      }
      if (settings.profile.dob && settings.profile.dob.trim() !== '') {
        // Convert date string to Date object for backend
        const dobDate = new Date(settings.profile.dob);
        if (!isNaN(dobDate.getTime())) {
          backendData.dob = dobDate;
        }
      }
    }

    // Account settings
    if (settings.account) {
      backendData.emailNotifications = settings.account.emailNotifications;
      backendData.pushNotifications = settings.account.pushNotifications;
      backendData.marketingEmails = settings.account.marketingEmails;
      backendData.accountVisibility = settings.account.accountVisibility;
      backendData.twoFactorEnabled = settings.account.twoFactorAuth;
    }

    // Notification settings
    if (settings.notifications) {
      backendData.notificationSettings = {
        newFollowers: settings.notifications.newFollowers,
        newLikes: settings.notifications.newLikes,
        newComments: settings.notifications.newComments,
        newMentions: settings.notifications.newMentions,
        badgeEarned: settings.notifications.badgeEarned,
        levelUp: settings.notifications.levelUp,
        seriesUpdates: settings.notifications.seriesUpdates,
        aiGenerations: settings.notifications.aiGenerations,
        weeklyDigest: settings.notifications.weeklyDigest,
        monthlyReport: settings.notifications.monthlyReport,
        emailDigestFrequency: settings.notifications.emailDigestFrequency,
        pushNotificationTime: settings.notifications.pushNotificationTime
      };
    }

    // Privacy settings
    if (settings.privacy) {
      backendData.privacySettings = {
        profileVisibility: settings.privacy.profileVisibility,
        postVisibility: settings.privacy.postVisibility,
        allowSearch: settings.privacy.allowSearch,
        showOnlineStatus: settings.privacy.showOnlineStatus,
        allowDirectMessages: settings.privacy.allowDirectMessages,
        dataSharing: settings.privacy.dataSharing,
        analyticsSharing: settings.privacy.analyticsSharing,
        showEmail: settings.privacy.showEmail
      };
    }

    // AI preferences
    if (settings.ai) {
      backendData.aiPreferences = {
        preferredVoice: settings.ai.preferredVoice,
        autoSummarize: settings.ai.autoSummarize,
        speechToText: settings.ai.speechToText,
        language: settings.ai.language
      };
    }

    return backendData;
  }

  // New optimized settings methods using dedicated endpoints
  async updateSettingsSection(section, data) {
    try {
      const response = await api.patch(`/settings/${section}`, data);
      
      if (response.data.success) {
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
    return this.updateSettingsSection('appearance', appearanceData);
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
}

export const settingsService = new SettingsService();
export default settingsService;