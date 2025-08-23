const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const logFile = path.join(logDir, 'server.log');

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
  const formattedMessage = formatArgs(message, ...args);

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

  // No colorization for URLs, numbers, or booleans
  // Just keep the message as is

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
    console.info(msg);
    writeToFile(msg);
  },

  warn: (message, ...args) => {
    const msg = formatMessage('WARN', message, ...args);
    console.warn(msg);
    writeToFile(msg);
  },

  error: (message, ...args) => {
    const msg = formatMessage('ERROR', message, ...args);
    console.error(msg);
    writeToFile(msg);
  },

  debug: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      const msg = formatMessage('DEBUG', message, ...args);
      console.debug(msg);
      writeToFile(msg);
    }
  },

  success: (message, ...args) => {
    const msg = formatMessage('SUCCESS', message, ...args);
    console.log(msg);
    writeToFile(msg);
  },

  // Database specific logging
  db: {
    connect: (host) => {
      console.log(
        formatMessage(
          'SUCCESS',
          `Database connected successfully to ${chalk.cyan(host)}`
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
        console.log(
          formatMessage('DEBUG', `Valid token for user ${chalk.cyan(userId)}`)
        );
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
