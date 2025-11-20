const { StatusCodes } = require('http-status-codes');
const bcrypt = require('bcryptjs'); // FIXED: Added missing import
const User = require('../models/user.model');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { ValidationError, UnauthorizedError, NotFoundError, BadRequestError } = require('../utils/errors');
const SessionManager = require('../utils/sessionManager');
const { validatePassword } = require('../utils/sanitize');

// Get all user settings
const getAllSettings = async (req, res) => {
  try {
    if (!req.user) {
      // Return default settings for unauthenticated users
      return res.status(200).json({
        success: true,
        data: {
          appearance: {
            theme: 'system'
          },
          notifications: {
            emailNotifications: true,
            pushNotifications: true,
            marketingEmails: false
          },
          privacy: {
            profileVisibility: 'public',
            postVisibility: 'public',
            allowSearch: true,
            showOnlineStatus: true
          }
        }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const settings = {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        coverImage: user.coverImage,
        location: user.location,
        website: user.website,
        company: user.company,
        jobTitle: user.jobTitle,
        gender: user.gender,
        occupation: user.occupation,
        nationality: user.nationality,
        mobile: user.mobile,
        dob: user.dob,
        language: user.language || user.aiPreferences?.language || 'en',
        timezone: user.timezone || 'UTC',
        socialLinks: user.socialLinks || []
      },
      account: {
        isVerified: user.isVerified,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        emailNotifications: user.notificationSettings?.emailNotifications !== undefined ? user.notificationSettings.emailNotifications : true,
        pushNotifications: user.notificationSettings?.pushNotifications !== undefined ? user.notificationSettings.pushNotifications : true,
        marketingEmails: user.notificationSettings?.marketingEmails !== undefined ? user.notificationSettings.marketingEmails : false,
        isPublic: user.isPublic !== undefined ? user.isPublic : true,
        showOnlineStatus: user.showOnlineStatus !== undefined ? user.showOnlineStatus : true,
        twoFactorEnabled: user.twoFactorEnabled || false,
        accountVisibility: user.accountVisibility || 'public'
      },
      privacy: {
        profileVisibility: user.privacySettings?.profileVisibility || user.privacy?.profileVisibility || 'public',
        postVisibility: user.privacySettings?.postVisibility || user.privacy?.postVisibility || 'public',
        allowSearch: user.privacySettings?.allowSearch !== undefined ? user.privacySettings.allowSearch : (user.privacy?.allowSearch !== undefined ? user.privacy.allowSearch : true),
        showOnlineStatus: user.privacySettings?.showOnlineStatus !== undefined ? user.privacySettings.showOnlineStatus : (user.privacy?.showOnlineStatus !== undefined ? user.privacy.showOnlineStatus : true),
        allowDirectMessages: user.privacySettings?.allowDirectMessages !== undefined ? user.privacySettings.allowDirectMessages : (user.privacy?.allowDirectMessages !== undefined ? user.privacy.allowDirectMessages : true),
        dataSharing: user.privacySettings?.dataSharing !== undefined ? user.privacySettings.dataSharing : (user.privacy?.dataSharing !== undefined ? user.privacy.dataSharing : false),
        analyticsSharing: user.privacySettings?.analyticsSharing !== undefined ? user.privacySettings.analyticsSharing : (user.privacy?.analyticsSharing !== undefined ? user.privacy.analyticsSharing : false),
        showEmail: user.privacySettings?.showEmail !== undefined ? user.privacySettings.showEmail : (user.privacy?.showEmail !== undefined ? user.privacy.showEmail : false),
        allowMessages: user.privacySettings?.allowMessages !== undefined ? user.privacySettings.allowMessages : (user.privacy?.allowMessages !== undefined ? user.privacy.allowMessages : true)
      },
      notifications: {
        emailNotifications: user.notificationSettings?.emailNotifications !== undefined ? user.notificationSettings.emailNotifications : true,
        pushNotifications: user.notificationSettings?.pushNotifications !== undefined ? user.notificationSettings.pushNotifications : true,
        marketingEmails: user.notificationSettings?.marketingEmails !== undefined ? user.notificationSettings.marketingEmails : false,
        soundEnabled: user.notificationSettings?.soundEnabled !== undefined ? user.notificationSettings.soundEnabled : true,
        desktopNotifications: user.notificationSettings?.desktopNotifications !== undefined ? user.notificationSettings.desktopNotifications : true,
        newFollowers: user.notificationSettings?.newFollowers !== undefined ? user.notificationSettings.newFollowers : true,
        newLikes: user.notificationSettings?.newLikes !== undefined ? user.notificationSettings.newLikes : true,
        newComments: user.notificationSettings?.newComments !== undefined ? user.notificationSettings.newComments : true,
        newMentions: user.notificationSettings?.newMentions !== undefined ? user.notificationSettings.newMentions : true,
        badgeEarned: user.notificationSettings?.badgeEarned !== undefined ? user.notificationSettings.badgeEarned : true,
        levelUp: user.notificationSettings?.levelUp !== undefined ? user.notificationSettings.levelUp : true,
        seriesUpdates: user.notificationSettings?.seriesUpdates !== undefined ? user.notificationSettings.seriesUpdates : true,
        aiGenerations: user.notificationSettings?.aiGenerations !== undefined ? user.notificationSettings.aiGenerations : false,
        weeklyDigest: user.notificationSettings?.weeklyDigest !== undefined ? user.notificationSettings.weeklyDigest : false,
        monthlyReport: user.notificationSettings?.monthlyReport !== undefined ? user.notificationSettings.monthlyReport : false,
        emailDigestFrequency: user.notificationSettings?.emailDigestFrequency || 'weekly',
        pushNotificationTime: user.notificationSettings?.pushNotificationTime || 'immediate'
      },
      appearance: {
        theme: user.theme || 'system'
      },
      ai: {
        preferredVoice: user.aiPreferences?.preferredVoice || 'default',
        autoSummarize: user.aiPreferences?.autoSummarize !== undefined ? user.aiPreferences.autoSummarize : true,
        speechToText: user.aiPreferences?.speechToText !== undefined ? user.aiPreferences.speechToText : false,
        language: user.aiPreferences?.language || 'en'
      },
      gamification: {
        showXP: user.gamificationSettings?.showXP !== undefined ? user.gamificationSettings.showXP : true,
        showLevel: user.gamificationSettings?.showLevel !== undefined ? user.gamificationSettings.showLevel : true,
        showBadges: user.gamificationSettings?.showBadges !== undefined ? user.gamificationSettings.showBadges : true,
        showLeaderboard: user.gamificationSettings?.showLeaderboard !== undefined ? user.gamificationSettings.showLeaderboard : true,
        notifications: user.gamificationSettings?.notifications !== undefined ? user.gamificationSettings.notifications : true
      },
      security: {
        twoFactorEnabled: user.twoFactorEnabled || false,
        loginNotifications: user.securitySettings?.loginNotifications !== undefined ? user.securitySettings.loginNotifications : true,
        suspiciousActivityAlerts: user.securitySettings?.suspiciousActivityAlerts !== undefined ? user.securitySettings.suspiciousActivityAlerts : true,
        autoLogout: user.securitySettings?.autoLogout !== undefined ? user.securitySettings.autoLogout : false,
        lastPasswordChange: user.passwordChangedAt || user.createdAt,
        lastLogin: user.lastLoginAt || user.createdAt,
        activeSessions: user.activeSessions?.length || 1,
        lastActive: user.lastActiveAt || user.lastLoginAt || user.createdAt,
        isVerified: user.isVerified || false,
        loginHistory: user.loginHistory || []
      }
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update profile settings only
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    const allowedFields = [
      'firstName', 'lastName', 'displayName', 'username', 'email', 'bio',
      'location', 'website', 'company', 'jobTitle', 'gender', 'occupation',
      'nationality', 'mobile', 'dob', 'language', 'timezone',
      'socialLinks', 'avatar', 'coverImage'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (profileData[field] !== undefined) {
        updateData[field] = profileData[field];
      }
    });

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true
    }).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
};

// Update account settings only
const updateAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountVisibility, emailNotifications, pushNotifications, marketingEmails } = req.body;

    // Get current user to merge notification settings
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    const updateData = {};
    
    // Update account visibility
    if (accountVisibility !== undefined) {
      updateData.accountVisibility = accountVisibility;
    }

    // Update notification settings - SINGLE SOURCE OF TRUTH
    if (emailNotifications !== undefined || pushNotifications !== undefined || marketingEmails !== undefined) {
      const currentNotificationSettings = currentUser.notificationSettings || {};
      
      updateData.notificationSettings = {
        ...currentNotificationSettings,
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(pushNotifications !== undefined && { pushNotifications }),
        ...(marketingEmails !== undefined && { marketingEmails })
      };
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true
    }).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: { 
        accountVisibility: user.accountVisibility,
        emailNotifications: user.notificationSettings?.emailNotifications,
        pushNotifications: user.notificationSettings?.pushNotifications,
        marketingEmails: user.notificationSettings?.marketingEmails,
        // Also include account status info for frontend
        isVerified: user.isVerified || false,
        role: user.role || 'user',
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        twoFactorEnabled: user.twoFactorEnabled || false,
        accountStatus: user.isVerified ? 'verified' : 'unverified'
      },
      message: 'Account settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating account settings:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to update account settings'
    });
  }
};

