const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const logger = require('../utils/logger');
const SecurityMonitoringService = require('../services/SecurityMonitoringService');

/**
 * Enhanced Rate Limiter with Security Monitoring
 * Provides adaptive rate limiting based on security events and user behavior
 */
class EnhancedRateLimiter {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.securityMonitor = new SecurityMonitoringService();
    this.rateLimiters = new Map();
    this.userBehavior = new Map();
    this.suspiciousIPs = new Set();
    
    this.initializeRateLimiters();
    this.setupSecurityMonitoring();
  }

  /**
   * Initialize rate limiters with different strategies
   */
  initializeRateLimiters() {
    // Global rate limiter - very permissive for legitimate users
    this.globalLimiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args) => this.redis.call(...args),
      }),
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // 1000 requests per 15 minutes
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.handleRateLimitExceeded(req, res, 'global');
      }
    });

    // Authentication rate limiter - stricter for login attempts
    this.authLimiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args) => this.redis.call(...args),
      }),
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 login attempts per 15 minutes
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.handleRateLimitExceeded(req, res, 'authentication');
      }
    });

    // API rate limiter - moderate for API endpoints
    this.apiLimiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args) => this.redis.call(...args),
      }),
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 API requests per 15 minutes
      message: {
        error: 'API rate limit exceeded, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.handleRateLimitExceeded(req, res, 'api');
      }
    });

    // File upload rate limiter - strict for file operations
    this.uploadLimiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args) => this.redis.call(...args),
      }),
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 file uploads per hour
      message: {
        error: 'File upload limit exceeded, please try again later.',
        retryAfter: '1 hour'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.handleRateLimitExceeded(req, res, 'file_upload');
      }
    });

    // Dynamic rate limiter - adapts based on security events
    this.dynamicLimiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args) => this.redis.call(...args),
      }),
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: (req) => this.getDynamicLimit(req), // Dynamic limit based on security context
      message: {
        error: 'Rate limit exceeded due to security concerns.',
        retryAfter: '5 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.handleRateLimitExceeded(req, res, 'dynamic');
      }
    });

    logger.info('Enhanced rate limiters initialized');
  }

  /**
   * Setup security monitoring integration
   */
  setupSecurityMonitoring() {
    // Listen for security events
    this.securityMonitor.on('securityEvent', (event) => {
      this.handleSecurityEvent(event);
    });

    this.securityMonitor.on('thresholdExceeded', (data) => {
      this.handleThresholdExceeded(data);
    });

    this.securityMonitor.on('threatLevelChanged', (threatLevel) => {
      this.handleThreatLevelChange(threatLevel);
    });

    this.securityMonitor.on('attackDetected', (attack) => {
      this.handleAttackDetected(attack);
    });
  }

  /**
   * Get dynamic rate limit based on security context
   */
  getDynamicLimit(req) {
    const ip = req.ip;
    const userId = req.user?.id || 'anonymous';
    
    // Base limit
    let limit = 50;
    
    // Reduce limit for suspicious IPs
    if (this.suspiciousIPs.has(ip)) {
      limit = Math.floor(limit * 0.1); // 10% of base limit
    }
    
    // Reduce limit for users with suspicious behavior
    const userBehavior = this.userBehavior.get(userId);
    if (userBehavior && userBehavior.suspiciousScore > 0.7) {
      limit = Math.floor(limit * 0.5); // 50% of base limit
    }
    
    // Reduce limit during high threat periods
    const currentThreatLevel = this.securityMonitor.getSecurityStats().eventsByThreatLevel;
    if (currentThreatLevel.critical > 0) {
      limit = Math.floor(limit * 0.2); // 20% of base limit
    } else if (currentThreatLevel.high > 5) {
      limit = Math.floor(limit * 0.5); // 50% of base limit
    }
    
    return Math.max(limit, 5); // Minimum limit of 5
  }

  /**
   * Handle rate limit exceeded
   */
  handleRateLimitExceeded(req, res, limiterType) {
    const ip = req.ip;
    const userId = req.user?.id || 'anonymous';
    
    // Log the rate limit violation
    this.securityMonitor.logSecurityEvent('rate_limit_exceeded', {
      limiterType,
      ip,
      userId,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method
    }, this.securityMonitor.threatLevels.MEDIUM);

    // Update user behavior tracking
    this.updateUserBehavior(userId, ip, 'rate_limit_violation');

    // Check if IP should be marked as suspicious
    this.checkSuspiciousIP(ip);

    // Return rate limit response
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: this.getRateLimitMessage(limiterType),
      retryAfter: res.getHeader('Retry-After')
    });
  }

  /**
   * Handle security events
   */
  handleSecurityEvent(event) {
    const { eventType, source, threatLevel } = event;
    
    // Update user behavior based on security events
    if (source.userId !== 'anonymous') {
      this.updateUserBehavior(source.userId, source.ip, eventType);
    }

    // Mark IP as suspicious for high-threat events
    if (threatLevel === this.securityMonitor.threatLevels.HIGH || 
        threatLevel === this.securityMonitor.threatLevels.CRITICAL) {
      this.suspiciousIPs.add(source.ip);
    }

    // Adjust rate limits based on security context
    this.adjustRateLimits(event);
  }

  /**
   * Handle threshold exceeded
   */
  handleThresholdExceeded(data) {
    const { eventType, count, threshold } = data;
    
    logger.warn('Security threshold exceeded', {
      eventType,
      count,
      threshold,
      action: 'Adjusting rate limits'
    });

    // Temporarily reduce rate limits for affected endpoints
    this.temporarilyReduceLimits(eventType);
  }

  /**
   * Handle threat level change
   */
  handleThreatLevelChange(threatLevel) {
    logger.info('Threat level changed', { threatLevel });
    
    // Adjust global rate limits based on threat level
    if (threatLevel === this.securityMonitor.threatLevels.CRITICAL) {
      this.setEmergencyMode();
    } else if (threatLevel === this.securityMonitor.threatLevels.HIGH) {
      this.setHighAlertMode();
    } else {
      this.setNormalMode();
    }
  }

  /**
   * Handle attack detected
   */
  handleAttackDetected(attack) {
    const { attackType, source } = attack;
    
    logger.error('Attack detected', { attackType, source });
    
    // Immediately block the source IP
    this.blockIP(source.ip);
    
    // Set emergency mode
    this.setEmergencyMode();
    
    // Notify administrators (in production, this would send alerts)
    this.notifyAdministrators(attack);
  }

  /**
   * Update user behavior tracking
   */
  updateUserBehavior(userId, ip, eventType) {
    if (!this.userBehavior.has(userId)) {
      this.userBehavior.set(userId, {
        suspiciousScore: 0,
        events: [],
        lastUpdated: Date.now()
      });
    }

    const behavior = this.userBehavior.get(userId);
    const event = {
      type: eventType,
      timestamp: Date.now(),
      ip
    };

    behavior.events.push(event);
    
    // Calculate suspicious score based on recent events
    const recentEvents = behavior.events.filter(e => 
      Date.now() - e.timestamp < 300000 // Last 5 minutes
    );

    let suspiciousScore = 0;
    for (const e of recentEvents) {
      switch (e.type) {
        case 'rate_limit_violation':
          suspiciousScore += 0.3;
          break;
        case 'validation_failure':
          suspiciousScore += 0.2;
          break;
        case 'suspicious_request':
          suspiciousScore += 0.5;
          break;
        case 'auth_failure':
          suspiciousScore += 0.4;
          break;
        case 'potential_attack':
          suspiciousScore += 1.0;
          break;
      }
    }

    behavior.suspiciousScore = Math.min(suspiciousScore, 1.0);
    behavior.lastUpdated = Date.now();

    // Clean up old events
    behavior.events = behavior.events.filter(e => 
      Date.now() - e.timestamp < 3600000 // Keep last hour
    );
  }

  /**
   * Check if IP should be marked as suspicious
   */
  checkSuspiciousIP(ip) {
    // Count rate limit violations for this IP
    const violations = this.securityMonitor.getSecurityStats().topSources
      .filter(source => source.source.ip === ip)
      .reduce((sum, source) => sum + source.count, 0);

    if (violations > 10) {
      this.suspiciousIPs.add(ip);
      logger.warn('IP marked as suspicious due to repeated violations', { ip, violations });
    }
  }

  /**
   * Adjust rate limits based on security context
   */
  adjustRateLimits(event) {
    const { eventType, threatLevel } = event;
    
    // Reduce limits for high-threat events
    if (threatLevel === this.securityMonitor.threatLevels.HIGH) {
      this.reduceLimitsByFactor(0.5); // Reduce by 50%
    } else if (threatLevel === this.securityMonitor.threatLevels.CRITICAL) {
      this.reduceLimitsByFactor(0.2); // Reduce by 80%
    }
  }

  /**
   * Temporarily reduce rate limits
   */
  temporarilyReduceLimits(eventType) {
    const reductionFactor = 0.7; // Reduce by 30%
    
    // Store original limits
    if (!this.originalLimits) {
      this.originalLimits = {
        global: this.globalLimiter.max,
        api: this.apiLimiter.max,
        auth: this.authLimiter.max,
        upload: this.uploadLimiter.max
      };
    }

    // Apply reduction
    this.globalLimiter.max = Math.floor(this.originalLimits.global * reductionFactor);
    this.apiLimiter.max = Math.floor(this.originalLimits.api * reductionFactor);
    this.authLimiter.max = Math.floor(this.originalLimits.auth * reductionFactor);
    this.uploadLimiter.max = Math.floor(this.originalLimits.upload * reductionFactor);

    // Restore after 5 minutes
    setTimeout(() => this.restoreOriginalLimits(), 300000);
  }

  /**
   * Restore original rate limits
   */
  restoreOriginalLimits() {
    if (this.originalLimits) {
      this.globalLimiter.max = this.originalLimits.global;
      this.apiLimiter.max = this.originalLimits.api;
      this.authLimiter.max = this.originalLimits.auth;
      this.uploadLimiter.max = this.originalLimits.upload;
      
      logger.info('Original rate limits restored');
    }
  }

  /**
   * Set emergency mode
   */
  setEmergencyMode() {
    logger.warn('Setting emergency mode - severely restricting rate limits');
    
    this.globalLimiter.max = 10;
    this.apiLimiter.max = 5;
    this.authLimiter.max = 1;
    this.uploadLimiter.max = 1;
  }

  /**
   * Set high alert mode
   */
  setHighAlertMode() {
    logger.warn('Setting high alert mode - reducing rate limits');
    
    this.globalLimiter.max = 50;
    this.apiLimiter.max = 25;
    this.authLimiter.max = 2;
    this.uploadLimiter.max = 3;
  }

  /**
   * Set normal mode
   */
  setNormalMode() {
    logger.info('Setting normal mode - restoring standard rate limits');
    
    this.globalLimiter.max = 1000;
    this.apiLimiter.max = 100;
    this.authLimiter.max = 5;
    this.uploadLimiter.max = 10;
  }

  /**
   * Block IP address
   */
  blockIP(ip) {
    // Store blocked IP in Redis for persistence
    this.redis.setex(`blocked_ip:${ip}`, 3600, Date.now().toString()); // Block for 1 hour
    
    logger.warn('IP address blocked', { ip, duration: '1 hour' });
  }

  /**
   * Check if IP is blocked
   */
  async isIPBlocked(ip) {
    const blocked = await this.redis.get(`blocked_ip:${ip}`);
    return !!blocked;
  }

  /**
   * Unblock IP address
   */
  async unblockIP(ip) {
    await this.redis.del(`blocked_ip:${ip}`);
    logger.info('IP address unblocked', { ip });
  }

  /**
   * Notify administrators
   */
  notifyAdministrators(attack) {
    // In production, this would send alerts via email, Slack, etc.
    logger.error('ADMIN ALERT: Attack detected', {
      attackType: attack.attackType,
      source: attack.source,
      timestamp: new Date().toISOString(),
      action: 'Immediate response required'
    });
  }

  /**
   * Get rate limit message
   */
  getRateLimitMessage(limiterType) {
    const messages = {
      global: 'Too many requests from this IP, please try again later.',
      authentication: 'Too many authentication attempts, please try again later.',
      api: 'API rate limit exceeded, please try again later.',
      file_upload: 'File upload limit exceeded, please try again later.',
      dynamic: 'Rate limit exceeded due to security concerns, please try again later.'
    };
    
    return messages[limiterType] || messages.global;
  }

  /**
   * Get rate limiters for use in routes
   */
  getLimiters() {
    return {
      global: this.globalLimiter,
      auth: this.authLimiter,
      api: this.apiLimiter,
      upload: this.uploadLimiter,
      dynamic: this.dynamicLimiter
    };
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    return {
      suspiciousIPs: Array.from(this.suspiciousIPs),
      userBehavior: Object.fromEntries(this.userBehavior),
      rateLimits: {
        global: this.globalLimiter.max,
        api: this.apiLimiter.max,
        auth: this.authLimiter.max,
        upload: this.uploadLimiter.max
      }
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.redis.disconnect();
    this.securityMonitor.removeAllListeners();
  }
}

module.exports = EnhancedRateLimiter; 