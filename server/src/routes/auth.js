const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const Joi = require('joi');

const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { 
  smartRateLimit,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  verificationLimiter,
  adminApiLimiter,
} = require('../middleware/rateLimiter');
const { validate, validateRequest } = require('../middleware/validators');
const { 
  registerSchema, 
  loginSchema, 
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  twoFactorSetupSchema,
  twoFactorVerificationSchema
} = require('../validations/authSchema');

// Helper to wrap controller methods
function routeHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterUser:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name (2-50 characters, letters only)
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (min 8 chars, must contain uppercase, lowercase, number, and special character)
 *         role:
 *           type: string
 *           enum: [reader, writer, admin]
 *           default: reader
 *           description: User's role
 *         skipVerification:
 *           type: boolean
 *           description: Skip email verification (development only)
 *     LoginUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         twoFactorToken:
 *           type: string
 *           description: Two-factor authentication code (if 2FA is enabled)
 *     VerifyEmail:
 *       type: object
 *       required:
 *         - email
 *         - code
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         code:
 *           type: string
 *           description: 6-digit verification code
 *     ResendVerification:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address to resend verification to
 *     ForgotPassword:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *     ResetPassword:
 *       type: object
 *       required:
 *         - token
 *         - code
 *         - newPassword
 *       properties:
 *         token:
 *           type: string
 *           description: Reset password token
 *         code:
 *           type: string
 *           description: 6-digit reset code
 *         newPassword:
 *           type: string
 *           format: password
 *           description: New password (min 8 chars, must contain uppercase, lowercase, number, and special character)
 *     ChangePassword:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           description: Current password
 *         newPassword:
 *           type: string
 *           format: password
 *           description: New password (min 8 chars, must contain uppercase, lowercase, number, and special character)
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           description: Response message
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             name:
 *               type: string
 *             role:
 *               type: string
 *             isVerified:
 *               type: boolean
 *             twoFactorEnabled:
 *               type: boolean
 *         accessToken:
 *           type: string
 *           description: JWT access token
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token
 *         deviceFingerprint:
 *           type: string
 *           description: Device fingerprint for security
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUser'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Registration successful. Please check your email for verification code.'
 *                 userId:
 *                   type: string
 *                 email:
 *                   type: string
 *                 isVerified:
 *                   type: boolean
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *       409:
 *         description: Email already registered
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUser'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials or unverified email
 *       423:
 *         description: Account locked
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmail'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid verification code or already verified
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification code
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendVerification'
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       400:
 *         description: Email already verified
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

function validateJoi(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
}

// Routes with enhanced validation and security
router.post(
  '/register',
  registerLimiter,
  validateJoi(registerSchema),
  authController.register
);

router.post(
  '/login',
  loginLimiter,
  validateJoi(loginSchema),
  authController.login
);

router.post(
  '/verify-email',
  verificationLimiter,
  validateJoi(verifyEmailSchema),
  authController.verifyEmail
);

router.post(
  '/resend-verification',
  verificationLimiter,
  validateJoi(resendVerificationSchema),
  authController.resendVerificationCode
);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  validateJoi(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  passwordResetLimiter,
  validateJoi(resetPasswordSchema),
  authController.resetPassword
);

router.post(
  '/change-password', 
  protect, 
  validateJoi(changePasswordSchema),
  authController.changePassword
);

router.post('/logout', protect, authController.logout);
router.post('/logout-all', protect, authController.logoutAll);
router.get('/me', protect, authController.getCurrentUser);
router.post('/refresh-token', authController.refreshToken);
router.get('/sessions', protect, authController.getUserSessions);

// 2FA routes with enhanced validation
router.post('/2fa/setup', protect, authController.generate2FASetup);
router.post(
  '/2fa/verify', 
  protect, 
  validateJoi(twoFactorVerificationSchema),
  authController.verify2FASetup
);
router.post('/2fa/disable', protect, authController.disable2FA);

// Admin-only routes
/**
 * @swagger
 * /api/auth/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/admin/users',
  protect,
  authorize('admin'),
  adminApiLimiter,
  auditLogger('ADMIN_ACCESS'),
  (req, res) => {
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Admin access granted',
    });
  }
);

module.exports = router;