// Update privacy settings only
const updatePrivacy = async (req, res) => {
  try {
    const userId = req.user.id;
    const privacyData = req.body;

    // Get current user to merge with existing privacy settings
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    // Merge with existing privacy settings
    const updatedPrivacySettings = {
      ...currentUser.privacySettings,
      ...privacyData
    };

    const user = await User.findByIdAndUpdate(
      userId,
      { privacySettings: updatedPrivacySettings },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Return the privacy data in the same format as getAllSettings
    const responseData = {
      profileVisibility: user.privacySettings?.profileVisibility || 'public',
      postVisibility: user.privacySettings?.postVisibility || 'public',
      allowSearch: user.privacySettings?.allowSearch !== undefined ? user.privacySettings.allowSearch : true,
      showOnlineStatus: user.privacySettings?.showOnlineStatus !== undefined ? user.privacySettings.showOnlineStatus : true,
      allowDirectMessages: user.privacySettings?.allowDirectMessages !== undefined ? user.privacySettings.allowDirectMessages : true,
      dataSharing: user.privacySettings?.dataSharing !== undefined ? user.privacySettings.dataSharing : false,
      analyticsSharing: user.privacySettings?.analyticsSharing !== undefined ? user.privacySettings.analyticsSharing : false,
      showEmail: user.privacySettings?.showEmail !== undefined ? user.privacySettings.showEmail : false,
      allowMessages: user.privacySettings?.allowMessages !== undefined ? user.privacySettings.allowMessages : true
    };

    res.status(StatusCodes.OK).json({
      success: true,
      data: responseData,
      message: 'Privacy settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to update privacy settings'
    });
  }
};

// Update notification settings only
const updateNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationData = req.body;

    // Get current user to merge settings
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    // Merge all notification data into notificationSettings - SINGLE SOURCE OF TRUTH
    const currentNotificationSettings = currentUser.notificationSettings || {};
    
    const updateData = {
      notificationSettings: {
        ...currentNotificationSettings,
        ...notificationData
      }
    };

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Return notification settings
    const responseData = user.notificationSettings || {};

    res.status(StatusCodes.OK).json({
      success: true,
      data: responseData,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to update notification settings'
    });
  }
};

