const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const User = require('../models/user.model');
const Token = require('../models/token.model');
// const AuditLog = require('../models/AuditLog');
const { validationResult } = require('express-validator');
const { sendEmail } = require('../services/EmailService');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const config = require('../config');
const TokenService = require('../services/TokenService');
const EmailService = require('../services/EmailService');
const { ValidationError, UnauthorizedError, ConflictError, BadRequestError } = require('../utils/errors');
const mongoose = require('mongoose');
const { ipKeyGenerator } = require('express-rate-limit');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Create EmailService instance
const emailService = new EmailService();

// Rate Limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.security.login.maxAttempts,
  message: 'Too many login attempts from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.security.passwordReset.maxAttempts,
  keyGenerator: (req) => req.body.email || ipKeyGenerator(req),
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const verificationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: config.security.verification.maxAttempts,
  keyGenerator: (req) => req.body.email || ipKeyGenerator(req),
  message: 'Too many verification attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Helper Functions
const generateResetToken = () => {
  return crypto.randomBytes(config.security.resetToken.length).toString('hex');
};

const logAuthActivity = async (req, action, metadata = {}) => {
  try {
    // await AuditLog.create({
    //   event: action,
    //   userId: metadata.userId,
    //   ipAddress: req.ip,
    //   userAgent: req.headers['user-agent'],
    //   details: metadata
    // });
  } catch (error) {
    logger.error('Failed to log auth activity:', error);
  }
};

