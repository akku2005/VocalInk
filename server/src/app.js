const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('../swagger.json');

const { connectDB } = require('./config/connectDB');
const { apiLimiter } = require('./middleware/rateLimiter');
const apiRouter = require('./routes');
const { cleanupExpiredBlacklistedTokens } = require('./utils/cleanupTokens');

// Optional: Use logger if available
let logger = console;
try {
  logger = require('./utils/logger');
} catch (e) {}

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB()
  .then(() => {
    logger.success('Application initialized successfully');
    
    // Schedule cleanup of expired blacklisted tokens (run daily at 2 AM)
    setInterval(async () => {
      try {
        await cleanupExpiredBlacklistedTokens();
      } catch (error) {
        logger.error('Scheduled token cleanup failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    // Run initial cleanup
    cleanupExpiredBlacklistedTokens().catch(error => {
      logger.error('Initial token cleanup failed:', error);
    });
  })
  .catch((err) => {
    logger.error('Failed to initialize application:', err.message);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Custom morgan format with colors
morgan.token('status-color', (req, res) => {
  const status = res.statusCode;
  const color =
    status >= 500 ? 31 : status >= 400 ? 33 : status >= 300 ? 36 : 32;
  return `\x1b[${color}m${status}\x1b[0m`;
});

app.use(
  morgan(':method :url :status-color :res[content-length] - :response-time ms')
);

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  next();
});

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
logger.info('Swagger documentation available at /api-docs');

// API routes
app.use('/api', apiLimiter);
app.use('/api', apiRouter);
logger.info('API routes mounted at /api');

module.exports = app;
