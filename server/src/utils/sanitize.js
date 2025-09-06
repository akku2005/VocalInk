const crypto = require('crypto');

// Sanitization utility for user input
function sanitizeInput(input, maxLength = 255) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove dangerous protocols
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/file:/gi, '')
    .replace(/ftp:/gi, '')
    .replace(/gopher:/gi, '')
    .replace(/mailto:/gi, '')
    .replace(/news:/gi, '')
    .replace(/telnet:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove dangerous functions
    .replace(/expression\s*\(/gi, '')
    .replace(/url\s*\(/gi, '')
    .replace(/eval\s*\(/gi, '')
    .replace(/document\./gi, '')
    .replace(/window\./gi, '')
    .replace(/alert\s*\(/gi, '')
    .replace(/confirm\s*\(/gi, '')
    .replace(/prompt\s*\(/gi, '')
    .replace(/console\./gi, '')
    .replace(/debugger/gi, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Limit length
    .slice(0, maxLength);
}

// Enhanced MongoDB query sanitization
function sanitizeMongoQuery(query) {
  if (!query || typeof query !== 'object') return query;
  
  const sanitized = {};
  const dangerousOperators = [
    '$where', '$regex', '$ne', '$gt', '$lt', '$gte', '$lte',
    '$in', '$nin', '$exists', '$type', '$mod', '$all',
    '$elemMatch', '$size', '$or', '$and', '$not', '$nor',
    '$text', '$search', '$language', '$caseSensitive', '$diacriticSensitive'
  ];
  
  for (const [key, value] of Object.entries(query)) {
    // Skip dangerous operators
    if (dangerousOperators.includes(key)) {
      continue;
    }
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

// Enhanced email validation
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // Check for common disposable email domains
  if (isDisposableEmailDomain(email)) return false;
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./, // Double dots
    /^\./, // Starts with dot
    /\.$/, // Ends with dot
    /[<>]/, // HTML tags
    /javascript:/i,
    /data:/i,
    /vbscript:/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(email)) return false;
  }
  
  return true;
}

// Enhanced password validation
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  const errors = [];
  const requirements = {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 12,
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
    requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS === 'true',
    preventCommon: process.env.PASSWORD_PREVENT_COMMON === 'true',
    preventSequential: process.env.PASSWORD_PREVENT_SEQUENTIAL === 'true'
  };
  
  // Check length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }
  
  // Check for uppercase letters
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letters
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for numbers
  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special characters
  if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common passwords
  if (requirements.preventCommon) {
    const commonPasswords = [
      'password', '123456', 'qwerty', 'admin', 'letmein', 'welcome',
      'monkey', 'dragon', 'master', 'football', 'baseball', 'shadow',
      'michael', 'jennifer', 'thomas', 'jessica', 'jordan', 'hunter',
      'michelle', 'charlie', 'andrew', 'matthew', 'abigail', 'daniel',
      'joshua', 'sarah', 'tyler', 'david', 'emma', 'ashley', 'john',
      'emily', 'chris', 'samantha', 'matt', 'nicole', 'ryan', 'jessica'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password');
    }
  }
  
  // Check for sequential characters
  if (requirements.preventSequential) {
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password contains repeated characters');
    }
    
    // Check for keyboard sequences
    const keyboardSequences = [
      'qwerty', 'asdfgh', 'zxcvbn', '123456', '654321',
      'abcdef', 'fedcba', 'qazwsx', 'wsxedc', 'edcrfv'
    ];
    
    for (const sequence of keyboardSequences) {
      if (password.toLowerCase().includes(sequence)) {
        errors.push('Password contains keyboard sequences');
        break;
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// List of common disposable email domains (expand as needed)
const DISPOSABLE_DOMAINS = [
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'tempmail.com',
  'yopmail.com',
  'trashmail.com',
  'getnada.com',
  'fakeinbox.com',
  'sharklasers.com',
  'dispostable.com',
  'maildrop.cc',
  'mintemail.com',
  'throwawaymail.com',
  'emailondeck.com',
  'spamgourmet.com',
  'mailnesia.com',
  'mytemp.email',
  'moakt.com',
  'temp-mail.org',
  'tempail.com',
  'mailcatch.com',
  'tempr.email',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'bccto.me',
  'chacuo.net',
  'dispostable.com',
  'mailnesia.com',
  'mailinator.net',
  'mailinator.org',
  'mailinator2.com',
  'mailinator3.com',
  'mailinator4.com',
  'mailinator5.com',
  'mailinator6.com',
  'mailinator7.com',
  'mailinator8.com',
  'mailinator9.com',
  'mailinator10.com',
  'mailinator11.com',
  'mailinator12.com',
  'mailinator13.com',
  'mailinator14.com',
  'mailinator15.com',
  'mailinator16.com',
  'mailinator17.com',
  'mailinator18.com',
  'mailinator19.com',
  'mailinator20.com',
  'mailinator21.com',
  'mailinator22.com',
  'mailinator23.com',
  'mailinator24.com',
  'mailinator25.com',
  'mailinator26.com',
  'mailinator27.com',
  'mailinator28.com',
  'mailinator29.com',
  'mailinator30.com',
  'mailinator31.com',
  'mailinator32.com',
  'mailinator33.com',
  'mailinator34.com',
  'mailinator35.com',
  'mailinator36.com',
  'mailinator37.com',
  'mailinator38.com',
  'mailinator39.com',
  'mailinator40.com',
  'mailinator41.com',
  'mailinator42.com',
  'mailinator43.com',
  'mailinator44.com',
  'mailinator45.com',
  'mailinator46.com',
  'mailinator47.com',
  'mailinator48.com',
  'mailinator49.com',
  'mailinator50.com',
  'mailinator51.com',
  'mailinator52.com',
  'mailinator53.com',
  'mailinator54.com',
  'mailinator55.com',
  'mailinator56.com',
  'mailinator57.com',
  'mailinator58.com',
  'mailinator59.com',
  'mailinator60.com',
  'mailinator61.com',
  'mailinator62.com',
  'mailinator63.com',
  'mailinator64.com',
  'mailinator65.com',
  'mailinator66.com',
  'mailinator67.com',
  'mailinator68.com',
  'mailinator69.com',
  'mailinator70.com',
  'mailinator71.com',
  'mailinator72.com',
  'mailinator73.com',
  'mailinator74.com',
  'mailinator75.com',
  'mailinator76.com',
  'mailinator77.com',
  'mailinator78.com',
  'mailinator79.com',
  'mailinator80.com',
  'mailinator81.com',
  'mailinator82.com',
  'mailinator83.com',
  'mailinator84.com',
  'mailinator85.com',
  'mailinator86.com',
  'mailinator87.com',
  'mailinator88.com',
  'mailinator89.com',
  'mailinator90.com',
  'mailinator91.com',
  'mailinator92.com',
  'mailinator93.com',
  'mailinator94.com',
  'mailinator95.com',
  'mailinator96.com',
  'mailinator97.com',
  'mailinator98.com',
  'mailinator99.com',
  'mailinator100.com'
];

function isDisposableEmailDomain(email) {
  if (typeof email !== 'string') return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

// Enhanced device fingerprinting
function generateDeviceFingerprint(req) {
  const components = [
    req.ip,
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.headers['x-forwarded-for'] || '',
    req.headers['x-real-ip'] || '',
    req.headers['x-forwarded-proto'] || '',
    req.headers['host'] || '',
    req.headers['connection'] || '',
    req.headers['sec-ch-ua'] || '',
    req.headers['sec-ch-ua-mobile'] || '',
    req.headers['sec-ch-ua-platform'] || '',
    req.headers['sec-fetch-dest'] || '',
    req.headers['sec-fetch-mode'] || '',
    req.headers['sec-fetch-site'] || '',
    req.headers['upgrade-insecure-requests'] || '',
  ];
  
  const fingerprintString = components.filter(Boolean).join('|');
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
}

// URL validation and sanitization
function validateAndSanitizeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const sanitizedUrl = sanitizeInput(url);
    const urlObj = new URL(sanitizedUrl);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
      /gopher:/i,
      /mailto:/i,
      /news:/i,
      /telnet:/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(urlObj.href)) {
        return null;
      }
    }
    
    return urlObj.href;
  } catch (error) {
    return null;
  }
}

// Phone number validation and sanitization
function validateAndSanitizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  
  // Remove all non-digit characters except +
  let sanitized = phone.replace(/[^\d+]/g, '');
  
  // Handle Indian phone numbers
  if (sanitized.startsWith('+91')) {
    sanitized = sanitized.substring(3);
  } else if (sanitized.startsWith('91')) {
    sanitized = sanitized.substring(2);
  } else if (sanitized.startsWith('0')) {
    sanitized = sanitized.substring(1);
  }
  
  // Validate Indian phone number format
  if (/^[6-9]\d{9}$/.test(sanitized)) {
    return `+91${sanitized}`;
  }
  
  return null;
}

// File name sanitization
function sanitizeFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') return '';
  
  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/^\./, '') // Remove leading dot
    .replace(/\.$/, '') // Remove trailing dot
    .trim()
    .slice(0, 255); // Limit length
}

// HTML content sanitization for rich text
function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  
  return html
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove dangerous attributes
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*javascript\s*:/gi, '')
    .replace(/\s*vbscript\s*:/gi, '')
    .replace(/\s*data\s*:/gi, '')
    // Remove dangerous tags
    .replace(/<(iframe|object|embed|form|input|textarea|select|button)[^>]*>/gi, '')
    .replace(/<\/(iframe|object|embed|form|input|textarea|select|button)>/gi, '')
    // Allow only safe tags and attributes
    .replace(/<(?!\/?(p|br|strong|em|u|h[1-6]|ul|ol|li|blockquote|code|pre|a|img|table|tr|td|th|thead|tbody|div|span))[^>]*>/gi, '')
    .replace(/<\/(?!p|br|strong|em|u|h[1-6]|ul|ol|li|blockquote|code|pre|a|img|table|tr|td|th|thead|tbody|div|span)[^>]*>/gi, '')
    // Remove dangerous attributes from allowed tags
    .replace(/\s*(on\w+|javascript|vbscript|data)\s*=\s*["'][^"']*["']/gi, '')
    .trim();
}