// Helper to generate a numerical code
const generateNumericalCode = (length = 6) => {
  return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
};

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, name, role, skipVerification } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      // For admin role creation, check if it's allowed
      if (role === 'admin') {
        // Check if any admin exists in the system
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
          // If admin exists, only existing admins can create new admin accounts
          if (!req.user || req.user.role !== 'admin') {
            throw new UnauthorizedError('Only existing admins can create new admin accounts');
          }
        } else {
          // If no admin exists, allow admin creation but log it
          logger.warn('First admin account being created', {
            email,
            ip: req.ip,
            userAgent: req.get('user-agent')
          });
        }
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        name,
        role: role || 'reader'
      });

      // For admin users, automatically verify and provide tokens
      if (user.role === 'admin') {
        // Auto-verify admin accounts
        user.isVerified = true;
        await user.save();

        // Generate access and refresh tokens
        const accessToken = jwt.sign(
          { 
            userId: user._id, 
            email: user.email, 
            role: user.role 
          },
          config.jwt.secret,
          { 
            expiresIn: config.jwt.accessExpiration,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience
          }
        );

        const refreshToken = jwt.sign(
          { 
            userId: user._id, 
            tokenId: crypto.randomBytes(32).toString('hex') 
          },
          config.jwt.refreshSecret,
          { 
            expiresIn: config.jwt.refreshExpiration,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience
          }
        );

        // Log the admin registration
        await logAuthActivity(req, 'AUTH_REGISTER', {
          userId: user._id,
          email: user.email,
          role: user.role,
          autoVerified: true
        });

        // Send admin creation notification
        try {
          const creatorEmail = req.user ? req.user.email : 'system';
          await emailService.sendAdminCreationNotification(user.email, user.name, creatorEmail);
        } catch (error) {
          logger.error('Error sending admin creation notification:', {
            error: error.message,
            userId: user._id
          });
        }

        return res.status(201).json({
          success: true,
          message: 'Admin account created and verified successfully.',
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified
          },
          tokens: {
            accessToken,
            refreshToken
          }
        });
      }

      // For regular users, check if verification should be skipped
      if (skipVerification && process.env.NODE_ENV === 'development') {
        // Auto-verify user for development
        user.isVerified = true;
        await user.save();

        // Generate access and refresh tokens
        const accessToken = jwt.sign(
          { 
            userId: user._id, 
            email: user.email, 
            role: user.role 
          },
          config.jwt.secret,
          { 
            expiresIn: config.jwt.accessExpiration,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience
          }
        );

        const refreshToken = jwt.sign(
          { 
            userId: user._id, 
            tokenId: crypto.randomBytes(32).toString('hex') 
          },
          config.jwt.refreshSecret,
          { 
            expiresIn: config.jwt.refreshExpiration,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience
          }
        );

        // Log the registration
        await logAuthActivity(req, 'AUTH_REGISTER', {
          userId: user._id,
          email: user.email,
          role: user.role,
          autoVerified: true
        });

        return res.status(201).json({
          success: true,
          message: 'User account created and verified successfully (development mode).',
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified
          },
          tokens: {
            accessToken,
            refreshToken
          }
        });
      }

      // For regular users, proceed with email verification
      const verificationCode = await user.generateVerificationCode();
      const { token: verificationToken } = await Token.generateVerificationToken(user, verificationCode);

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, verificationCode);
        logger.info('Verification email sent successfully', { userId: user._id });
      } catch (error) {
        logger.error('Error sending verification email:', {
          error: error.message,
          userId: user._id
        });
      }

      // Log the registration
      await logAuthActivity(req, 'AUTH_REGISTER', {
        userId: user._id,
        email: user.email,
        role: user.role
      });

      const response = {
        success: true,
        message: 'Registration successful. Please check your email for verification.',
        userId: user._id,
        verificationToken
      };
      if (process.env.NODE_ENV !== 'production') {
        response.verificationCode = verificationCode;
      }
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error occurred', {
        error: error.message,
        body: req.body,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        userAgent: req.get('user-agent'),
        stack: error.stack
      });

      // Friendly error handling
      if (error.name === 'ConflictError' || error.message === 'Email already registered') {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
      if (error.isOperational) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'An error occurred during registration'
        });
      }
    }
  }

  static sanitizeUser(user) {
    const sanitized = user.toObject();
    delete sanitized.password;
    delete sanitized.resetToken;
    delete sanitized.resetTokenExpires;
    return sanitized;
  }

  // 2FA: Step 1 - Generate secret and QR code
  static async generate2FASetup(req, res, next) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      if (user.twoFactorEnabled) return res.status(400).json({ success: false, message: '2FA already enabled' });
      const secret = speakeasy.generateSecret({ name: `VocalInk (${user.email})` });
      user.twoFactorSecret = secret.base32;
      await user.save();
      const qr = await qrcode.toDataURL(secret.otpauth_url);
      res.json({ success: true, secret: secret.base32, qr });
    } catch (err) {
      next(err);
    }
  }

  // 2FA: Step 2 - Verify code and enable 2FA
  static async verify2FASetup(req, res, next) {
    try {
      const user = req.user;
      const { token } = req.body;
      if (!user.twoFactorSecret) return res.status(400).json({ success: false, message: '2FA not initialized' });
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token
      });
      if (verified) {
        user.twoFactorEnabled = true;
        await user.save();
        return res.json({ success: true, message: '2FA enabled' });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid 2FA code' });
      }
    } catch (err) {
      next(err);
    }
  }

  // 2FA: Disable 2FA (requires valid code)
  static async disable2FA(req, res, next) {
    try {
      const user = req.user;
      const { token } = req.body;
      if (!user.twoFactorEnabled || !user.twoFactorSecret) return res.status(400).json({ success: false, message: '2FA not enabled' });
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token
      });
      if (verified) {
        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        await user.save();
        return res.json({ success: true, message: '2FA disabled' });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid 2FA code' });
      }
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password, twoFactorToken } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      if (!user.isVerified) {
        throw new UnauthorizedError('Please verify your email before logging in');
      }

      if (user.twoFactorEnabled) {
        if (!twoFactorToken) {
          return res.status(401).json({ success: false, message: '2FA code required', twoFactorRequired: true });
        }
        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: twoFactorToken
        });
        if (!verified) {
          return res.status(401).json({ success: false, message: 'Invalid 2FA code', twoFactorRequired: true });
        }
      }

      let tokens;
      try {
        tokens = await TokenService.generateTokens(user);
      } catch (error) {
        logger.error('Error generating tokens:', {
          error: error.message,
          userId: user._id
        });
        throw new Error('Error generating tokens');
      }

      res.status(200).json({
        success: true,
        message: 'Login successful',
        ...tokens
      });
    } catch (error) {
      logger.error('Error occurred', {
        error: error.message,
        body: req.body,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        userAgent: req.get('user-agent'),
        stack: error.stack
      });

      // Friendly error handling for login
      if (error.name === 'UnauthorizedError' || error.message === 'Invalid credentials') {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      if (error.isOperational) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'An error occurred during login'
        });
      }
    }
  }

  static async verifyEmail(req, res, next) {
    try {
      const { code } = req.body;

      // Get verification token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Verification token is required in Authorization header');
      }
      const verificationToken = authHeader.substring(7);

      // Find and validate the token
      console.log('Looking for token:', verificationToken, new Date());
      const token = await Token.findByToken(verificationToken);
      console.log('Token found:', token);
      if (!token || token.revoked || token.type !== 'verification' || token.isExpired()) {
        throw new UnauthorizedError('Invalid or expired verification token');
      }

      // Verify the code
      if (!token.verifyCode(code)) {
        throw new UnauthorizedError('Invalid or expired verification code');
      }

      // Find and update the user
      const user = await User.findById(token.user);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Mark user as verified
      user.isVerified = true;
      await user.save();

      // Revoke the verification token
      await token.revoke();

      // Generate new auth tokens
      let tokens;
      try {
        tokens = await TokenService.generateTokens(user);
      } catch (error) {
        logger.error('Error generating tokens:', {
          error: error.message,
          userId: user._id
        });
        // Return success without tokens if token generation fails
        return res.status(200).json({
          success: true,
          message: 'Email verified successfully',
          userId: user._id
        });
      }

      // Send verification success email
      try {
        await emailService.sendVerificationSuccessEmail(user.email, user.name);
        logger.info('Verification success email sent', { userId: user._id });
      } catch (error) {
        logger.error('Error sending verification success email:', {
          error: error.message,
          userId: user._id
        });
        // Continue even if email fails
      }

      // Log the verification
      await logAuthActivity(req, 'AUTH_EMAIL_VERIFICATION_SUCCESS', {
        userId: user._id,
        email: user.email
      });

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        isVerified: true,
        ...tokens
      });
    } catch (error) {
      logger.error('Error occurred', {
        error: error.message,
        body: req.body,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        userAgent: req.get('user-agent'),
        stack: error.stack
      });

      if (error.isOperational) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'An error occurred during email verification'
        });
      }
    }
  }

  static async resendVerificationCode(req, res, next) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'Email already verified' });
      }

      // Generate new verification code
      const verificationCode = generateNumericalCode(6);
      // Generate a new verification token and store it in DB
      const { token: verificationToken } = await Token.generateVerificationToken(user, verificationCode);

      // Send new verification email
      await emailService.sendVerificationEmail(user.email, verificationCode);

      // Log the resend
      await logAuthActivity(req, 'AUTH_RESEND_VERIFICATION', {
        userId: user._id,
        email: user.email
      });

      const response = {
        success: true,
        message: 'Verification code resent successfully. Please check your email.',
        verificationToken
      };
      if (process.env.NODE_ENV !== 'production') {
        response.verificationCode = verificationCode;
      }
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error occurred', {
        error: error.message,
        body: req.body,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        userAgent: req.get('user-agent'),
        stack: error.stack
      });
      res.status(500).json({ success: false, message: 'An error occurred while resending verification code' });
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        logger.info('Password reset requested for non-existent email', { email });
        return res.status(200).json({
          success: true,
          message: 'If the email exists, password reset instructions will be sent'
        });
      }

      // Generate reset code and token
      const resetCode = generateNumericalCode(6);
      const resetToken = crypto.randomBytes(32).toString('hex');
      console.log('Generated raw resetToken:', resetToken);

      // Hash the reset token
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      console.log('Hashed resetToken (to be saved):', hashedToken);

      // Save reset token and code
      user.resetPasswordToken = hashedToken;
      user.resetPasswordCode = resetCode;
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      // Send reset email
      try {
        await emailService.sendPasswordResetEmail(user.email, resetCode);
        logger.info('Password reset email sent', { userId: user._id });
      } catch (error) {
        logger.error('Error sending password reset email:', {
          error: error.message,
          userId: user._id
        });
        throw new Error('Error sending password reset email');
      }

      // Log the password reset request
      await logAuthActivity(req, 'AUTH_PASSWORD_RESET_REQUEST', {
        userId: user._id,
        email: user.email
      });

      // For dev: return the raw token and code in the response
      const response = {
        success: true,
        message: 'If the email exists, password reset instructions will be sent'
      };
      if (process.env.NODE_ENV === 'development') {
        response.resetToken = resetToken;
      }
      return res.status(200).json(response);
    } catch (error) {
      logger.error('Error in forgot password:', {
        error: error.message,
        body: req.body,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      res.status(500).json({ success: false, message: 'An error occurred during password reset request' });
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, code, newPassword } = req.body;

      // Hash the provided token to compare with stored hash
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      console.log('Reset password: raw token:', token);
      console.log('Reset password: hashed token:', hashedToken);

      // Find user by reset token
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
      }).select('+resetPasswordCode +resetPasswordToken +resetPasswordExpires +password');
      console.log('User found for reset:', user);

      if (!user) {
        throw new UnauthorizedError('Invalid or expired reset token');
      }

      // Verify reset code
      const userCode = (user.resetPasswordCode || '').toString().trim();
      const inputCode = (code || '').toString().trim();
      if (!userCode || !inputCode || userCode !== inputCode) {
        throw new UnauthorizedError('Invalid reset code');
      }

      // Check if new password is different from current
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        throw new BadRequestError('New password must be different from current password');
      }

      // Update password and clear reset fields
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordCode = undefined;
      user.resetPasswordExpires = undefined;
      
      // Save the updated user
      await user.save();

      // Log the successful password reset
      await logAuthActivity(req, 'AUTH_PASSWORD_RESET_SUCCESS', {
        userId: user._id,
        email: user.email
      });

      // Send password changed notification
      try {
        await emailService.sendPasswordChangeNotification(user.email);
      } catch (error) {
        logger.error('Error sending password change notification:', {
          error: error.message,
          userId: user._id
        });
        // Continue even if email fails
      }

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } catch (error) {
      logger.error('Error in reset password:', {
        error: error.message,
        body: req.body,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      res.status(500).json({ success: false, message: 'An error occurred during password reset' });
    }
  }

  static async changePassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', StatusCodes.BAD_REQUEST, errors.array());
      }

      const { currentPassword, newPassword } = req.body;

      // Fetch user with password for comparison
      const user = await User.findById(req.user.id).select('+password');
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      user.passwordChangedAt = new Date();
      await user.save();

      // Revoke all user sessions
      await TokenService.revokeAllUserTokens(user._id, 'Password changed');

      // Send security alert email
      await emailService.sendSecurityAlertEmail(user, {
        type: 'Password Changed',
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Error in change password:', {
        error: error.message,
        body: req.body,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      res.status(500).json({ success: false, message: 'An error occurred during password change' });
    }
  }

  static async logout(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        await TokenService.revokeToken(token);
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Error occurred', {
        error: error.message,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        userAgent: req.get('user-agent'),
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'An error occurred during logout'
      });
    }
  }

  static async logoutAll(req, res, next) {
    try {
      // Revoke all user tokens
      await TokenService.revokeAllUserTokens(req.user._id, 'User logged out from all devices');

      // Log security event
      await req.user.logSecurityEvent('logout_all', {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Send security alert email
      await emailService.sendSecurityAlertEmail(req.user, {
        type: 'Logged Out From All Devices',
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      logger.error('Error in logoutAll:', {
        error: error.message,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        userAgent: req.get('user-agent'),
        stack: error.stack
      });
      res.status(500).json({ success: false, message: 'An error occurred during logout from all devices' });
    }
  }

  static async getCurrentUser(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }
      const userObj = user.toObject();
      delete userObj.password;
      return res.status(200).json({
        success: true,
        data: userObj
      });
    } catch (error) {
      logger.error('Error occurred', {
        error: error.message,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        userAgent: req.get('user-agent'),
        stack: error.stack
      });

      if (error.isOperational) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'An error occurred while fetching user data'
        });
      }
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token is required' });
      }
      // Verify refresh token
      const { decoded, tokenRecord } = await TokenService.verifyToken(refreshToken, 'refresh');
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      }
      // Get user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      // Revoke the used refresh token
      await TokenService.revokeToken(refreshToken);
      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await TokenService.generateTokens(user);
      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        accessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      logger.error('Error occurred', {
        error: error.message,
        body: req.body,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        userAgent: req.get('user-agent'),
        stack: error.stack
      });
      if (error.name === 'UnauthorizedError' || error.message === 'Invalid token' || error.message === 'Token has been revoked' || error.message === 'Token has expired') {
        return res.status(401).json({ success: false, message: error.message });
      }
      if (error.isOperational) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'An error occurred during token refresh'
        });
      }
    }
  }

  static async getUserSessions(req, res, next) {
    try {
      const sessions = await TokenService.getUserSessions(req.user._id);
      res.status(200).json({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            id: session._id,
            deviceInfo: session.deviceInfo,
            lastUsedAt: session.lastUsedAt,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt
          }))
        }
      });
    } catch (error) {
      logger.error('Error in getUserSessions:', {
        error: error.message,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        userAgent: req.get('user-agent'),
        stack: error.stack
      });
      res.status(500).json({ success: false, message: 'An error occurred while fetching user sessions' });
    }
  }
}

