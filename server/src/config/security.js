const crypto = require('crypto');

// Security configuration
const securityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
    refreshSecret: process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex'),
    accessExpiration: process.env.JWT_EXPIRES_IN || '30m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    resetExpiration: process.env.JWT_RESET_EXPIRES_IN || '1h',
    verificationExpiration: process.env.JWT_VERIFICATION_EXPIRES_IN || '10m',
    issuer: process.env.JWT_ISSUER || 'vocalink',
    audience: process.env.JWT_AUDIENCE || 'vocalink-users',
    bindToDevice: process.env.JWT_BIND_TO_DEVICE === 'true',
    bindToIP: process.env.JWT_BIND_TO_IP === 'true',
    enableRotation: process.env.JWT_ENABLE_ROTATION === 'true',
    rotationThreshold: parseInt(process.env.JWT_ROTATION_THRESHOLD) || 300,
  },

  // Password Configuration
  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 12,
    maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH) || 128,
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
    requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS === 'true',
    preventCommon: process.env.PASSWORD_PREVENT_COMMON === 'true',
    preventSequential: process.env.PASSWORD_PREVENT_SEQUENTIAL === 'true',
    historySize: parseInt(process.env.PASSWORD_HISTORY_SIZE) || 5,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },

  // Rate Limiting Configuration
  rateLimiting: {
    auth: {
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
    },
    sensitive: {
      windowMs: parseInt(process.env.SENSITIVE_RATE_LIMIT_WINDOW_MS) || 3600000,
      max: parseInt(process.env.SENSITIVE_RATE_LIMIT_MAX) || 10,
    },
    general: {
      windowMs: parseInt(process.env.GENERAL_RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.GENERAL_RATE_LIMIT_MAX) || 100,
    },
    api: {
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.API_RATE_LIMIT_MAX) || 200,
    },
    tiers: {
      admin: parseInt(process.env.ADMIN_RATE_LIMIT_MAX) || 500,
      writer: parseInt(process.env.WRITER_RATE_LIMIT_MAX) || 200,
      reader: parseInt(process.env.READER_RATE_LIMIT_MAX) || 100,
      anonymous: parseInt(process.env.ANONYMOUS_RATE_LIMIT_MAX) || 50,
    },
  },

  // Account Security Configuration
  account: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 10,
    lockoutDuration15Min: parseInt(process.env.LOCKOUT_DURATION_15MIN) || 900000,
    lockoutDuration1Hour: parseInt(process.env.LOCKOUT_DURATION_1HOUR) || 3600000,
    lockoutDuration24Hours: parseInt(process.env.LOCKOUT_DURATION_24HOURS) || 86400000,
    verificationCodeExpiry: parseInt(process.env.VERIFICATION_CODE_EXPIRY) || 600000,
    passwordResetExpiry: parseInt(process.env.PASSWORD_RESET_EXPIRY) || 3600000,
    enable2FA: process.env.ENABLE_2FA === 'true',
    enableDeviceFingerprinting: process.env.ENABLE_DEVICE_FINGERPRINTING === 'true',
    enableAccountLockout: process.env.ENABLE_ACCOUNT_LOCKOUT === 'true',
    enablePasswordHistory: process.env.ENABLE_PASSWORD_HISTORY === 'true',
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    cookieSecure: process.env.SESSION_COOKIE_SECURE === 'true',
    cookieHttpOnly: process.env.SESSION_COOKIE_HTTPONLY !== 'false',
    cookieSameSite: process.env.SESSION_COOKIE_SAMESITE || 'strict',
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000,
    resave: process.env.SESSION_RESAVE !== 'false',
    saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED !== 'false',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token',
      'X-Session-Token',
      'X-Device-Fingerprint',
      'X-Correlation-ID',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400,
  },

  // Security Headers Configuration
  headers: {
    enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS !== 'false',
    enableCSP: process.env.ENABLE_CSP !== 'false',
    enableHSTS: process.env.ENABLE_HSTS !== 'false',
    enableXSSProtection: process.env.ENABLE_XSS_PROTECTION !== 'false',
    enableContentTypeNoSniff: process.env.ENABLE_CONTENT_TYPE_NOSNIFF !== 'false',
    enableFrameDeny: process.env.ENABLE_FRAME_DENY !== 'false',
  },

  // File Upload Configuration
  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES ? process.env.ALLOWED_FILE_TYPES.split(',') : ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    uploadPath: process.env.UPLOAD_PATH || 'uploads',
    enableFileScanning: process.env.ENABLE_FILE_SCANNING === 'true',
    enableFileValidation: process.env.ENABLE_FILE_VALIDATION !== 'false',
    maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST) || 5,
  },

  // CAPTCHA Configuration
  captcha: {
    enable: process.env.ENABLE_CAPTCHA === 'true',
    siteKey: process.env.CAPTCHA_SITE_KEY,
    secretKey: process.env.CAPTCHA_SECRET_KEY,
    threshold: parseInt(process.env.CAPTCHA_THRESHOLD) || 3,
  },

  // Fraud Detection Configuration
  fraudDetection: {
    enable: process.env.ENABLE_FRAUD_DETECTION !== 'false',
    riskThresholds: {
      low: parseFloat(process.env.FRAUD_RISK_THRESHOLD_LOW) || 0.3,
      medium: parseFloat(process.env.FRAUD_RISK_THRESHOLD_MEDIUM) || 0.6,
      high: parseFloat(process.env.FRAUD_RISK_THRESHOLD_HIGH) || 0.8,
      critical: parseFloat(process.env.FRAUD_RISK_THRESHOLD_CRITICAL) || 0.9,
    },
  },

  // Database Security Configuration
  database: {
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 10,
    minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE) || 2,
    maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME_MS) || 30000,
    serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 5000,
    socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
    enableQuerySanitization: true,
    enableInjectionProtection: true,
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
    maxClients: parseInt(process.env.REDIS_MAX_CLIENTS) || 20,
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY) || 1000,
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
    enableCaching: process.env.ENABLE_CACHING === 'true',
    cacheTTL: parseInt(process.env.CACHE_TTL) || 300,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    enableStructuredLogging: process.env.ENABLE_STRUCTURED_LOGGING !== 'false',
  },

  // Monitoring Configuration
  monitoring: {
    enable: process.env.ENABLE_MONITORING !== 'false',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    sentryDSN: process.env.SENTRY_DSN,
    enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
  },

  // Production Configuration
  production: {
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    enableCDN: process.env.ENABLE_CDN === 'true',
    cdnUrl: process.env.CDN_URL,
    enableSSLRedirect: process.env.ENABLE_SSL_REDIRECT === 'true',
    sslRedirectStatus: parseInt(process.env.SSL_REDIRECT_STATUS) || 301,
    enableHTTPS: process.env.ENABLE_HTTPS === 'true',
    forceHTTPS: process.env.FORCE_HTTPS === 'true',
  },

  // Development Configuration
  development: {
    enableDebugMode: process.env.ENABLE_DEBUG_MODE === 'true',
    enableTestMode: process.env.ENABLE_TEST_MODE === 'true',
    autoVerifyUsers: process.env.AUTO_VERIFY_USERS === 'true',
    enableMockServices: process.env.ENABLE_MOCK_SERVICES === 'true',
  },

  // Backup Configuration
  backup: {
    enable: process.env.ENABLE_AUTO_BACKUP === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    path: process.env.BACKUP_PATH || './backups',
  },
};

