const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const config = require('../config');
const logger = require('../utils/logger');
const { UnauthorizedError, BadRequestError } = require('../utils/errors');
const Token = require('../models/token.model');

class JWTService {
  /**
   * Generate access token
   * @param {Object} payload - Token payload
   * @param {string} payload.userId - User ID
   * @param {string} payload.email - User email
   * @param {string} payload.role - User role
   * @returns {string} JWT access token
   */
  static generateAccessToken(payload) {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          type: 'access',
          iat: Math.floor(Date.now() / 1000),
        },
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
      });

      return token;
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   * @param {Object} payload - Token payload
   * @param {string} payload.userId - User ID
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(payload) {
    try {
      const tokenId = crypto.randomBytes(32).toString('hex');
      
      const token = jwt.sign(
        {
          userId: payload.userId,
          tokenId,
          type: 'refresh',
          iat: Math.floor(Date.now() / 1000),
        },
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }).catch(error => {
        logger.error('Error storing refresh token hash:', error);
      });

      logger.info('Refresh token generated successfully', {
        userId: payload.userId,
        tokenId,
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
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @param {string} secret - Secret key for verification
   * @returns {Object} Decoded token payload
   */
  static async verifyToken(token, secret = config.jwt.secret) {
    try {
      const decoded = await promisify(jwt.verify)(token, secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      });

      logger.info('Token verified successfully', {
        userId: decoded.userId,
        type: decoded.type,
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
        throw new UnauthorizedError('Token verification failed');
      }
    }
  }

  /**
   * Verify access token
   * @param {string} token - Access token to verify
   * @returns {Object} Decoded token payload
   */
  static async verifyAccessToken(token) {
    const decoded = await this.verifyToken(token, config.jwt.secret);
    
    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  }

  /**
   * Verify refresh token
   * @param {string} token - Refresh token to verify
   * @returns {Object} Decoded token payload
   */
  static async verifyRefreshToken(token) {
    const decoded = await this.verifyToken(token, config.jwt.refreshSecret);
    
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
        { revoked: true }
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
        { revoked: true }
      );

      logger.info('All refresh tokens revoked for user', { userId });
    } catch (error) {
      logger.error('Error revoking all refresh tokens:', error);
      throw new Error('Failed to revoke all refresh tokens');
    }
  }

  /**
   * Generate token pair (access + refresh)
   * @param {Object} user - User object
   * @returns {Object} Token pair
   */
  static generateTokenPair(user) {
    const accessToken = this.generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.generateRefreshToken({
      userId: user._id,
    });

    return {
      accessToken,
      refreshToken,
    };
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
}

module.exports = JWTService; 