// Update AI settings only
const updateAI = async (req, res) => {
  try {
    const userId = req.user.id;
    const aiPreferences = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { aiPreferences },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: user.aiPreferences,
      message: 'AI preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating AI preferences:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to update AI preferences'
    });
  }
};

// Update gamification settings only
const updateGamification = async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = req.body?.gamification ? req.body.gamification : req.body || {};

    const allowedFields = ['showXP', 'showLevel', 'showBadges', 'showLeaderboard', 'notifications'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        updateData[`gamificationSettings.${field}`] = payload[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No valid gamification fields provided'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: user.gamificationSettings,
      message: 'Gamification settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating gamification settings:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to update gamification settings'
    });
  }
};

// Update appearance settings only (theme only)
const updateAppearance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme } = req.body;

    if (!theme || !['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme value. Must be light, dark, or system.'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { theme },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: { theme: user.theme },
      message: 'Theme updated successfully'
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to update theme'
    });
  }
};

// Bulk update (for backward compatibility)
const bulkUpdate = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true
    }).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error bulk updating settings:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to update settings'
    });
  }
};

// Two-Factor Authentication endpoints
const enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `VocalInk (${req.user.email})`,
      issuer: 'VocalInk'
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    // Update user with 2FA secret and backup codes
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        twoFactorSecret: secret.base32,
        backupCodes: backupCodes,
        twoFactorEnabled: false // Will be enabled after verification
      },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes: backupCodes
      },
      message: '2FA setup initiated. Please verify with your authenticator app.'
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to setup 2FA'
    });
  }
};

const verify2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestError('2FA setup not initiated');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      throw new BadRequestError('Invalid verification code');
    }

    // Enable 2FA
    await User.findByIdAndUpdate(userId, { twoFactorEnabled: true });

    res.status(StatusCodes.OK).json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to verify 2FA'
    });
  }
};

const disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new BadRequestError('Invalid password');
    }

    // Disable 2FA
    await User.findByIdAndUpdate(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: []
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to disable 2FA'
    });
  }
};

