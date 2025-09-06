const { StatusCodes } = require('http-status-codes');
const User = require('../models/user.model');
const { ValidationError, NotFoundError } = require('../utils/errors');

// Get all user settings
const getAllSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password -refreshToken');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const settings = {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        bio: user.bio,
        location: user.location,
        website: user.website,
        company: user.company,
        jobTitle: user.jobTitle,
        gender: user.gender,
        occupation: user.occupation,
        nationality: user.nationality,
        mobile: user.mobile,
        dateOfBirth: user.dateOfBirth,
        language: user.language,
        timezone: user.timezone,
        socialLinks: user.socialLinks,
        avatar: user.avatar,
        coverImage: user.coverImage
      },
      account: {
        visibility: user.visibility,
        postVisibility: user.postVisibility,
        twoFactorEnabled: user.twoFactorEnabled || false
      },
      privacy: user.privacySettings || {
        allowSearch: true,
        showOnlineStatus: true,
        allowDirectMessages: true,
        dataSharing: false,
        analyticsSharing: false,
        profileVisibility: 'public',
        postVisibility: 'public'
      },
      notifications: user.notificationPreferences || {},
      ai: user.aiPreferences || {},
      gamification: user.gamificationSettings || {},
      appearance: {
        theme: user.theme || 'system'
      }
    };

    res.status(StatusCodes.OK).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to get settings'
    });
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
    const { visibility, postVisibility } = req.body;

    const updateData = {};
    if (visibility !== undefined) updateData.visibility = visibility;
    if (postVisibility !== undefined) updateData.postVisibility = postVisibility;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true
    }).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: { visibility: user.visibility, postVisibility: user.postVisibility },
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
    const privacySettings = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { privacySettings },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: user.privacySettings,
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
    const notificationPreferences = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: user.notificationPreferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to update notification preferences'
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

// Update appearance settings only
const updateAppearance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme } = req.body;

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
      message: 'Appearance settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating appearance settings:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to update appearance settings'
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

module.exports = {
  getAllSettings,
  updateProfile,
  updateAccount,
  updatePrivacy,
  updateNotifications,
  updateAI,
  updateGamification,
  updateAppearance,
  bulkUpdate
};