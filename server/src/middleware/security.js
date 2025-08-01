const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Security Headers Middleware
 * Sets essential security headers to protect against common attacks
 */
const securityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-ancestors 'none';"
  );

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Type Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Frame Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Strict Transport Security
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
};

/**
 * CORS Configuration Middleware
 * Handles Cross-Origin Resource Sharing
 */
const corsConfig = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://yourdomain.com'
  ];

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-Request-ID'
  );
  res.setHeader(
    'Access-Control-Expose-Headers',
    'X-Total-Count, X-Request-ID, X-Rate-Limit-Remaining'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};

/**
 * Request ID Middleware
 * Adds unique request ID for tracking
 */
const requestId = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

/**
 * Request Logger Middleware
 * Logs incoming requests with detailed information
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  
  // Log response completion
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.headers['user-agent']
    });
  });
  
  next();
};

/**
 * Performance Monitor Middleware
 * Monitors request performance and logs slow requests
 */
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
        duration: `${duration.toFixed(2)}ms`,
        userId: req.user?.id,
        ip: req.ip
      });
    }
    
    // Log very slow requests (> 5 seconds)
    if (duration > 5000) {
      logger.error('Very slow request detected', {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
        duration: `${duration.toFixed(2)}ms`,
        userId: req.user?.id,
        ip: req.ip
      });
    }
  });
  
  next();
};

/**
 * IP Filtering Middleware
 * Blocks requests from blacklisted IPs
 */
const ipFilter = (req, res, next) => {
  const blacklistedIPs = process.env.BLACKLISTED_IPS?.split(',') || [];
  const clientIP = req.ip;
  
  if (blacklistedIPs.includes(clientIP)) {
    logger.warn('Request blocked from blacklisted IP', {
      ip: clientIP,
      path: req.path,
      method: req.method
    });
    
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  next();
};

/**
 * Request Size Limiter
 * Limits request body size to prevent abuse
 */
const requestSizeLimiter = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    logger.warn('Request size limit exceeded', {
      requestId: req.requestId,
      size: req.headers['content-length'],
      maxSize,
      path: req.path
    });
    
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    });
  }
  
  next();
};

/**
 * Method Filtering Middleware
 * Only allows specific HTTP methods
 */
const methodFilter = (allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) => {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      logger.warn('Method not allowed', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        allowedMethods
      });
      
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }
    
    next();
  };
};

/**
 * User Agent Filtering
 * Blocks requests with suspicious user agents
 */
const userAgentFilter = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /perl/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious && !req.user) {
    logger.warn('Suspicious user agent detected', {
      requestId: req.requestId,
      userAgent,
      path: req.path,
      ip: req.ip
    });
    
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  next();
};

/**
 * Rate Limiting Headers
 * Adds rate limiting information to response headers
 */
const rateLimitHeaders = (req, res, next) => {
  if (req.rateLimit) {
    res.setHeader('X-Rate-Limit-Limit', req.rateLimit.limit);
    res.setHeader('X-Rate-Limit-Remaining', req.rateLimit.remaining);
    res.setHeader('X-Rate-Limit-Reset', req.rateLimit.resetTime);
  }
  
  next();
};

/**
 * Security Context Middleware
 * Adds security context to request
 */
const securityContext = (req, res, next) => {
  req.securityContext = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    origin: req.headers.origin,
    timestamp: new Date(),
    requestId: req.requestId,
    userId: req.user?.id,
    userRole: req.user?.role
  };
  
  next();
};

/**
 * Comprehensive Security Middleware
 * Combines all security features
 */
const securityMiddleware = [
  requestId,
  securityHeaders,
  corsConfig,
  ipFilter,
  userAgentFilter,
  requestSizeLimiter,
  requestLogger,
  performanceMonitor,
  rateLimitHeaders,
  securityContext
];

module.exports = {
  securityHeaders,
  corsConfig,
  requestId,
  requestLogger,
  performanceMonitor,
  ipFilter,
  requestSizeLimiter,
  methodFilter,
  userAgentFilter,
  rateLimitHeaders,
  securityContext,
  securityMiddleware
}; 