// Security validation function
const validateSecurityConfig = () => {
  const errors = [];

  // Validate JWT secrets
  if (securityConfig.jwt.secret === 'your-256-bit-cryptographically-secure-secret-here-change-this') {
    errors.push('JWT_SECRET must be changed from default value');
  }

  if (securityConfig.jwt.refreshSecret === 'your-256-bit-cryptographically-secure-refresh-secret-here-change-this') {
    errors.push('JWT_REFRESH_SECRET must be changed from default value');
  }

  // Validate session secret
  if (securityConfig.session.secret === 'your-session-secret-change-this-in-production') {
    errors.push('SESSION_SECRET must be changed from default value');
  }

  // Validate password requirements
  if (securityConfig.password.minLength < 8) {
    errors.push('PASSWORD_MIN_LENGTH should be at least 8 characters');
  }

  // Validate rate limiting
  if (securityConfig.rateLimiting.auth.max < 1) {
    errors.push('AUTH_RATE_LIMIT_MAX should be at least 1');
  }

  // Validate file upload
  if (securityConfig.fileUpload.maxFileSize > 50 * 1024 * 1024) {
    errors.push('MAX_FILE_SIZE should not exceed 50MB');
  }

  return errors;
};

// Get security recommendations
const getSecurityRecommendations = () => {
  const recommendations = [];

  if (process.env.NODE_ENV === 'production') {
    if (!securityConfig.production.enableHTTPS) {
      recommendations.push('Enable HTTPS in production');
    }

    if (!securityConfig.production.forceHTTPS) {
      recommendations.push('Force HTTPS redirects in production');
    }

    if (!securityConfig.session.cookieSecure) {
      recommendations.push('Enable secure cookies in production');
    }

    if (!securityConfig.headers.enableHSTS) {
      recommendations.push('Enable HSTS in production');
    }
  }

  if (!securityConfig.account.enable2FA) {
    recommendations.push('Consider enabling 2FA for enhanced security');
  }

  if (!securityConfig.fraudDetection.enable) {
    recommendations.push('Consider enabling fraud detection');
  }

  if (!securityConfig.fileUpload.enableFileScanning) {
    recommendations.push('Consider enabling file scanning for uploads');
  }

  return recommendations;
};

// Generate secure random secrets
const generateSecureSecrets = () => {
  return {
    jwtSecret: crypto.randomBytes(32).toString('hex'),
    jwtRefreshSecret: crypto.randomBytes(32).toString('hex'),
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    cookieSecret: crypto.randomBytes(32).toString('hex'),
  };
};

module.exports = {
  securityConfig,
  validateSecurityConfig,
  getSecurityRecommendations,
  generateSecureSecrets,
}; 