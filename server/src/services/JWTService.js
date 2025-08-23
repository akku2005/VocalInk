const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const config = require('../config');
const logger = require('../utils/logger');
const { UnauthorizedError, BadRequestError } = require('../utils/errors');
const Token = require('../models/token.model');

class JWTService {
  /**
   * Generate access token with enhanced security
   * @param {Object} payload - Token payload
   * @param {string} payload.userId - User ID
   * @param {string} payload.email - User email
   * @param {string} payload.role - User role
   * @param {Object} req - Request object for device binding
   * @returns {string} JWT access token
   */
  static generateAccessToken(payload, req = null) {
    try {
      const tokenPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString('hex'), // Unique token ID
      };

      // Add device binding if enabled
      if (process.env.JWT_BIND_TO_DEVICE === 'true' && req) {
        tokenPayload.deviceFingerprint = req.deviceFingerprint;
      }

      // Add IP binding if enabled
      if (process.env.JWT_BIND_TO_IP === 'true' && req) {
        tokenPayload.ipAddress = req.ip;
      }

      const token = jwt.sign(
        tokenPayload,
        config.jwt.secret,
        {
          expiresIn: config.jwt.accessExpiration,
          issuer: config.jwt.issuer,
          audience: config.jwt.audience,
        }
      );

      logger.info('Access token generated successfully', {
        userId: payload.userId,
        email: payload.email,
        deviceFingerprint: tokenPayload.deviceFingerprint,
        ipAddress: tokenPayload.ipAddress,
      });

      return token;
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token with enhanced security
   * @param {Object} payload - Token payload
   * @param {string} payload.userId - User ID
   * @param {Object} req - Request object for device binding
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(payload, req = null) {
    try {
      const tokenId = crypto.randomBytes(32).toString('hex');
      
      const tokenPayload = {
        userId: payload.userId,
        tokenId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString('hex'), // Unique token ID
      };

      // Add device binding if enabled
      if (process.env.JWT_BIND_TO_DEVICE === 'true' && req) {
        tokenPayload.deviceFingerprint = req.deviceFingerprint;
      }

      // Add IP binding if enabled
      if (process.env.JWT_BIND_TO_IP === 'true' && req) {
        tokenPayload.ipAddress = req.ip;
      }
      
      const token = jwt.sign(
        tokenPayload,
        config.jwt.refreshSecret,
        {
          expiresIn: config.jwt.refreshExpiration,
          issuer: config.jwt.issuer,
          audience: config.jwt.audience,
        }
      );

      // Store refresh token hash in database for revocation
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      Token.create({
        tokenHash,
        type: 'refresh',
        user: payload.userId,
        deviceFingerprint: tokenPayload.deviceFingerprint,
        ipAddress: tokenPayload.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }).catch(error => {
        logger.error('Error storing refresh token hash:', error);
      });

      logger.info('Refresh token generated successfully', {
        userId: payload.userId,
        tokenId,
        deviceFingerprint: tokenPayload.deviceFingerprint,
        ipAddress: tokenPayload.ipAddress,
      });

      return token;
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate verification token
   * @param {Object} payload - Token payload
   * @param {string} payload.userId - User ID
   * @param {string} payload.email - User email
   * @returns {string} JWT verification token
   */
  static generateVerificationToken(payload) {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          type: 'verification',
          iat: Math.floor(Date.now() / 1000),
          jti: crypto.randomBytes(16).toString('hex'), // Unique token ID
        },
        config.jwt.secret,
        {
          expiresIn: config.jwt.verificationExpiration || '10m',
          issuer: config.jwt.issuer,
          audience: config.jwt.audience,
        }
      );

      logger.info('Verification token generated successfully', {
        userId: payload.userId,
        email: payload.email,
      });

      return token;
    } catch (error) {
      logger.error('Error generating verification token:', error);
      throw new Error('Failed to generate verification token');
    }
  }

