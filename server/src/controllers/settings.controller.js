const { StatusCodes } = require('http-status-codes');
const User = require('../models/user.model');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { ValidationError, UnauthorizedError, NotFoundError, BadRequestError } = require('../utils/errors');
const SessionManager = require('../utils/sessionManager');

// Get all user settings
const getAllSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const settings = {
      profile: {
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        location: user.location,
        website: user.website,
        socialLinks: user.socialLinks || {}
      },
      account: {
        isVerified: user.isVerified,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        emailNotifications: user.notificationPreferences?.emailNotifications !== undefined ? user.notificationPreferences.emailNotifications : true,
        pushNotifications: user.notificationPreferences?.pushNotifications !== undefined ? user.notificationPreferences.pushNotifications : true,
        marketingEmails: user.notificationPreferences?.marketingEmails !== undefined ? user.notificationPreferences.marketingEmails : false,
        isPublic: user.isPublic !== undefined ? user.isPublic : true,
        showOnlineStatus: user.showOnlineStatus !== undefined ? user.showOnlineStatus : true,
        twoFactorEnabled: user.twoFactorEnabled || false
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
        emailNotifications: user.notificationPreferences?.emailNotifications !== undefined ? user.notificationPreferences.emailNotifications : true,
        pushNotifications: user.notificationPreferences?.pushNotifications !== undefined ? user.notificationPreferences.pushNotifications : true,
        marketingEmails: user.notificationPreferences?.marketingEmails !== undefined ? user.notificationPreferences.marketingEmails : false,
        soundEnabled: user.notificationPreferences?.soundEnabled !== undefined ? user.notificationPreferences.soundEnabled : true,
        desktopNotifications: user.notificationPreferences?.desktopNotifications !== undefined ? user.notificationPreferences.desktopNotifications : true
      },
      appearance: {
        theme: user.theme || 'system'
      },
      aiPreferences: {
        preferredVoice: user.aiPreferences?.preferredVoice || 'default',
        autoSummarize: user.aiPreferences?.autoSummarize !== undefined ? user.aiPreferences.autoSummarize : true,
        speechToText: user.aiPreferences?.speechToText !== undefined ? user.aiPreferences.speechToText : false,
        language: user.aiPreferences?.language || 'en'
      },
      gamification: {
        enabled: user.gamificationSettings?.enabled !== undefined ? user.gamificationSettings.enabled : true,
        showNotifications: user.gamificationSettings?.showNotifications !== undefined ? user.gamificationSettings.showNotifications : true,
        publicBadges: user.gamificationSettings?.publicBadges !== undefined ? user.gamificationSettings.publicBadges : true,
        leaderboards: user.gamificationSettings?.leaderboards !== undefined ? user.gamificationSettings.leaderboards : true,
        challengeDifficulty: user.gamificationSettings?.challengeDifficulty || 'medium'
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
      'nationality', 'mobile', 'dateOfBirth', 'language', 'timezone',
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
    const { visibility, postVisibility, emailNotifications, pushNotifications, marketingEmails } = req.body;

    const updateData = {};
    if (visibility !== undefined) updateData.visibility = visibility;
    if (postVisibility !== undefined) updateData.postVisibility = postVisibility;

    // Handle notification preferences - store them directly on user for easier access
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
    if (marketingEmails !== undefined) updateData.marketingEmails = marketingEmails;

    // Also update notificationSettings object for consistency
    if (emailNotifications !== undefined || pushNotifications !== undefined || marketingEmails !== undefined) {
      const user = await User.findById(userId);
      const currentNotificationSettings = user.notificationSettings || {};
      
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
        visibility: user.visibility, 
        postVisibility: user.postVisibility,
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        marketingEmails: user.marketingEmails,
        // Also include account status info for frontend
        isVerified: user.isVerified || false,
        role: user.role || 'user',
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
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

    // Separate basic notification preferences from detailed settings
    const { emailNotifications, pushNotifications, marketingEmails, ...detailedSettings } = notificationData;

    const updateData = {};

    // Update individual notification fields if provided
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
    if (marketingEmails !== undefined) updateData.marketingEmails = marketingEmails;

    // Update the notificationSettings object with detailed settings
    if (Object.keys(detailedSettings).length > 0) {
      const user = await User.findById(userId);
      const currentNotificationSettings = user.notificationSettings || {};
      
      updateData.notificationSettings = {
        ...currentNotificationSettings,
        ...detailedSettings
      };
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Return the combined notification data in the same format as getAllSettings
    const responseData = {
      emailNotifications: user.emailNotifications,
      pushNotifications: user.pushNotifications,
      marketingEmails: user.marketingEmails,
      ...(user.notificationSettings || {})
    };

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
    const gamificationSettings = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { gamificationSettings },
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
    const { confirmationText } = req.body;

    if (confirmationText !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Invalid confirmation text. Please type "DELETE" to confirm.'
      });
    }

    // Soft delete the user account
    await User.findByIdAndUpdate(userId, {
      isDeleted: true,
      deletedAt: new Date(),
      email: `deleted_${userId}_${Date.now()}@deleted.com` // Prevent email conflicts
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

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
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
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and track change
    await User.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
      passwordChangedAt: new Date()
    });

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
  exportUserData,
  deleteAccount,
  updateSecurity,
  changePassword
};