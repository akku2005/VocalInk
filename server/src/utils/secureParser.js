const logger = require('./logger');

/**
 * Secure JSON parser with validation
 * @param {string} jsonString - The JSON string to parse
 * @param {Object} options - Parsing options
 * @returns {any} Parsed data or null if invalid
 */
function secureJSONParse(jsonString, options = {}) {
  try {
    if (typeof jsonString !== 'string') {
      return jsonString;
    }

    // Basic validation - check for common injection patterns
    const dangerousPatterns = [
      /__proto__/,
      /constructor/,
      /prototype/,
      /function\s*\(/,
      /eval\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /new\s+Function/,
      /require\s*\(/,
      /import\s*\(/,
      /export\s*\(/,
      /window/,
      /document/,
      /global/,
      /process/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(jsonString)) {
        logger.warn('Dangerous pattern detected in JSON string:', { 
          pattern: pattern.source,
          jsonString: jsonString.substring(0, 100) + '...' 
        });
        return null;
      }
    }

    // Check for excessive nesting (prevent stack overflow)
    let depth = 0;
    let maxDepth = options.maxDepth || 10;
    
    for (const char of jsonString) {
      if (char === '{' || char === '[') {
        depth++;
        if (depth > maxDepth) {
          logger.warn('JSON nesting too deep:', { depth, maxDepth });
          return null;
        }
      } else if (char === '}' || char === ']') {
        depth--;
      }
    }

    // Check for excessive length
    const maxLength = options.maxLength || 10000;
    if (jsonString.length > maxLength) {
      logger.warn('JSON string too long:', { length: jsonString.length, maxLength });
      return null;
    }

    const parsed = JSON.parse(jsonString);
    
    // Additional validation for parsed object
    if (options.validateSchema && typeof options.validateSchema === 'function') {
      if (!options.validateSchema(parsed)) {
        logger.warn('JSON validation failed for schema');
        return null;
      }
    }

    return parsed;
  } catch (error) {
    logger.error('Secure JSON parsing failed:', error);
    return null;
  }
}

/**
 * Safe mathematical expression evaluator
 * @param {string} expression - Mathematical expression string
 * @param {Object} context - Variable context
 * @returns {number|boolean} Result or false if invalid
 */
function safeExpressionEvaluator(expression, context = {}) {
  try {
    if (typeof expression !== 'string') {
      return false;
    }

    // Replace variables with their values
    let evalExpression = expression;
    for (const [varName, value] of Object.entries(context)) {
      // Validate variable name
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
        logger.warn('Invalid variable name in expression:', { varName });
        return false;
      }
      
      // Validate value is numeric
      if (typeof value !== 'number' || !isFinite(value)) {
        logger.warn('Invalid variable value in expression:', { varName, value });
        return false;
      }
      
      evalExpression = evalExpression.replace(new RegExp(`\\b${varName}\\b`, 'g'), value);
    }

    // Enhanced safety check - only allow safe mathematical expressions
    const safePattern = /^[0-9+\-*/().<>=!&\| ]+$/;
    if (!safePattern.test(evalExpression)) {
      logger.warn('Unsafe expression detected:', { expression: evalExpression });
      return false;
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of evalExpression) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) return false;
    }
    if (parenCount !== 0) return false;

    // Check for consecutive operators
    const consecutiveOps = /[+\-*/]{2,}/;
    if (consecutiveOps.test(evalExpression)) return false;

    // Safe mathematical expression evaluation
    return evaluateSafeExpression(evalExpression);
  } catch (error) {
    logger.error('Error evaluating expression:', error);
    return false;
  }
}

/**
 * Evaluate safe mathematical expression
 * @param {string} expr - Clean mathematical expression
 * @returns {number|boolean} Result or false if invalid
 */
function evaluateSafeExpression(expr) {
  try {
    // Remove all whitespace
    const cleanExpr = expr.replace(/\s/g, '');
    
    // Validate expression structure
    if (!isValidExpression(cleanExpr)) {
      return false;
    }
    
    // Evaluate using safe mathematical operations
    return calculateExpression(cleanExpr);
  } catch (error) {
    logger.error('Safe expression evaluation failed:', error);
    return false;
  }
}

/**
 * Validate expression structure
 * @param {string} expr - Expression to validate
 * @returns {boolean} True if valid
 */
function isValidExpression(expr) {
  // Check for valid characters only
  const validChars = /^[0-9+\-*/().<>=!&\|]+$/;
  if (!validChars.test(expr)) return false;
  
  // Check for consecutive operators
  const consecutiveOps = /[+\-*/]{2,}/;
  if (consecutiveOps.test(expr)) return false;
  
  return true;
}

/**
 * Calculate mathematical expression safely
 * @param {string} expr - Expression to calculate
 * @returns {number|boolean} Result or false if invalid
 */
