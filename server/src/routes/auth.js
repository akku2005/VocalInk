const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  verificationLimiter
} = require('../middleware/rateLimiter');
const { validate, validateRequest } = require('../middleware/validators');
const { 
  registerSchema, 
  loginSchema 
} = require('../validations/authSchema');
const Joi = require('joi');
const verifyEmailSchema = Joi.object({ email: Joi.string().email().required(), code: Joi.string().required() });
const forgotPasswordSchema = Joi.object({ email: Joi.string().email().required() });
const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  code: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

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
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           description: User's role
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
 *         - newPassword
 *       properties:
 *         token:
 *           type: string
 *           description: Reset password token
 *         newPassword:
 *           type: string
 *           format: password
 *           description: New password
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
 *           description: Email verification numerical code
 *     ResendVerificationCode:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address to resend verification to
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           description: JWT token
 *         user:
 *           $ref: '#/components/schemas/User' # Assuming User schema is defined elsewhere
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
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
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
 *                   example: 'User registered successfully. Please check your email for verification code.'
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     verificationToken:
 *                       type: string
 *                       description: Email verification token
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Input validation middleware
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Invalid role')
];

function validateJoi(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
  };
}

// Routes
router.post('/register', registerLimiter, validateJoi(registerSchema), authController.register);
router.post('/login', loginLimiter, validateJoi(loginSchema), authController.login);
router.post('/verify-email', verificationLimiter, validateJoi(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', verificationLimiter, authController.resendVerificationCode);
router.post('/forgot-password', passwordResetLimiter, validateJoi(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateJoi(resetPasswordSchema), authController.resetPassword);
router.post('/change-password', protect, authController.changePassword);
router.post('/logout', protect, authController.logout);
router.post('/logout-all', protect, authController.logoutAll);
router.get('/me', protect, authController.getCurrentUser);
router.post('/refresh-token', authController.refreshToken);
router.get('/sessions', protect, authController.getUserSessions);

// 2FA routes
router.post('/2fa/setup', protect, authController.generate2FASetup);
router.post('/2fa/verify', protect, authController.verify2FASetup);
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
  auditLogger('ADMIN_ACCESS'),
  (req, res) => {
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Admin access granted'
    });
  }
);

module.exports = router; 