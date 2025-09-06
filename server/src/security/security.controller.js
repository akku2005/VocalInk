const { StatusCodes } = require('http-status-codes');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');

const User = require('../models/user.model');
const Session = require('../models/session.model');
const { NotFoundError, ValidationError, UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

// Generate 2FA secret and QR code
exports.generate2FASecret = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `VocalInk (${user.email})`,
      issuer: 'VocalInk',
      length: 32,
    });

    // Store temporary secret (not enabled yet)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32,
      },
    });
  } catch (error) {
    logger.error('Error generating 2FA secret:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while generating 2FA secret',
      });
    }
  }
};

// Verify and enable 2FA
exports.enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('2FA token is required');
    }

    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new NotFoundError('User not found or 2FA not set up');
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) {
      throw new ValidationError('Invalid 2FA token');
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    // Store backup codes (hashed)
    user.backupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: '2FA enabled successfully',
      data: {
        backupCodes,
      },
    });
  } catch (error) {
    logger.error('Error enabling 2FA:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while enabling 2FA',
      });
    }
  }
};

// Disable 2FA
exports.disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password, token } = req.body;

    if (!password) {
      throw new ValidationError('Password is required to disable 2FA');
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid password');
    }

    // If 2FA is enabled, verify token
    if (user.twoFactorEnabled && token) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2,
      });

      if (!verified) {
        throw new ValidationError('Invalid 2FA token');
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.backupCodes = undefined;
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    logger.error('Error disabling 2FA:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while disabling 2FA',
      });
    }
  }
};

// Get active sessions
exports.getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await Session.find({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActivity: -1 });

    const sessionsWithDetails = sessions.map(session => ({
      id: session._id,
      device: session.deviceInfo?.device || 'Unknown Device',
      browser: session.deviceInfo?.browser || 'Unknown Browser',
      os: session.deviceInfo?.os || 'Unknown OS',
      location: session.location || 'Unknown Location',
      ipAddress: session.ipAddress,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      isCurrent: session.sessionToken === req.sessionToken,
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        sessions: sessionsWithDetails,
        totalSessions: sessionsWithDetails.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching active sessions:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching sessions',
    });
  }
};

// Revoke session
exports.revokeSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    session.isActive = false;
    session.revokedAt = new Date();
    await session.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    logger.error('Error revoking session:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while revoking session',
      });
    }
  }
};

// Revoke all sessions except current
exports.revokeAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentSessionToken = req.sessionToken;

    await Session.updateMany(
      {
        userId,
        sessionToken: { $ne: currentSessionToken },
        isActive: true,
      },
      {
        isActive: false,
        revokedAt: new Date(),
      }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'All other sessions revoked successfully',
    });
  } catch (error) {
    logger.error('Error revoking all sessions:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while revoking sessions',
    });
  }
};

// Export user data
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .select('-password -twoFactorSecret -resetPasswordToken -resetPasswordCode')
      .populate('badges', 'name description')
      .populate('followers', 'name email')
      .populate('following', 'name email');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get user's blogs, comments, etc. (you'll need to implement based on your models)
    const userData = {
      profile: user.toObject(),
      exportDate: new Date().toISOString(),
      // Add other user data like blogs, comments, etc.
    };

    res.status(StatusCodes.OK).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    logger.error('Error exporting user data:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while exporting data',
      });
    }
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password, confirmText } = req.body;

    if (!password || confirmText !== 'DELETE') {
      throw new ValidationError('Password and confirmation text required');
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid password');
    }

    // Delete all user-related data
    await Promise.all([
      // Revoke and delete all sessions
      Session.deleteMany({ userId }),
      
      // Delete user's blogs/posts if you have a Blog model
      // Blog.deleteMany({ author: userId }),
      
      // Delete user's comments if you have a Comment model
      // Comment.deleteMany({ author: userId }),
      
      // Delete user's notifications if you have a Notification model
      // Notification.deleteMany({ userId }),
      
      // Delete user's activities if you have an Activity model
      // Activity.deleteMany({ userId }),
      
      // You can add more model deletions here based on your schema
    ]);

    // Finally delete the user account completely
    await User.findByIdAndDelete(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Account and all associated data deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting account:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while deleting account',
      });
    }
  }
};
