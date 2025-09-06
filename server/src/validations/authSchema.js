const Joi = require('joi');

// Enhanced password validation with industry standards
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
  });

// Enhanced email validation
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .lowercase()
  .trim()
  .max(254)
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email address is too long',
  });

// Enhanced name validation
const nameSchema = Joi.string()
  .min(2)
  .max(50)
  .pattern(/^[a-zA-Z\s\-'\.]+$/)
  .trim()
  .messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 50 characters',
    'string.pattern.base': 'Name can only contain letters, spaces, hyphens, apostrophes, and periods',
  });

// Registration schema with enhanced validation
const registerSchema = Joi.object({
  email: emailSchema.required(),
  password: passwordSchema.required(),
  firstName: nameSchema.required(),
  lastName: nameSchema.required(),
  role: Joi.string().valid('reader', 'writer', 'admin').optional(),
  skipVerification: Joi.boolean().optional(),
}).strict();

// Login schema with enhanced validation
const loginSchema = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().required(),
  twoFactorToken: Joi.string().optional(),
}).strict();

// Email verification schema
const verifyEmailSchema = Joi.object({
  email: emailSchema.required(),
  code: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Verification code must be exactly 6 digits',
      'string.pattern.base': 'Verification code must contain only numbers',
    }),
}).strict();

// Resend verification schema
const resendVerificationSchema = Joi.object({
  email: emailSchema.required(),
}).strict();

// Forgot password schema
const forgotPasswordSchema = Joi.object({
  email: emailSchema.required(),
}).strict();

// Reset password schema
const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  code: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Reset code must be exactly 6 digits',
      'string.pattern.base': 'Reset code must contain only numbers',
    }),
  newPassword: passwordSchema.required(),
}).strict();

// Change password schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordSchema.required(),
}).strict();

// 2FA setup verification schema
const twoFactorSetupSchema = Joi.object({
  token: Joi.string().required(),
}).strict();

// 2FA verification schema
const twoFactorVerificationSchema = Joi.object({
  token: Joi.string().required(),
}).strict();

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  twoFactorSetupSchema,
  twoFactorVerificationSchema,
};
