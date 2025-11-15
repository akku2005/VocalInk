const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

// Custom IP key generator function
const ipKeyGenerator = (req) => {
  // Get the real IP address considering proxies
  const ip = req.ip || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress || 
             req.connection?.socket?.remoteAddress || 
             'unknown';
  return ip;
};

// Enhanced security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      manifestSrc: ["'self'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

// Enhanced rate limiting for different endpoints
const createRateLimit = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100,
    message: {
      success: false,
      message: options.message || 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use IP + user agent + user ID for better rate limiting
      const userKey = req.user ? req.user.id : 'anonymous';
      return `${ipKeyGenerator(req)}-${req.headers['user-agent'] || 'unknown'}-${userKey}`;
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id || 'anonymous',
        url: req.originalUrl,
        method: req.method,
        rateLimitInfo: req.rateLimit,
      });
      res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000),
        requiresCaptcha: req.rateLimit.current >= 3,
      });
    },
  });
};

// Tier-based rate limiting
const tierRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    const user = req.user;
    if (!user) return parseInt(process.env.ANONYMOUS_RATE_LIMIT_MAX) || 50;
    
    switch (user.role) {
      case 'admin': return parseInt(process.env.ADMIN_RATE_LIMIT_MAX) || 500;
      case 'writer': return parseInt(process.env.WRITER_RATE_LIMIT_MAX) || 200;
      case 'reader': return parseInt(process.env.READER_RATE_LIMIT_MAX) || 100;
      default: return parseInt(process.env.ANONYMOUS_RATE_LIMIT_MAX) || 50;
    }
  },
  keyGenerator: (req) => (req.user ? req.user.id : ipKeyGenerator(req)),
  handler: (req, res) => {
    logger.warn('Tier rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
      role: req.user?.role || 'anonymous',
      url: req.originalUrl,
      method: req.method,
    });
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Rate limit exceeded for your tier. Please try again later.',
      retryAfter: Math.ceil(15 * 60 / 1000),
    });
  },
});

// Specific rate limiters for different endpoints
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
});

const sensitiveRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: 'Too many sensitive operations, please try again later.',
});

const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later.',
});