  /**
   * Generate reset password token
   * @param {Object} payload - Token payload
   * @param {string} payload.userId - User ID
   * @param {string} payload.email - User email
   * @returns {string} JWT reset token
   */
  static generateResetToken(payload) {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          type: 'reset',
          iat: Math.floor(Date.now() / 1000),
          jti: crypto.randomBytes(16).toString('hex'), // Unique token ID
        },
        config.jwt.secret,
        {
          expiresIn: config.jwt.resetExpiration || '1h',
          issuer: config.jwt.issuer,
          audience: config.jwt.audience,
        }
      );

      logger.info('Reset token generated successfully', {
        userId: payload.userId,
        email: payload.email,
      });

      return token;
    } catch (error) {
      logger.error('Error generating reset token:', error);
      throw new Error('Failed to generate reset token');
    }
  }

  /**
   * Verify JWT token with enhanced security checks
   * @param {string} token - JWT token to verify
   * @param {string} secret - Secret key for verification
   * @param {Object} req - Request object for device/IP binding validation
   * @returns {Object} Decoded token payload
   */
  static async verifyToken(token, secret = config.jwt.secret, req = null) {
    try {
      const decoded = await promisify(jwt.verify)(token, secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      });

      // Validate device binding if enabled
      if (process.env.JWT_BIND_TO_DEVICE === 'true' && req && decoded.deviceFingerprint) {
        if (decoded.deviceFingerprint !== req.deviceFingerprint) {
          logger.warn('Device fingerprint mismatch', {
            tokenDeviceFingerprint: decoded.deviceFingerprint,
            requestDeviceFingerprint: req.deviceFingerprint,
            userId: decoded.userId,
          });
          throw new UnauthorizedError('Token is not valid for this device');
        }
      }

      // Validate IP binding if enabled
      if (process.env.JWT_BIND_TO_IP === 'true' && req && decoded.ipAddress) {
        if (decoded.ipAddress !== req.ip) {
          logger.warn('IP address mismatch', {
            tokenIpAddress: decoded.ipAddress,
            requestIpAddress: req.ip,
            userId: decoded.userId,
          });
          throw new UnauthorizedError('Token is not valid for this IP address');
        }
      }

      logger.info('Token verified successfully', {
        userId: decoded.userId,
        type: decoded.type,
        jti: decoded.jti,
      });

      return decoded;
    } catch (error) {
      logger.warn('Token verification failed:', {
        error: error.message,
        tokenType: 'unknown',
      });

      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      } else if (error.name === 'NotBeforeError') {
        throw new UnauthorizedError('Token not active');
      } else {
        throw error; // Re-throw custom errors
      }
    }
  }

  /**
   * Verify access token with enhanced security
   * @param {string} token - Access token to verify
   * @param {Object} req - Request object for device/IP binding validation
   * @returns {Object} Decoded token payload
   */
  static async verifyAccessToken(token, req = null) {
    const decoded = await this.verifyToken(token, config.jwt.secret, req);
    
    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  }

  /**
   * Verify refresh token with enhanced security
   * @param {string} token - Refresh token to verify
   * @param {Object} req - Request object for device/IP binding validation
   * @returns {Object} Decoded token payload
   */
  static async verifyRefreshToken(token, req = null) {
    const decoded = await this.verifyToken(token, config.jwt.refreshSecret, req);
    
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }

    // Check if refresh token is revoked in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenRecord = await Token.findOne({
      tokenHash,
      type: 'refresh',
      revoked: false,
    });

    if (!tokenRecord) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    // Validate device binding if stored
    if (tokenRecord.deviceFingerprint && req && req.deviceFingerprint) {
      if (tokenRecord.deviceFingerprint !== req.deviceFingerprint) {
        logger.warn('Refresh token device fingerprint mismatch', {
          storedDeviceFingerprint: tokenRecord.deviceFingerprint,
          requestDeviceFingerprint: req.deviceFingerprint,
          userId: decoded.userId,
        });
        throw new UnauthorizedError('Refresh token is not valid for this device');
      }
    }

    // Validate IP binding if stored
    if (tokenRecord.ipAddress && req && req.ip) {
      if (tokenRecord.ipAddress !== req.ip) {
        logger.warn('Refresh token IP address mismatch', {
          storedIpAddress: tokenRecord.ipAddress,
          requestIpAddress: req.ip,
          userId: decoded.userId,
        });
        throw new UnauthorizedError('Refresh token is not valid for this IP address');
      }
    }

    return decoded;
  }

  /**
   * Verify verification token
   * @param {string} token - Verification token to verify
   * @returns {Object} Decoded token payload
   */
  static async verifyVerificationToken(token) {
    const decoded = await this.verifyToken(token, config.jwt.secret);
    
    if (decoded.type !== 'verification') {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  }

  /**
   * Verify reset token
   * @param {string} token - Reset token to verify
   * @returns {Object} Decoded token payload
   */
  static async verifyResetToken(token) {
    const decoded = await this.verifyToken(token, config.jwt.secret);
    
    if (decoded.type !== 'reset') {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  }

  /**
   * Revoke refresh token
   * @param {string} token - Refresh token to revoke
   */
  static async revokeRefreshToken(token) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await Token.findOneAndUpdate(
        { tokenHash, type: 'refresh' },
        { revoked: true, revokedAt: new Date() }
      );

      logger.info('Refresh token revoked successfully');
    } catch (error) {
      logger.error('Error revoking refresh token:', error);
      throw new Error('Failed to revoke refresh token');
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * @param {string} userId - User ID
   */
  static async revokeAllRefreshTokens(userId) {
    try {
      await Token.updateMany(
        { user: userId, type: 'refresh' },
        { revoked: true, revokedAt: new Date() }
      );

      logger.info('All refresh tokens revoked for user', { userId });
    } catch (error) {
      logger.error('Error revoking all refresh tokens:', error);
      throw new Error('Failed to revoke all refresh tokens');
    }
  }

  /**
   * Generate token pair (access + refresh) with enhanced security
   * @param {Object} user - User object
   * @param {Object} req - Request object for device binding
   * @returns {Object} Token pair
   */
  static generateTokenPair(user, req = null) {
    const accessToken = this.generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    }, req);

    const refreshToken = this.generateRefreshToken({
      userId: user._id,
    }, req);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Check if token needs rotation
   * @param {string} token - JWT token
   * @returns {boolean} True if token needs rotation
   */
  static shouldRotateToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return false;

      const now = Math.floor(Date.now() / 1000);
      const rotationThreshold = parseInt(process.env.JWT_ROTATION_THRESHOLD) || 300; // 5 minutes
      
      return (decoded.exp - now) <= rotationThreshold;
    } catch (error) {
      return false;
    }
  }

  /**
   * Rotate tokens if needed
   * @param {string} accessToken - Current access token
   * @param {string} refreshToken - Current refresh token
   * @param {Object} user - User object
   * @param {Object} req - Request object
   * @returns {Object|null} New token pair if rotation needed, null otherwise
   */
  static async rotateTokensIfNeeded(accessToken, refreshToken, user, req) {
    if (process.env.JWT_ENABLE_ROTATION !== 'true') {
      return null;
    }

    if (this.shouldRotateToken(accessToken)) {
      logger.info('Token rotation triggered', {
        userId: user._id,
        reason: 'expiration_threshold_reached',
      });

      // Revoke the old refresh token
      await this.revokeRefreshToken(refreshToken);

      // Generate new token pair
      const newTokens = this.generateTokenPair(user, req);

      return newTokens;
    }

    return null;
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Error decoding token:', error);
      throw new BadRequestError('Invalid token format');
    }
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date} Expiration date
   */
  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        throw new BadRequestError('Invalid token format');
      }
      return new Date(decoded.exp * 1000);
    } catch (error) {
      logger.error('Error getting token expiration:', error);
      throw new BadRequestError('Invalid token format');
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if expired
   */
  static isTokenExpired(token) {
    try {
      const expiration = this.getTokenExpiration(token);
      return expiration < new Date();
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token metadata
   * @param {string} token - JWT token
   * @returns {Object} Token metadata
   */
  static getTokenMetadata(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded) {
        throw new BadRequestError('Invalid token format');
      }

      return {
        type: decoded.type,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000),
        jti: decoded.jti,
        deviceFingerprint: decoded.deviceFingerprint,
        ipAddress: decoded.ipAddress,
        isExpired: this.isTokenExpired(token),
      };
    } catch (error) {
      logger.error('Error getting token metadata:', error);
      throw new BadRequestError('Invalid token format');
    }
  }
}

module.exports = JWTService; 