const crypto = require('crypto');
const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

class EnhancedSecurityMiddleware {
  constructor() {
    this.suspiciousPatterns = this.initializeSuspiciousPatterns();
    this.rateLimitStore = new Map();
    this.securityEvents = [];
    this.maxSecurityEvents = 1000;
  }

  /**
   * Initialize suspicious patterns for security monitoring
   */
  initializeSuspiciousPatterns() {
    return {
      // SQL Injection patterns
      sqlInjection: [
        /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b)/i,
        /(\b(union\s+select|select\s+from|insert\s+into|update\s+set|delete\s+from)\b)/i,
        /(\b(drop\s+table|create\s+table|alter\s+table)\b)/i,
        /(\b(exec\s*\(|execute\s*\(|script\s*\(|eval\s*\()/i,
        /(\b(xp_cmdshell|sp_executesql|sp_configure)\b)/i,
        /(\b(declare\s+@|set\s+@|print\s+@)\b)/i,
        /(\b(cast\s*\(|convert\s*\(|char\s*\()/i,
        /(\b(ascii\s*\(|substring\s*\(|len\s*\()/i
      ],

      // XSS patterns
      xss: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /data:/gi,
        /on\w+\s*=/gi,
        /expression\s*\(/gi,
        /url\s*\(/gi,
        /eval\s*\(/gi,
        /document\./gi,
        /window\./gi,
        /alert\s*\(/gi,
        /confirm\s*\(/gi,
        /prompt\s*\(/gi,
        /<iframe\b[^>]*>/gi,
        /<object\b[^>]*>/gi,
        /<embed\b[^>]*>/gi,
        /<form\b[^>]*>/gi,
        /<input\b[^>]*>/gi,
        /<textarea\b[^>]*>/gi,
        /<select\b[^>]*>/gi,
        /<button\b[^>]*>/gi,
        /<link\b[^>]*>/gi,
        /<meta\b[^>]*>/gi,
        /<style\b[^>]*>/gi,
        /<base\b[^>]*>/gi,
        /<applet\b[^>]*>/gi,
        /<bgsound\b[^>]*>/gi,
        /<layer\b[^>]*>/gi,
        /<ilayer\b[^>]*>/gi,
        /<blink\b[^>]*>/gi,
        /<marquee\b[^>]*>/gi
      ],

      // Command injection patterns
      commandInjection: [
        /(\b(cmd|command|powershell|bash|sh|zsh|fish|tcsh|ksh)\b)/i,
        /(\b(system|exec|popen|shell_exec|passthru|proc_open)\b)/i,
        /(\b(backtick|`.*`)/i,
        /(\b(pipe|pipeline|redirect|>|<|\||&)\b)/i,
        /(\b(rm|del|erase|format|fdisk|mkfs|dd)\b)/i,
        /(\b(net|netstat|netcat|nc|telnet|ftp|ssh|scp)\b)/i,
        /(\b(wget|curl|lynx|links|elinks|w3m)\b)/i,
        /(\b(ping|traceroute|tracert|nslookup|dig|host)\b)/i
      ],

      // Path traversal patterns
      pathTraversal: [
        /\.\.\/\.\./i,
        /\.\.\\\.\./i,
        /%2e%2e/i,
        /%2e%2e%2f/i,
        /%2e%2e%5c/i,
        /\.\.%2f/i,
        /\.\.%5c/i,
        /\.\.%255c/i,
        /\.\.%252f/i,
        /\.\.%c0%af/i,
        /\.\.%c1%9c/i,
        /\.\.%c0%9v/i,
        /\.\.%c0%qf/i,
        /\.\.%c1%8s/i,
        /\.\.%c0%80%af/i,
        /\.\.%c0%80%5c/i,
        /\.\.%c0%af%c0%80/i,
        /\.\.%c0%5c%c0%80/i
      ],

      // LDAP injection patterns
      ldapInjection: [
        /(\b(ldap|ldaps)\b)/i,
        /(\b(bind|search|add|modify|delete|modrdn|extended)\b)/i,
        /(\b(cn|ou|dc|uid|mail|sn|givenName)\b)/i,
        /(\b(|&!()*)\b)/i,
        /(\b(admin|root|user|group|role)\b)/i
      ],

      // NoSQL injection patterns
      noSqlInjection: [
        /(\b(\$where|\$ne|\$gt|\$gte|\$lt|\$lte|\$in|\$nin|\$exists|\$regex)\b)/i,
        /(\b(\$or|\$and|\$not|\$nor|\$all|\$elemMatch|\$size)\b)/i,
        /(\b(\$type|\$mod|\$text|\$search|\$geoWithin|\$near)\b)/i,
        /(\b(\$set|\$unset|\$inc|\$mul|\$rename|\$push|\$pull|\$addToSet)\b)/i,
        /(\b(\$pop|\$pullAll|\$bit|\$isolated|\$slice|\$sort|\$comment)\b)/i
      ],

      // Template injection patterns
      templateInjection: [
        /(\b({{|}}|{%.*%}|{%.*}|{%.*}|{%.*}|{%.*}|{%.*})\b)/i,
        /(\b(<%.*%>|<%.*|%>|<\?.*\?>|<\?.*|\?>)\b)/i,
        /(\b(\$\{.*\}|\$\{.*|\$\{.*\}|\$\{.*\})\b)/i,
        /(\b(process\.env|require|module|exports|__dirname|__filename)\b)/i,
        /(\b(global|Buffer|setTimeout|setInterval|setImmediate)\b)/i,
        /(\b(clearTimeout|clearInterval|clearImmediate|console|process)\b)/i
      ],

      // SSRF patterns
      ssrf: [
        /(\b(http|https|ftp|file|gopher|dict|ldap|tftp|mailto|news|nntp|telnet|gopher|wais|prospero|z39\.50|rsync|svn|git|ssh|scp|sftp)\b)/i,
        /(\b(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)\b)/i,
        /(\b(169\.254\.|224\.|240\.|255\.255\.255\.255)\b)/i,
        /(\b(0\.0\.0\.0|255\.255\.255\.255|127\.0\.0\.1|::1)\b)/i
      ],

      // Deserialization patterns
      deserialization: [
        /(\b(serialize|unserialize|serialize|deserialize)\b)/i,
        /(\b(JSON\.parse|JSON\.stringify|eval|Function|setTimeout|setInterval)\b)/i,
        /(\b(new\s+Function|new\s+RegExp|new\s+Date|new\s+Array)\b)/i,
        /(\b(parseInt|parseFloat|Number|String|Boolean|Array|Object)\b)/i
      ]
    };
  }

  /**
   * Enhanced security headers middleware
   */
  enhancedSecurityHeaders() {
    return (req, res, next) => {
      try {
        // Security Headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        
        // Content Security Policy
        const csp = this.generateCSP(req);
        res.setHeader('Content-Security-Policy', csp);
        
        // Remove server information
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
        
        next();
      } catch (error) {
        logger.error('Enhanced security headers error:', error);
        next();
      }
    };
  }

  /**
   * Generate Content Security Policy
   */
  generateCSP(req) {
    const baseCSP = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      'font-src': ["'self'", "https://fonts.gstatic.com"],
      'img-src': ["'self'", "data:", "https:"],
      'connect-src': ["'self'"],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    };

    // Add nonce for inline scripts if needed
    if (req.nonce) {
      baseCSP['script-src'].push(`'nonce-${req.nonce}'`);
    }

    return Object.entries(baseCSP)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');
  }

  /**
   * Advanced input sanitization middleware
   */
  advancedInputSanitization() {
    return (req, res, next) => {
      try {
        // Sanitize request body
        if (req.body) {
          req.body = this.sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query) {
          req.query = this.sanitizeObject(req.query);
        }

        // Sanitize URL parameters
        if (req.params) {
          req.params = this.sanitizeObject(req.params);
        }

        // Sanitize headers (excluding essential ones)
        if (req.headers) {
          const essentialHeaders = ['authorization', 'content-type', 'user-agent', 'accept', 'host'];
          Object.keys(req.headers).forEach(header => {
            if (!essentialHeaders.includes(header.toLowerCase())) {
              req.headers[header] = this.sanitizeString(req.headers[header]);
            }
          });
        }

        next();
      } catch (error) {
        logger.error('Advanced input sanitization error:', error);
        next();
      }
    };
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj) {
    if (obj === null || typeof obj !== 'object') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeObject(value);
    }

    return sanitized;
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input) {
    if (typeof input !== 'string') {
      return input;
    }

    let sanitized = input;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove control characters (except newline and tab)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // HTML entity encoding
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    // Remove dangerous patterns
    for (const [category, patterns] of Object.entries(this.suspiciousPatterns)) {
      for (const pattern of patterns) {
        sanitized = sanitized.replace(pattern, (match) => {
          this.logSecurityEvent('pattern_blocked', {
            category,
            pattern: pattern.source,
            match: match.substring(0, 100),
            severity: 'high'
          });
          return '[BLOCKED]';
        });
      }
    }

    return sanitized;
  }

  /**
   * Advanced security monitoring middleware
   */
  advancedSecurityMonitoring() {
    return (req, res, next) => {
      try {
        const securityScore = this.calculateSecurityScore(req);
        
        // Log security score
        if (securityScore < 70) {
          this.logSecurityEvent('low_security_score', {
            score: securityScore,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            url: req.originalUrl,
            method: req.method,
            severity: 'medium'
          });
        }

        // Check for suspicious patterns
        const suspiciousPatterns = this.detectSuspiciousPatterns(req);
        if (suspiciousPatterns.length > 0) {
          this.logSecurityEvent('suspicious_patterns_detected', {
            patterns: suspiciousPatterns,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            url: req.originalUrl,
            method: req.method,
            severity: 'high'
          });

          // Block request if too many suspicious patterns
          if (suspiciousPatterns.length > 5) {
            return res.status(StatusCodes.FORBIDDEN).json({
              success: false,
              message: 'Request blocked due to security concerns',
              code: 'SECURITY_BLOCK'
            });
          }
        }

        // Rate limiting for suspicious requests
        if (suspiciousPatterns.length > 0) {
          const isRateLimited = this.checkSuspiciousRateLimit(req.ip);
          if (isRateLimited) {
            return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
              success: false,
              message: 'Too many suspicious requests',
              code: 'SUSPICIOUS_RATE_LIMIT'
            });
          }
        }

        next();
      } catch (error) {
        logger.error('Advanced security monitoring error:', error);
        next();
      }
    };
  }

  /**
   * Calculate security score for request
   */
  calculateSecurityScore(req) {
    let score = 100;

    // Deduct points for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-forwarded-proto',
      'x-forwarded-host',
      'x-forwarded-port'
    ];

    suspiciousHeaders.forEach(header => {
      if (req.headers[header]) {
        score -= 5;
      }
    });

    // Deduct points for suspicious user agents
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.toLowerCase().includes('bot') || userAgent.toLowerCase().includes('crawler')) {
      score -= 10;
    }

    if (userAgent.length > 200) {
      score -= 15;
    }

    // Deduct points for suspicious IP patterns
    const ip = req.ip;
    if (ip && (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.'))) {
      score -= 5;
    }

    // Deduct points for suspicious request patterns
    if (req.originalUrl.includes('..') || req.originalUrl.includes('\\')) {
      score -= 20;
    }

    if (req.originalUrl.length > 1000) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * Detect suspicious patterns in request
   */
  detectSuspiciousPatterns(req) {
    const patterns = [];
    const requestData = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params,
      url: req.originalUrl,
      method: req.method
    }).toLowerCase();

    for (const [category, patternList] of Object.entries(this.suspiciousPatterns)) {
      for (const pattern of patternList) {
        if (pattern.test(requestData)) {
          patterns.push({
            category,
            pattern: pattern.source,
            severity: this.getPatternSeverity(category)
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Get pattern severity
   */
  getPatternSeverity(category) {
    const severityMap = {
      sqlInjection: 'critical',
      xss: 'high',
      commandInjection: 'critical',
      pathTraversal: 'high',
      ldapInjection: 'high',
      noSqlInjection: 'high',
      templateInjection: 'critical',
      ssrf: 'high',
      deserialization: 'critical'
    };

    return severityMap[category] || 'medium';
  }

  /**
   * Check suspicious rate limit
   */
  checkSuspiciousRateLimit(ip) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10;

    if (!this.rateLimitStore.has(ip)) {
      this.rateLimitStore.set(ip, []);
    }

    const requests = this.rateLimitStore.get(ip);
    
    // Remove old requests
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return true;
    }

    recentRequests.push(now);
    this.rateLimitStore.set(ip, recentRequests);

    return false;
  }

  /**
   * Log security event
   */
  logSecurityEvent(type, data) {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      ...data
    };

    this.securityEvents.push(event);

    // Keep only recent events
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents = this.securityEvents.slice(-this.maxSecurityEvents);
    }

    // Log to logger
    logger.warn('Security event detected', event);

    // Store in database if needed
    this.storeSecurityEvent(event);
  }

  /**
   * Store security event in database
   */
  async storeSecurityEvent(event) {
    try {
      // This would store the event in a security events collection
      // For now, we'll just log it
      if (process.env.ENABLE_SECURITY_LOGGING === 'true') {
        // Store in database logic here
        console.log('Security event stored:', event.type);
      }
    } catch (error) {
      logger.error('Failed to store security event:', error);
    }
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const stats = {
      totalEvents: this.securityEvents.length,
      eventsByType: {},
      eventsBySeverity: {},
      recentEvents: this.securityEvents.slice(-100),
      rateLimitStore: {
        size: this.rateLimitStore.size,
        entries: Array.from(this.rateLimitStore.entries()).slice(0, 10)
      }
    };

    // Count events by type
    this.securityEvents.forEach(event => {
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
      if (event.severity) {
        stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Clear old security events
   */
  clearOldEvents(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    this.securityEvents = this.securityEvents.filter(event => 
      now - new Date(event.timestamp).getTime() < maxAge
    );

    // Clear old rate limit entries
    for (const [ip, requests] of this.rateLimitStore.entries()) {
      const recentRequests = requests.filter(timestamp => now - timestamp < 60 * 1000);
      if (recentRequests.length === 0) {
        this.rateLimitStore.delete(ip);
      } else {
        this.rateLimitStore.set(ip, recentRequests);
      }
    }
  }

  /**
   * Generate nonce for CSP
   */
  generateNonce() {
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Nonce middleware
   */
  nonceMiddleware() {
    return (req, res, next) => {
      req.nonce = this.generateNonce();
      next();
    };
  }
}

// Create singleton instance
const enhancedSecurity = new EnhancedSecurityMiddleware();

// Export middleware functions
module.exports = {
  enhancedSecurityHeaders: enhancedSecurity.enhancedSecurityHeaders.bind(enhancedSecurity),
  advancedInputSanitization: enhancedSecurity.advancedInputSanitization.bind(enhancedSecurity),
  advancedSecurityMonitoring: enhancedSecurity.advancedSecurityMonitoring.bind(enhancedSecurity),
  nonceMiddleware: enhancedSecurity.nonceMiddleware.bind(enhancedSecurity),
  getSecurityStats: enhancedSecurity.getSecurityStats.bind(enhancedSecurity),
  clearOldEvents: enhancedSecurity.clearOldEvents.bind(enhancedSecurity)
}; 