// Device type detection from user agent
function getDeviceType(userAgent) {
  if (!userAgent) return 'Unknown Device';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'Tablet';
  } else {
    return 'Desktop';
  }
}

// Browser name extraction from user agent
function getBrowserName(userAgent) {
  if (!userAgent) return 'Unknown Browser';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  if (ua.includes('msie') || ua.includes('trident')) return 'Internet Explorer';
  
  return 'Unknown Browser';
}

// Operating system detection from user agent
function getOperatingSystem(userAgent) {
  if (!userAgent) return 'Unknown OS';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac') || ua.includes('darwin')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  
  return 'Unknown OS';
}

// Simple IP geolocation (placeholder - in production use a proper service)
async function getLocationFromIP(ipAddress) {
  try {
    // For localhost/development, return a default location
    if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.includes('192.168.')) {
      return {
        country: 'Local',
        region: 'Development',
        city: 'Localhost'
      };
    }
    
    // In production, integrate with a geolocation service like:
    // - MaxMind GeoIP2
    // - IPGeolocation API
    // - ip-api.com
    
    return {
      country: 'Unknown',
      region: 'Unknown', 
      city: 'Unknown'
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown'
    };
  }
}

module.exports = {
  sanitizeInput,
  sanitizeMongoQuery,
  validateEmail,
  validatePassword,
  isDisposableEmailDomain,
  generateDeviceFingerprint,
  validateAndSanitizeUrl,
  validateAndSanitizePhone,
  sanitizeFileName,
  sanitizeHtml,
  getDeviceType,
  getBrowserName,
  getOperatingSystem,
  getLocationFromIP,
  DISPOSABLE_DOMAINS
};