// Session Management endpoints
const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    // Clean up expired sessions first
    await SessionManager.cleanupExpiredSessions(user);
    
    // Get current session info
    const currentSessionData = await SessionManager.createSessionData(req);
    
    // Get all active sessions from user model
    const activeSessions = user.activeSessions || [];
    
    // Format sessions for frontend
    const formattedSessions = activeSessions.map(session => {
      const isCurrent = session.ip === currentSessionData.ip && 
                       session.device === currentSessionData.device;
      
      return {
        id: session.sessionId,
        device: session.device,
        browser: session.browser,
        location: session.location,
        lastActivity: session.lastActivity,
        isCurrent: isCurrent,
        ip: session.ip,
        createdAt: session.createdAt
      };
    });

    // If no current session found in stored sessions, add it
    const hasCurrentSession = formattedSessions.some(s => s.isCurrent);
    if (!hasCurrentSession) {
      formattedSessions.unshift({
        id: currentSessionData.sessionId,
        device: currentSessionData.device,
        browser: currentSessionData.browser,
        location: currentSessionData.location,
        lastActivity: currentSessionData.lastActivity,
        isCurrent: true,
        ip: currentSessionData.ip,
        createdAt: currentSessionData.createdAt
      });
    }

    // Sort by last activity (current session first, then by most recent)
    formattedSessions.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return new Date(b.lastActivity) - new Date(a.lastActivity);
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: formattedSessions,
      message: 'Active sessions retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting active sessions:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to get active sessions'
    });
  }
};

const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    const success = await SessionManager.removeSession(user, sessionId);
    
    if (success) {
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Session revoked successfully'
      });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Session not found'
      });
    }
  } catch (error) {
    console.error('Error revoking session:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to revoke session'
    });
  }
};

const revokeAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current session to preserve it
    const currentSessionData = await SessionManager.createSessionData(req);
    const currentSession = user.activeSessions.find(session => 
      session.ip === currentSessionData.ip && session.device === currentSessionData.device
    );

    const success = await SessionManager.removeAllSessions(user, currentSession?.sessionId);
    
    if (success) {
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'All other sessions revoked successfully'
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to revoke sessions'
      });
    }
  } catch (error) {
    console.error('Error revoking all sessions:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to revoke all sessions'
    });
  }
};

// Delete login history
const clearLoginHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    user.loginHistory = [];
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Login history cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing login history:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to clear login history'
    });
  }
};

// Data Export endpoint
const exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .select('-password -refreshToken -twoFactorSecret')
      .populate('badges')
      .populate('followers', 'firstName lastName email')
      .populate('following', 'firstName lastName email');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // In production, you'd also include blogs, comments, etc.
    const exportData = {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        bio: user.bio,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      settings: {
        privacy: user.privacySettings,
        notifications: user.notificationSettings,
        ai: user.aiPreferences,
        gamification: user.gamificationSettings
      },
      stats: {
        xp: user.xp,
        level: user.level,
        totalBlogs: user.totalBlogs,
        totalLikes: user.totalLikes,
        totalComments: user.totalComments,
        engagementScore: user.engagementScore
      },
      social: {
        followers: user.followers,
        following: user.following,
        badges: user.badges
      },
      exportedAt: new Date()
    };

    res.status(StatusCodes.OK).json({
      success: true,
      data: exportData,
      message: 'User data exported successfully'
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to export user data'
    });
  }
};

// Account Deletion endpoint
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmationText, confirmText, password } = req.body;

    const text = confirmationText || confirmText;
    if (!text || !['DELETE', 'DELETE MY ACCOUNT'].includes(text)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid confirmation text. Type "DELETE" to confirm.'
      });
    }

    // Verify password if provided; if not, require it for additional safety
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!password || !(await user.comparePassword(password))) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Soft delete the user account
    await User.findByIdAndUpdate(userId, {
      isDeleted: true,
      deletedAt: new Date(),
      email: `deleted_${userId}_${Date.now()}@deleted.com`
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to delete account'
    });
  }
};

// Update security settings
const updateSecurity = async (req, res) => {
  try {
    const userId = req.user.id;
    const securityData = req.body;

    const allowedFields = [
      'loginNotifications', 'suspiciousActivityAlerts', 'autoLogout'
    ];

    const updateData = {};
    Object.keys(securityData).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[`securitySettings.${key}`] = securityData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid security fields provided'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Security settings updated successfully',
      data: user.securitySettings
    });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to update security settings'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password with standardized requirements
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        details: passwordValidation.errors
      });
    }

    // Get user with password field
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // SECURITY FIX: Use save() to trigger pre-save hook for password hashing
    // Pre-save hook in user.model.js will handle hashing automatically
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
};

module.exports = {
  getAllSettings,
  updateProfile,
  updateAccount,
  updatePrivacy,
  updateNotifications,
  updateAI,
  updateGamification,
  updateAppearance,
  bulkUpdate,
  // Security endpoints
  enable2FA,
  verify2FA,
  disable2FA,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  clearLoginHistory,
  exportUserData,
  deleteAccount,
  updateSecurity,
  changePassword
};