// Speed limiting for brute force protection
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes without delay
  // New behavior per express-slow-down v2 warning
  delayMs: () => 500,
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// Enhanced request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Enhanced XSS protection
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/vbscript:/gi, '')
          .replace(/data:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .replace(/expression\s*\(/gi, '')
          .replace(/url\s*\(/gi, '')
          .replace(/eval\s*\(/gi, '')
          .replace(/document\./gi, '')
          .replace(/window\./gi, '')
          .replace(/alert\s*\(/gi, '')
          .replace(/confirm\s*\(/gi, '')
          .replace(/prompt\s*\(/gi, '')
          .trim();
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/vbscript:/gi, '')
          .replace(/data:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .replace(/expression\s*\(/gi, '')
          .replace(/url\s*\(/gi, '')
          .replace(/eval\s*\(/gi, '')
          .replace(/document\./gi, '')
          .replace(/window\./gi, '')
          .replace(/alert\s*\(/gi, '')
          .replace(/confirm\s*\(/gi, '')
          .replace(/prompt\s*\(/gi, '')
          .trim();
      }
    });
  }

  // Sanitize URL parameters
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = req.params[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/vbscript:/gi, '')
          .replace(/data:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .replace(/expression\s*\(/gi, '')
          .replace(/url\s*\(/gi, '')
          .replace(/eval\s*\(/gi, '')
          .replace(/document\./gi, '')
          .replace(/window\./gi, '')
          .replace(/alert\s*\(/gi, '')
          .replace(/confirm\s*\(/gi, '')
          .replace(/prompt\s*\(/gi, '')
          .trim();
      }
    });
  }

  next();
};

// Enhanced security monitoring middleware
const securityMonitor = (req, res, next) => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
    /alert\s*\(/i,
    /confirm\s*\(/i,
    /prompt\s*\(/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /system\s*\(/i,
    /shell\s*\(/i,
    /cmd\s*\(/i,
    /powershell/i,
    /\.\.\/\.\./i, // Directory traversal
    /%2e%2e/i, // URL encoded directory traversal
    /\.\.%2f/i, // URL encoded directory traversal
    /%2e%2e%2f/i, // URL encoded directory traversal
  ];

  // Create a copy of request body for security scanning, excluding image data and HTML content
  const bodyForScanning = { ...req.body };
  
  // Remove base64 image data from security scanning to prevent false positives
  if (bodyForScanning.avatar && typeof bodyForScanning.avatar === 'string' && bodyForScanning.avatar.startsWith('data:image/')) {
    bodyForScanning.avatar = '[BASE64_IMAGE_DATA]';
  }
  if (bodyForScanning.coverImage && typeof bodyForScanning.coverImage === 'string' && bodyForScanning.coverImage.startsWith('data:image/')) {
    bodyForScanning.coverImage = '[BASE64_IMAGE_DATA]';
  }
  
  // Exclude blog content field from security scanning as it's expected to contain HTML
  // The content will be sanitized separately in the blog controller
  if (bodyForScanning.content && req.path.includes('/blog')) {
    bodyForScanning.content = '[HTML_CONTENT]';
  }
  if (bodyForScanning.summary && req.path.includes('/blog')) {
    bodyForScanning.summary = '[SUMMARY_CONTENT]';
  }
  
  // Exclude text field from TTS endpoints as it contains HTML content from rich text editor
  if (bodyForScanning.text && (req.path.includes('/tts') || req.path.includes('/ai/summary'))) {
    bodyForScanning.text = '[HTML_CONTENT]';
  }

  const requestString = JSON.stringify({
    body: bodyForScanning,
    query: req.query,
    params: req.params,
    // Temporarily exclude headers to avoid false positives
    // headers: req.headers,
  }).toLowerCase();

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      logger.warn('Suspicious request detected', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id || 'anonymous',
        url: req.originalUrl,
        method: req.method,
        pattern: pattern.source,
        requestData: {
          body: req.body,
          query: req.query,
          params: req.params,
        },
      });
      
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Suspicious request detected',
        code: 'SUSPICIOUS_REQUEST',
      });
    }
  }

  next();
};

// Enhanced device fingerprinting middleware
const deviceFingerprint = (req, res, next) => {
  const crypto = require('crypto');
  
  // IMPORTANT: Do NOT include timestamp in fingerprint - it changes on every request
  // and will cause token verification to fail after token refresh
  const fingerprint = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    acceptLanguage: req.headers['accept-language'],
    acceptEncoding: req.headers['accept-encoding'],
    // Add additional fingerprinting data (but not timestamp or referer which can vary)
    xForwardedFor: req.headers['x-forwarded-for'],
    xRealIp: req.headers['x-real-ip'],
    xForwardedProto: req.headers['x-forwarded-proto'],
    host: req.headers['host'],
    connection: req.headers['connection'],
  };

  // Create a hash of the fingerprint
  const fingerprintString = JSON.stringify(fingerprint);
  const fingerprintHash = require('crypto').createHash('sha256').update(fingerprintString).digest('hex');
  
  req.deviceFingerprint = fingerprintHash;
  req.deviceFingerprintData = fingerprint;
  
  next();
};

// Enhanced request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'anonymous',
      contentLength: res.get('content-length'),
      deviceFingerprint: req.deviceFingerprint,
      timestamp: new Date().toISOString(),
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

// Enhanced error handling middleware
const errorHandler = (err, req, res, next) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      code: err.code,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'anonymous',
    },
    context: {
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION,
    },
  };

  logger.error('Unhandled error:', errorLog);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
  });
};

// Not found handler
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
  });
  
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
  });
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for API endpoints that don't need it
  if (req.path.startsWith('/api/') && req.method === 'GET') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.headers['x-session-token'];

  // For API endpoints, we'll use a simpler token-based approach
  if (req.path.startsWith('/api/')) {
    // Validate API key or session token if present
    if (sessionToken) {
      // Validate session token here
      // This is a simplified version - implement proper session validation
      return next();
    }
  }

  next();
};

module.exports = {
  securityHeaders,
  authRateLimit,
  sensitiveRateLimit,
  generalRateLimit,
  tierRateLimiter,
  speedLimiter,
  csrfProtection,
  sanitizeRequest,
  securityMonitor,
  deviceFingerprint,
  requestLogger,
  errorHandler,
  notFoundHandler,
}; 