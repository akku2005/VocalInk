const Joi = require('joi');

// Reusable validation components
const urlSchema = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .allow('')
  .max(500)
  .messages({
    'string.uri': 'Please provide a valid URL',
    'string.max': 'URL is too long',
  });

const safeStringSchema = Joi.string()
  .max(500)
  .trim();

const bioSchema = Joi.string()
  .max(1000)
  .trim()
  .allow('')
  .messages({
    'string.max': 'Bio must not exceed 1000 characters',
  });

// Profile update schema
const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).trim().optional(),
  lastName: Joi.string().min(1).max(50).trim().optional(),
  displayName: Joi.string().min(1).max(100).trim().optional(),
  username: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens',
    }),
  email: Joi.string().email().lowercase().trim().optional(),
  bio: bioSchema.optional(),
  location: safeStringSchema.max(100).optional(),
  website: urlSchema.optional(),
  company: safeStringSchema.max(100).optional(),
  jobTitle: safeStringSchema.max(100).optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say', '').optional(),
  occupation: safeStringSchema.max(100).optional(),
  nationality: safeStringSchema.max(100).optional(),
  mobile: Joi.string().pattern(/^[+]?[\d\s-()]+$/).max(20).allow('').optional().messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
  dob: Joi.date().max('now').optional().allow(null),
  language: Joi.string().max(10).optional(),
  timezone: Joi.string().max(50).optional(),
  socialLinks: Joi.object({
    twitter: urlSchema.optional(),
    linkedin: urlSchema.optional(),
    github: urlSchema.optional(),
    facebook: urlSchema.optional(),
    instagram: urlSchema.optional(),
  }).optional(),
  avatar: urlSchema.optional(),
  coverImage: urlSchema.optional(),
}).unknown(false).messages({
  'object.unknown': 'Unknown field: {#label}',
});

// Account update schema
const updateAccountSchema = Joi.object({
  accountVisibility: Joi.string().valid('public', 'private', 'friends').optional(),
  emailNotifications: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
  marketingEmails: Joi.boolean().optional(),
}).unknown(false);

// Privacy update schema
const updatePrivacySchema = Joi.object({
  profileVisibility: Joi.string().valid('public', 'private', 'friends').optional(),
  postVisibility: Joi.string().valid('public', 'private', 'friends', 'followers').optional(),
  allowSearch: Joi.boolean().optional(),
  showOnlineStatus: Joi.boolean().optional(),
  allowDirectMessages: Joi.boolean().optional(),
  dataSharing: Joi.boolean().optional(),
  analyticsSharing: Joi.boolean().optional(),
  showEmail: Joi.boolean().optional(),
  allowMessages: Joi.boolean().optional(),
}).unknown(false);

// Notification settings schema
const updateNotificationsSchema = Joi.object({
  emailNotifications: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
  marketingEmails: Joi.boolean().optional(),
  weeklyDigest: Joi.boolean().optional(),
  commentNotifications: Joi.boolean().optional(),
  likeNotifications: Joi.boolean().optional(),
  followNotifications: Joi.boolean().optional(),
  mentionNotifications: Joi.boolean().optional(),
}).unknown(false);

// AI preferences schema
const updateAISchema = Joi.object({
  language: Joi.string().max(10).optional(),
  voicePreference: Joi.string().max(50).optional(),
  autoTranscribe: Joi.boolean().optional(),
  qualityLevel: Joi.string().valid('low', 'medium', 'high', 'premium').optional(),
  enableAISuggestions: Joi.boolean().optional(),
}).unknown(false);

// Gamification settings schema
const updateGamificationSchema = Joi.object({
  gamification: Joi.object({
    showXP: Joi.boolean().optional(),
    showLevel: Joi.boolean().optional(),
    showBadges: Joi.boolean().optional(),
    showLeaderboard: Joi.boolean().optional(),
    notifications: Joi.boolean().optional(),
  }).optional(),
  showXP: Joi.boolean().optional(),
  showLevel: Joi.boolean().optional(),
  showBadges: Joi.boolean().optional(),
  showLeaderboard: Joi.boolean().optional(),
  notifications: Joi.boolean().optional(),
}).unknown(false);

// Appearance settings schema
const updateAppearanceSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark', 'system', 'auto').optional(),
}).unknown(false);

// Security settings schema
const updateSecuritySchema = Joi.object({
  loginNotifications: Joi.boolean().optional(),
  suspiciousActivityAlerts: Joi.boolean().optional(),
  autoLogout: Joi.number().min(5).max(1440).optional(), // 5 minutes to 24 hours
}).unknown(false);

// Change password schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-[\]{}|\\:";'<>,.?/~`])[A-Za-z\d@$!%*?&#^()_+=\-[\]{}|\\:";'<>,.?/~`]{8,}$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required',
    }),
}).unknown(false);

// 2FA verify schema
const verify2FASchema = Joi.object({
  token: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Verification code must be exactly 6 digits',
      'string.pattern.base': 'Verification code must contain only numbers',
      'any.required': 'Verification code is required',
    }),
}).unknown(false);

// 2FA disable schema
const disable2FASchema = Joi.object({
  password: Joi.string().required().messages({
    'any.required': 'Password is required to disable 2FA',
  }),
}).unknown(false);

// Delete account schema
const deleteAccountSchema = Joi.object({
  confirmationText: Joi.string().valid('DELETE', 'DELETE MY ACCOUNT').optional(),
  confirmText: Joi.string().valid('DELETE', 'DELETE MY ACCOUNT').optional(),
  password: Joi.string().required().messages({
    'any.required': 'Password is required to delete account',
  }),
}).or('confirmationText', 'confirmText').unknown(false).messages({
  'object.missing': 'Confirmation text is required. Type "DELETE" to confirm.',
});

module.exports = {
  updateProfileSchema,
  updateAccountSchema,
  updatePrivacySchema,
  updateNotificationsSchema,
  updateAISchema,
  updateGamificationSchema,
  updateAppearanceSchema,
  updateSecuritySchema,
  changePasswordSchema,
  verify2FASchema,
  disable2FASchema,
  deleteAccountSchema,
};