function calculateExpression(expr) {
  try {
    // Handle comparison operators
    if (expr.includes('==')) {
      const [left, right] = expr.split('==');
      return calculateExpression(left) == calculateExpression(right);
    }
    if (expr.includes('!=')) {
      const [left, right] = expr.split('!=');
      return calculateExpression(left) != calculateExpression(right);
    }
    if (expr.includes('>=')) {
      const [left, right] = expr.split('>=');
      return calculateExpression(left) >= calculateExpression(right);
    }
    if (expr.includes('<=')) {
      const [left, right] = expr.split('<=');
      return calculateExpression(left) <= calculateExpression(right);
    }
    if (expr.includes('>')) {
      const [left, right] = expr.split('>');
      return calculateExpression(left) > calculateExpression(right);
    }
    if (expr.includes('<')) {
      const [left, right] = expr.split('<');
      return calculateExpression(left) < calculateExpression(right);
    }
    
    // Handle logical operators
    if (expr.includes('&&')) {
      const [left, right] = expr.split('&&');
      return calculateExpression(left) && calculateExpression(right);
    }
    if (expr.includes('||')) {
      const [left, right] = expr.split('||');
      return calculateExpression(left) || calculateExpression(right);
    }
    
    // Handle basic arithmetic
    if (expr.includes('+')) {
      const [left, right] = expr.split('+');
      return calculateExpression(left) + calculateExpression(right);
    }
    if (expr.includes('-')) {
      const [left, right] = expr.split('-');
      return calculateExpression(left) - calculateExpression(right);
    }
    if (expr.includes('*')) {
      const [left, right] = expr.split('*');
      return calculateExpression(left) * calculateExpression(right);
    }
    if (expr.includes('/')) {
      const [left, right] = expr.split('/');
      const rightVal = calculateExpression(right);
      if (rightVal === 0) return false; // Prevent division by zero
      return calculateExpression(left) / rightVal;
    }
    
    // Base case: number
    const num = parseFloat(expr);
    return isNaN(num) ? false : num;
  } catch (error) {
    logger.error('Expression calculation failed:', error);
    return false;
  }
}

/**
 * Safe RegExp constructor with validation
 * @param {string} pattern - RegExp pattern
 * @param {string} flags - RegExp flags
 * @returns {RegExp|null} RegExp object or null if invalid
 */
function safeRegExp(pattern, flags = '') {
  try {
    if (typeof pattern !== 'string') {
      return null;
    }

    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      /\(\?[^:]*\)/, // Lookahead/lookbehind assertions
      /\(\?[^=]*\)/, // Positive lookahead
      /\(\?![^=]*\)/, // Negative lookahead
      /\(\?<=[^=]*\)/, // Positive lookbehind
      /\(\?<![^=]*\)/, // Negative lookbehind
      /\(\?[^=]*\)/, // Other assertions
      /\\[1-9]/, // Backreferences
      /\\[1-9][0-9]*/, // Large backreferences
    ];

    for (const dangerousPattern of dangerousPatterns) {
      if (dangerousPattern.test(pattern)) {
        logger.warn('Potentially dangerous RegExp pattern detected:', { pattern });
        return null;
      }
    }

    // Check for excessive repetition
    const repetitionPattern = /\{[0-9]+,?[0-9]*\}/;
    if (repetitionPattern.test(pattern)) {
      const match = pattern.match(repetitionPattern);
      if (match) {
        const [min, max] = match[0].slice(1, -1).split(',').map(Number);
        if (max && max > 1000) {
          logger.warn('RegExp repetition too high:', { pattern, max });
          return null;
        }
      }
    }

    return new RegExp(pattern, flags);
  } catch (error) {
    logger.error('Safe RegExp creation failed:', error);
    return null;
  }
}

/**
 * Validate and sanitize location data
 * @param {string} locationString - Location JSON string
 * @returns {Object|null} Sanitized location object or null if invalid
 */
function validateLocation(locationString) {
  try {
    if (!locationString) return null;
    
    const location = secureJSONParse(locationString, {
      maxLength: 1000,
      validateSchema: (data) => {
        // Validate location schema
        if (typeof data !== 'object' || data === null) return false;
        
        const allowedKeys = ['latitude', 'longitude', 'city', 'country', 'region'];
        const hasValidKeys = Object.keys(data).every(key => allowedKeys.includes(key));
        
        if (!hasValidKeys) return false;
        
        // Validate coordinates if present
        if (data.latitude !== undefined) {
          if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
            return false;
          }
        }
        
        if (data.longitude !== undefined) {
          if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
            return false;
          }
        }
        
        return true;
      }
    });
    
    return location;
  } catch (error) {
    logger.error('Location validation failed:', error);
    return null;
  }
}

module.exports = {
  secureJSONParse,
  safeExpressionEvaluator,
  safeRegExp,
  validateLocation
}; 