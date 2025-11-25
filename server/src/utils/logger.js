const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const logFile = path.join(logDir, 'server.log');

// Sensitive fields that should never be logged
const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'key', 'auth', 'credential',
  'api_key', 'apikey', 'jwt_secret', 'jwt_refresh_secret',
  'database_url', 'redis_url', 'mongodb_uri', 'mongo_uri',
  'openai_api_key', 'elevenlabs_api_key', 'google_cloud_credentials'
];

// Sanitize sensitive data
const sanitizeData = (data) => {
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  return data;
};

function writeToFile(message) {
  // Remove ANSI color codes for file output
  const noColor = message.replace(/\x1b\[[0-9;]*m/g, '');
  fs.appendFileSync(logFile, noColor + '\n');
}

// Get current timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Format log message with colors
const formatMessage = (level, message, ...args) => {
  const timestamp = chalk.gray(`[${getTimestamp()}]`);
  const levelTag = getLevelTag(level);

  // Sanitize sensitive data in arguments
  const sanitizedArgs = args.map(arg => sanitizeData(arg));
  const formattedMessage = formatArgs(message, ...sanitizedArgs);

  return `${timestamp} ${levelTag} ${formattedMessage}`;
};

// Get colored level tag
const getLevelTag = (level) => {
  switch (level.toUpperCase()) {
    case 'INFO':
      return chalk.blue.bold('[INFO]');
    case 'WARN':
      return chalk.yellow.bold('[WARN]');
    case 'ERROR':
      return chalk.red.bold('[ERROR]');
    case 'DEBUG':
      return chalk.cyan.bold('[DEBUG]');
    case 'SUCCESS':
      return chalk.green.bold('[SUCCESS]');
    default:
      return chalk.gray.bold(`[${level.toUpperCase()}]`);
  }
};

// Format arguments with colors
const formatArgs = (message, ...args) => {
  let formatted = message;

  // Format additional arguments
  const formattedArgs = args.map((arg) => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg, null, 2);
    }
    return arg;
  });

  return (
    formatted + (formattedArgs.length > 0 ? ' ' + formattedArgs.join(' ') : '')
  );
};

const logger = {
  info: (message, ...args) => {
    const msg = formatMessage('INFO', message, ...args);
    writeToFile(msg);
    if (process.env.NODE_ENV !== 'production') {
      console.info(msg);
    }
  },

  warn: (message, ...args) => {
    const msg = formatMessage('WARN', message, ...args);
    writeToFile(msg);
    console.warn(msg);
  },

  error: (message, ...args) => {
    const msg = formatMessage('ERROR', message, ...args);
    writeToFile(msg);
    console.error(msg);
  },

  debug: (message, ...args) => {
    // Only log debug messages in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      const msg = formatMessage('DEBUG', message, ...args);
      console.debug(msg);
      writeToFile(msg);
    }
  },

  success: (message, ...args) => {
    const msg = formatMessage('SUCCESS', message, ...args);
    writeToFile(msg);
    if (process.env.NODE_ENV !== 'production') {
      console.log(msg);
    }
  },

  // Production-safe logging methods
  production: {
    info: (message, ...args) => {
      const msg = formatMessage('INFO', message, ...args);
      writeToFile(msg);
      // Only log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.info(msg);
      }
    },

    warn: (message, ...args) => {
      const msg = formatMessage('WARN', message, ...args);
      writeToFile(msg);
      console.warn(msg);
    },

    error: (message, ...args) => {
      const msg = formatMessage('ERROR', message, ...args);
      writeToFile(msg);
      console.error(msg);
    }
  },

  // Database specific logging
  db: {
    connect: (host) => {
      const sanitizedHost = host ? host.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : host;
      console.log(
        formatMessage(
          'SUCCESS',
          `Database connected successfully to ${chalk.cyan(sanitizedHost)}`
        )
      );
    },
    disconnect: () => {
      console.log(formatMessage('INFO', 'Database connection closed'));
    },
    error: (error) => {
      console.error(
        formatMessage('ERROR', `Database error: ${chalk.red(error.message)}`)
      );
    },
  },

  // HTTP request logging
  http: {
    request: (method, path, statusCode, responseTime) => {
      const statusColor =
        statusCode >= 400
          ? chalk.red
          : statusCode >= 300
            ? chalk.yellow
            : chalk.green;
      console.log(
        formatMessage(
          'INFO',
          `${chalk.bold(method)} ${chalk.cyan(path)} ${statusColor(statusCode)} ${chalk.gray(`${responseTime}ms`)}`
        )
      );
    },
    error: (method, path, statusCode, error) => {
      console.error(
        formatMessage(
          'ERROR',
          `${chalk.bold(method)} ${chalk.cyan(path)} ${chalk.red(statusCode)} - ${error.message}`
        )
      );
    },
  },

  // Authentication logging
  auth: {
    login: (userId, success) => {
      const status = success ? chalk.green('SUCCESS') : chalk.red('FAILED');
      console.log(
        formatMessage(
          'INFO',
          `Login attempt for user ${chalk.cyan(userId)}: ${status}`
        )
      );
    },
    logout: (userId) => {
      console.log(
        formatMessage('INFO', `User ${chalk.cyan(userId)} logged out`)
      );
    },
    token: {
      valid: (userId) => {
        // Only log in development
        if (process.env.NODE_ENV !== 'production') {
          console.log(
            formatMessage('DEBUG', `Valid token for user ${chalk.cyan(userId)}`)
          );
        }
      },
      invalid: (reason) => {
        console.error(
          formatMessage('WARN', `Invalid token: ${chalk.yellow(reason)}`)
        );
      },
      expired: (userId) => {
        console.warn(
          formatMessage('WARN', `Expired token for user ${chalk.cyan(userId)}`)
        );
      },
    },
  },
};

module.exports = logger;