const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return false;
  }
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return false;
  }
  return true;
};

const checkPasswordHistory = async (userId, newPassword) => {
  const user = await User.findById(userId).select('passwordHistory');
  if (!user.passwordHistory) {
    return false;
  }

  for (const historyEntry of user.passwordHistory) {
    const isMatch = await bcrypt.compare(newPassword, historyEntry.password);
    if (isMatch) {
      return true;
    }
  }
  return false;
};

const updatePasswordHistory = async (userId, newPassword) => {
  const user = await User.findById(userId);
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  if (!user.passwordHistory) {
    user.passwordHistory = [];
  }

  user.passwordHistory.push({
    password: hashedPassword,
    changedAt: new Date()
  });

  // Keep only last 5 passwords
  if (user.passwordHistory.length > 5) {
    user.passwordHistory = user.passwordHistory.slice(-5);
  }

  await user.save();
};

module.exports = {
  register: AuthController.register,
  login: AuthController.login,
  logout: AuthController.logout,
  logoutAll: AuthController.logoutAll,
  verifyEmail: AuthController.verifyEmail,
  resendVerificationCode: AuthController.resendVerificationCode,
  forgotPassword: AuthController.forgotPassword,
  resetPassword: AuthController.resetPassword,
  changePassword: AuthController.changePassword,
  getCurrentUser: AuthController.getCurrentUser,
  refreshToken: AuthController.refreshToken,
  getUserSessions: AuthController.getUserSessions,
  generate2FASetup: AuthController.generate2FASetup,
  verify2FASetup: AuthController.verify2FASetup,
  disable2FA: AuthController.disable2FA
};
