const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const compression = require('compression');
const Sentry = require('@sentry/node');
const path = require('path');
const TTSService = require('./services/TTSService');
// Removed express-mongo-sanitize due to Express 5 compatibility issues

const swaggerDocument = require('../swagger.json');

const { connectDB, checkDatabaseHealth, getDatabaseStats } = require('./config/connectDB');
const {
  apiLimiter,
  burstRateLimiter,
  sensitiveOperationLimiter
} = require('./middleware/rateLimiter');
const {
  securityHeaders,
  generalRateLimit,
  speedLimiter,
  sanitizeRequest,
  securityMonitor,
  deviceFingerprint,
  requestLogger,
  errorHandler,
  notFoundHandler,
} = require('./middleware/security');
const { setupErrorHandlers } = require('./middleware/errorHandler');
const apiRouter = require('./routes');
const securityRouter = require('./routes/security');
const sitemapRouter = require('./routes/sitemap.routes');
const { cleanupExpiredBlacklistedTokens } = require('./utils/cleanupTokens');

// Optional: Use logger if available
let logger = console;
try {
  logger = require('./utils/logger');
} catch (e) { }

// Production-safe logging
let productionLogging = null;
try {
  productionLogging = require('./config/logging');
} catch (e) { }

dotenv.config();

const app = express();

app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Trust proxy for correct client IPs behind reverse proxies (e.g., Nginx, Cloudflare)
app.set('trust proxy', 1);

// Sentry initialization (production only)
if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.2 });
  app.use(Sentry.Handlers.requestHandler());
}

// Setup global error handlers
setupErrorHandlers();

// Connect to MongoDB (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then((conn) => {
      if (conn) {
        logger.success('Application initialized successfully');
      } else {
        logger.warn('Database not connected; running in degraded mode without DB');
      }

      if (conn && process.env.ENABLE_IN_PROCESS_JOBS === 'true') {
        // Schedule cleanup of expired blacklisted tokens (run daily at 2 AM)
        setInterval(async () => {
          try {
            const deletedCount = await cleanupExpiredBlacklistedTokens();
            if (deletedCount > 0) {
              logger.production.info(`Cleaned up ${deletedCount} expired blacklisted tokens`);
            }
          } catch (error) {
            logger.error('Scheduled token cleanup failed:', { message: error.message, name: error.name, code: error.code });
          }
        }, 24 * 60 * 60 * 1000); // 24 hours

        // Run initial cleanup
        cleanupExpiredBlacklistedTokens().catch(error => {
          logger.error('Initial token cleanup failed:', { message: error.message, name: error.name, code: error.code });
        });

        // Schedule cleanup of generated TTS/audio files
        if (process.env.ENABLE_TTS_CLEANUP === 'true') {
          const ttsService = new TTSService();
          const retentionHours = parseInt(process.env.TTS_FILE_RETENTION_HOURS || '24', 10);
          const retentionMs = retentionHours * 60 * 60 * 1000;

          // Daily cleanup
          setInterval(async () => {
            try {
              await ttsService.cleanupOldFiles(retentionMs);
            } catch (error) {
              logger.error('Scheduled TTS cleanup failed:', { message: error.message, name: error.name, code: error.code });
            }
          }, 24 * 60 * 60 * 1000);

          // Initial cleanup on startup
          ttsService.cleanupOldFiles(retentionMs).catch(error => {
            logger.error('Initial TTS cleanup failed:', { message: error.message, name: error.name, code: error.code });
          });
        }
      }
    })
    .catch((err) => {
      logger.error('Failed to initialize application:', err.message);
      // In development, keep the server running even if DB initialization fails
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });
} else {
  logger.info('Test environment - skipping database connection');
}

// Enhanced CORS configuration
const corsOptions = {
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
  maxAge: 86400, // 24 hours
};

// Apply security middleware first
app.use(securityHeaders);
app.use(cors(corsOptions));

// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

// Enable compression for better performance
if (process.env.ENABLE_COMPRESSION === 'true') {
  app.use(compression());
}

