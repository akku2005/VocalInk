const chalk = require('chalk');

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
  
  // Colorize different types of content
  if (typeof message === 'string') {
    // Colorize URLs
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, chalk.cyan('$1'));
    // Colorize numbers
    formatted = formatted.replace(/(\d+)/g, chalk.yellow('$1'));
    // Colorize boolean values
    formatted = formatted.replace(/\b(true|false)\b/gi, chalk.green('$1'));
  }
  
  // Format additional arguments
  const formattedArgs = args.map(arg => {
    if (typeof arg === 'object') {
      return chalk.gray(JSON.stringify(arg, null, 2));
    }
    return arg;
  });
  
  return formatted + (formattedArgs.length > 0 ? ' ' + formattedArgs.join(' ') : '');
};

const logger = {
  info: (message, ...args) => {
    console.info(formatMessage('INFO', message, ...args));
  },
  
  warn: (message, ...args) => {
    console.warn(formatMessage('WARN', message, ...args));
  },
  
  error: (message, ...args) => {
    console.error(formatMessage('ERROR', message, ...args));
  },
  
  debug: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('DEBUG', message, ...args));
    }
  },
  
  success: (message, ...args) => {
    console.log(formatMessage('SUCCESS', message, ...args));
  },
  
  // Database specific logging
  db: {
    connect: (host) => {
      console.log(formatMessage('SUCCESS', `Database connected successfully to ${chalk.cyan(host)}`));
    },
    disconnect: () => {
      console.log(formatMessage('INFO', 'Database connection closed'));
    },
    error: (error) => {
      console.error(formatMessage('ERROR', `Database error: ${chalk.red(error.message)}`));
    }
  },
  
  // HTTP request logging
  http: {
    request: (method, path, statusCode, responseTime) => {
      const statusColor = statusCode >= 400 ? chalk.red : statusCode >= 300 ? chalk.yellow : chalk.green;
      console.log(formatMessage('INFO', 
        `${chalk.bold(method)} ${chalk.cyan(path)} ${statusColor(statusCode)} ${chalk.gray(`${responseTime}ms`)}`
      ));
    },
    error: (method, path, statusCode, error) => {
      console.error(formatMessage('ERROR', 
        `${chalk.bold(method)} ${chalk.cyan(path)} ${chalk.red(statusCode)} - ${error.message}`
      ));
    }
  },
  
  // Authentication logging
  auth: {
    login: (userId, success) => {
      const status = success ? chalk.green('SUCCESS') : chalk.red('FAILED');
      console.log(formatMessage('INFO', `Login attempt for user ${chalk.cyan(userId)}: ${status}`));
    },
    logout: (userId) => {
      console.log(formatMessage('INFO', `User ${chalk.cyan(userId)} logged out`));
    },
    token: {
      valid: (userId) => {
        console.log(formatMessage('DEBUG', `Valid token for user ${chalk.cyan(userId)}`));
      },
      invalid: (reason) => {
        console.error(formatMessage('WARN', `Invalid token: ${chalk.yellow(reason)}`));
      },
      expired: (userId) => {
        console.warn(formatMessage('WARN', `Expired token for user ${chalk.cyan(userId)}`));
      }
    }
  }
};

module.exports = logger; 