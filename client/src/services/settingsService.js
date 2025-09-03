import api from './api';

class SettingsService {
  constructor() {
    this.baseURL = '/users';
    this.xpURL = '/xp';
  }

  // Get user's current settings from profile
  async getUserSettings() {
    try {
      const response = await api.get(`${this.baseURL}/me`);
      
      if (response.data.success) {
        const userData = response.data.data;
        
        // Transform backend data to frontend settings format
        return this.transformBackendToFrontend(userData);
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

  // Update user profile settings
  async updateProfileSettings(profileData) {
    try {
      const response = await api.patch(`${this.baseURL}/me`, profileData);
      
      if (response.data.success) {
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
      const response = await api.patch(`${this.baseURL}/me`, {
        privacySettings
      });
      
      if (response.data.success) {
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

  // Update notification preferences
  async updateNotificationPreferences(notificationSettings) {
    try {
      const response = await api.patch(`${this.baseURL}/me`, {
        emailNotifications: notificationSettings.emailNotifications,
        pushNotifications: notificationSettings.pushNotifications
      });
      
      if (response.data.success) {
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
      const response = await api.patch(`${this.baseURL}/me`, {
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
    return {
      profile: {
        username: userData.name || '',
        displayName: userData.name || '',
        email: userData.email || '',
        bio: userData.bio || '',
        avatar: userData.avatar || userData.profilePicture || null,
        coverImage: userData.coverImage || null,
        location: userData.address || '',
        website: userData.website || '',
        language: userData.aiPreferences?.language || 'en',
        timezone: 'America/Los_Angeles', // Default, not stored in backend yet
        company: userData.company || '',
        jobTitle: userData.jobTitle || '',
        linkedin: userData.linkedin || '',
        socialLinks: userData.socialLinks || [],
        gender: userData.gender || '',
        occupation: userData.occupation || '',
        nationality: userData.nationality || '',
        mobile: userData.mobile || '',
        dob: userData.dob || ''
      },
      account: {
        emailNotifications: userData.emailNotifications !== false,
        pushNotifications: userData.pushNotifications !== false,
        twoFactorAuth: userData.twoFactorEnabled || false,
        accountVisibility: userData.privacySettings?.profileVisibility || 'public',
        showEmail: userData.privacySettings?.showEmail || false,
        allowComments: true, // Default, not stored in backend yet
        allowMentions: true, // Default, not stored in backend yet
        marketingEmails: false // Default, not stored in backend yet
      },
      notifications: {
        newFollowers: true, // Default, not stored in backend yet
        newLikes: true, // Default, not stored in backend yet
        newComments: true, // Default, not stored in backend yet
        newMentions: true, // Default, not stored in backend yet
        badgeEarned: userData.gamificationSettings?.notifications !== false,
        levelUp: userData.gamificationSettings?.notifications !== false,
        seriesUpdates: true, // Default, not stored in backend yet
        aiGenerations: false, // Default, not stored in backend yet
        weeklyDigest: false, // Default, not stored in backend yet
        monthlyReport: false // Default, not stored in backend yet
      },
      privacy: {
        profileVisibility: userData.privacySettings?.profileVisibility || 'public',
        postVisibility: 'public', // Default, not stored in backend yet
        allowSearch: true, // Default, not stored in backend yet
        showOnlineStatus: userData.privacySettings?.showLastActive !== false,
        allowDirectMessages: true, // Default, not stored in backend yet
        dataSharing: false, // Default, not stored in backend yet
        analyticsSharing: true // Default, not stored in backend yet
      },
      appearance: {
        theme: 'system', // Managed by ThemeContext
        fontSize: 'medium', // Default, not stored in backend yet
        compactMode: false, // Default, not stored in backend yet
        showAnimations: true, // Default, not stored in backend yet
        colorScheme: 'default' // Default, not stored in backend yet
      },
      gamification: {
        showXP: userData.gamificationSettings?.showXP !== false,
        showLevel: userData.gamificationSettings?.showLevel !== false,
        showBadges: userData.gamificationSettings?.showBadges !== false,
        showLeaderboard: userData.gamificationSettings?.showLeaderboard !== false,
        notifications: userData.gamificationSettings?.notifications !== false
      },
      ai: {
        preferredVoice: userData.aiPreferences?.preferredVoice || 'default',
        autoSummarize: userData.aiPreferences?.autoSummarize !== false,
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
  }

  // Transform frontend settings to backend format
  transformFrontendToBackend(settings) {
    const backendData = {};

    // Profile fields
    if (settings.profile) {
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
      backendData.twoFactorEnabled = settings.account.twoFactorAuth;
    }

    // Privacy settings
    if (settings.privacy) {
      backendData.privacySettings = {
        profileVisibility: settings.privacy.profileVisibility,
        showEmail: settings.privacy.showEmail,
        showLastActive: settings.privacy.showOnlineStatus
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
}

export const settingsService = new SettingsService();
export default settingsService; 