// Body parsing middleware with enhanced limits
app.use(express.json({
  limit: process.env.MAX_REQUEST_SIZE || '10mb',
  verify: (req, res, buf) => {
    // Store raw body for signature verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: process.env.MAX_REQUEST_SIZE || '10mb'
}));

// Enhanced mongo sanitize middleware for Express 5 compatibility
const { sanitizeMongoQuery } = require('./utils/sanitize');

const mongoSanitizeMiddleware = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;

  const sanitized = Array.isArray(obj) ? [] : {};

  // Comprehensive list of dangerous MongoDB operators
  const dangerousOperators = [
    '$where', '$regex', '$ne', '$gt', '$lt', '$gte', '$lte',
    '$in', '$nin', '$exists', '$type', '$mod', '$all',
    '$elemMatch', '$size', '$or', '$and', '$not', '$nor',
    '$text', '$search', '$language', '$caseSensitive', '$diacriticSensitive',
    '$expr', '$jsonSchema', '$geoIntersects', '$geoWithin', '$near', '$nearSphere'
  ];

  for (const [key, value] of Object.entries(obj)) {
    // Block dangerous operators entirely
    if (dangerousOperators.includes(key) || key.startsWith('$')) {
      logger.warn(`MongoDB injection attempt blocked: key "${key}"`, {
        originalValue: value,
        timestamp: new Date().toISOString(),
        blocked: true
      });
      // Skip dangerous keys entirely instead of prefixing
      continue;
    }

    // Recursively sanitize nested objects and arrays
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'object' ? mongoSanitizeMiddleware(item) : item
        );
      } else {
        sanitized[key] = mongoSanitizeMiddleware(value);
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Apply enhanced sanitization to query, body, and params
app.use((req, res, next) => {
  try {
    if (req.query && Object.keys(req.query).length > 0) {
      req.query = mongoSanitizeMiddleware(req.query);
    }
    if (req.body && typeof req.body === 'object' && req.body !== null) {
      req.body = mongoSanitizeMiddleware(req.body);
    }
    if (req.params && Object.keys(req.params).length > 0) {
      req.params = mongoSanitizeMiddleware(req.params);
    }
    next();
  } catch (error) {
    logger.error('Error in MongoDB sanitization middleware:', error);
    next(error);
  }
});

// Security monitoring and request sanitization
app.use(securityMonitor);
app.use(sanitizeRequest);
app.use(deviceFingerprint);

// Global rate limiting and speed limiting
app.use(generalRateLimit);
app.use(speedLimiter);

// Apply API-specific rate limiting (only one per route to avoid conflicts)
// app.use('/api/auth', sensitiveOperationLimiter);
// app.use('/api/users', sensitiveOperationLimiter);

// Custom logging tokens and format
morgan.token('status-color', (req, res) => {
  const status = res.statusCode;
  const color =
    status >= 500 ? 31 : status >= 400 ? 33 : status >= 300 ? 36 : 32;
  return `\x1b[${color}m${status}\x1b[0m`;
});

morgan.token('security-info', (req) => {
  const suspicious = req.headers['user-agent']?.includes('bot') ? ' [BOT]' : '';
  const fingerprint = req.deviceFingerprint ? ' [FP]' : '';
  const userId = req.user?.id ? ` [USER:${req.user.id}]` : '';
  return suspicious + fingerprint + userId;
});

morgan.token('response-time-ms', (req, res) => {
  const time = res.getHeader('X-Response-Time');
  return time ? `${time}ms` : '';
});

// Enhanced logging format
app.use(
  morgan(':method :url :status-color :res[content-length] - :response-time-ms:security-info', {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      }
    }
  })
);

// Request logging
app.use(requestLogger);

// Health check endpoint with comprehensive checks
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
    checks: {
      database: 'healthy',
      redis: 'healthy',
      externalServices: 'healthy'
    },
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    }
  };

  // Check database connection
  try {
    const dbHealth = await checkDatabaseHealth();
    health.checks.database = dbHealth.status;
    if (dbHealth.status === 'unhealthy') {
      health.status = 'unhealthy';
    }
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'unhealthy';
    logger.error('Database health check failed:', error);
  }

  // Check Redis connection if enabled
  try {
    const cacheService = require('./services/CacheService');
    const cacheHealth = await cacheService.healthCheck();
    health.checks.redis = cacheHealth.status;
    health.cache = {
      type: cacheHealth.type,
      connection: cacheHealth.connection || 'unknown',
      stats: cacheService.getStats()
    };

    if (cacheHealth.status === 'unhealthy' && process.env.ENABLE_CACHING === 'true') {
      health.status = 'degraded'; // Don't mark as unhealthy since memory fallback works
    }
  } catch (error) {
    health.checks.redis = 'unknown';
    health.cache = { error: error.message };
    logger.warn('Cache health check failed:', error.message);
  }

  res.json(health);
});

// Serve generated audio (TTS and other audio) with cache and range support
const staticCacheMaxAge = process.env.STATIC_MAX_AGE || '1d';
const audioStaticOptions = {
  maxAge: staticCacheMaxAge,
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.mp3') res.setHeader('Content-Type', 'audio/mpeg');
    if (ext === '.wav') res.setHeader('Content-Type', 'audio/wav');
    if (ext === '.ogg') res.setHeader('Content-Type', 'audio/ogg');
    if (ext === '.m4a') res.setHeader('Content-Type', 'audio/mp4');
    if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }
};
app.use('/tts', express.static(path.join(__dirname, '../public/tts'), audioStaticOptions));
app.use('/audio', express.static(path.join(__dirname, '../public/audio'), audioStaticOptions));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), { maxAge: staticCacheMaxAge }));
// Backward compatibility: also expose uploads under /api/uploads
app.use('/api/uploads', express.static(path.join(__dirname, '../public/uploads'), { maxAge: staticCacheMaxAge }));

// Swagger setup (disable in production)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// Sitemap and robots.txt (must be before API routes)
app.use('/', sitemapRouter);

// API routes
app.use('/api', apiRouter);

// Security monitoring routes (admin only)
app.use('/api/security', securityRouter);

// Not found and error handlers
app.use(notFoundHandler);
// Sentry error handler (must be before any other error handler if used)
if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
  app.use(Sentry.Handlers.errorHandler());
}
app.use(errorHandler);

module.exports = app;
