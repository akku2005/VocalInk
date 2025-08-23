const express = require('express');
const { body, param, query } = require('express-validator');
const TTSController = require('../controllers/TTSController');
const { protect } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validators');
const { ttsRateLimiter } = require('../middleware/aiRateLimiter');
const logger = require('../utils/logger');

const router = express.Router();
const ttsController = new TTSController();

// Apply rate limiting to all TTS routes
router.use(ttsRateLimiter);

/**
 * @route POST /api/tts/generate
 * @desc Generate TTS from text
 * @access Private
 */
router.post(
  '/generate',
  protect,
  [
    body('text')
      .optional()
      .isString()
      .isLength({ min: 1, max: 10000 })
      .withMessage('Text must be between 1 and 10,000 characters'),
    body('provider')
      .optional()
      .isIn(['elevenlabs', 'googlecloud', 'espeak', 'gtts', 'responsivevoice'])
      .withMessage('Invalid provider'),
    body('voice')
      .optional()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Voice must be between 1 and 50 characters'),
    body('voiceId')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Voice ID must be between 1 and 100 characters'),
    body('voiceName')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Voice name must be between 1 and 100 characters'),
    body('languageCode')
      .optional()
      .isString()
      .isLength({ min: 2, max: 10 })
      .withMessage('Language code must be between 2 and 10 characters'),
    body('ssmlGender')
      .optional()
      .isIn(['MALE', 'FEMALE', 'NEUTRAL'])
      .withMessage('Invalid SSML gender'),
    body('speed')
      .optional()
      .isFloat({ min: 0.5, max: 3.0 })
      .withMessage('Speed must be between 0.5 and 3.0'),
    body('speakingRate')
      .optional()
      .isFloat({ min: 0.25, max: 4.0 })
      .withMessage('Speaking rate must be between 0.25 and 4.0'),
    body('stability')
      .optional()
      .isFloat({ min: 0.0, max: 1.0 })
      .withMessage('Stability must be between 0.0 and 1.0'),
    body('similarityBoost')
      .optional()
      .isFloat({ min: 0.0, max: 1.0 })
      .withMessage('Similarity boost must be between 0.0 and 1.0'),
    body('style')
      .optional()
      .isFloat({ min: 0.0, max: 1.0 })
      .withMessage('Style must be between 0.0 and 1.0'),
    body('useSpeakerBoost')
      .optional()
      .isBoolean()
      .withMessage('Use speaker boost must be a boolean'),
    body('pitch')
      .optional()
      .isFloat({ min: -20.0, max: 20.0 })
      .withMessage('Pitch must be between -20.0 and 20.0'),
    body('volumeGainDb')
      .optional()
      .isFloat({ min: -96.0, max: 16.0 })
      .withMessage('Volume gain must be between -96.0 and 16.0'),
    body('language')
      .optional()
      .isString()
      .isLength({ min: 2, max: 5 })
      .withMessage('Language must be between 2 and 5 characters'),
  ],
  handleValidationErrors,
  ttsController.generateTTS.bind(ttsController)
);

/**
 * @route POST /api/tts/generate/:blogId
 * @desc Generate TTS from blog content
 * @access Private
 */
router.post(
  '/generate/:blogId',
  protect,
  [
    param('blogId')
      .isMongoId()
      .withMessage('Invalid blog ID'),
    body('provider')
      .optional()
      .isIn(['elevenlabs', 'googlecloud', 'espeak', 'gtts', 'responsivevoice'])
      .withMessage('Invalid provider'),
    body('voice')
      .optional()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Voice must be between 1 and 50 characters'),
    body('voiceId')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Voice ID must be between 1 and 100 characters'),
    body('voiceName')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Voice name must be between 1 and 100 characters'),
    body('languageCode')
      .optional()
      .isString()
      .isLength({ min: 2, max: 10 })
      .withMessage('Language code must be between 2 and 10 characters'),
    body('ssmlGender')
      .optional()
      .isIn(['MALE', 'FEMALE', 'NEUTRAL'])
      .withMessage('Invalid SSML gender'),
    body('speed')
      .optional()
      .isFloat({ min: 0.5, max: 3.0 })
      .withMessage('Speed must be between 0.5 and 3.0'),
    body('speakingRate')
      .optional()
      .isFloat({ min: 0.25, max: 4.0 })
      .withMessage('Speaking rate must be between 0.25 and 4.0'),
    body('stability')
      .optional()
      .isFloat({ min: 0.0, max: 1.0 })
      .withMessage('Stability must be between 0.0 and 1.0'),
    body('similarityBoost')
      .optional()
      .isFloat({ min: 0.0, max: 1.0 })
      .withMessage('Similarity boost must be between 0.0 and 1.0'),
    body('style')
      .optional()
      .isFloat({ min: 0.0, max: 1.0 })
      .withMessage('Style must be between 0.0 and 1.0'),
    body('useSpeakerBoost')
      .optional()
      .isBoolean()
      .withMessage('Use speaker boost must be a boolean'),
    body('pitch')
      .optional()
      .isFloat({ min: -20.0, max: 20.0 })
      .withMessage('Pitch must be between -20.0 and 20.0'),
    body('volumeGainDb')
      .optional()
      .isFloat({ min: -96.0, max: 16.0 })
      .withMessage('Volume gain must be between -96.0 and 16.0'),
    body('language')
      .optional()
      .isString()
      .isLength({ min: 2, max: 5 })
      .withMessage('Language must be between 2 and 5 characters'),
  ],
  handleValidationErrors,
  ttsController.generateTTS.bind(ttsController)
);

/**
 * @route GET /api/tts/jobs/:jobId
 * @desc Get job status
 * @access Private
 */
router.get(
  '/jobs/:jobId',
  protect,
  [
    param('jobId')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Job ID must be between 1 and 100 characters'),
  ],
  handleValidationErrors,
  ttsController.getJobStatus.bind(ttsController)
);

/**
 * @route GET /api/tts/jobs/idempotency/:idempotencyKey
 * @desc Get job by idempotency key
 * @access Private
 */
router.get(
  '/jobs/idempotency/:idempotencyKey',
  protect,
  [
    param('idempotencyKey')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Idempotency key must be between 1 and 100 characters'),
  ],
  handleValidationErrors,
  ttsController.getJobByIdempotencyKey.bind(ttsController)
);

/**
 * @route DELETE /api/tts/jobs/:jobId
 * @desc Cancel job
 * @access Private
 */
router.delete(
  '/jobs/:jobId',
  protect,
  [
    param('jobId')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Job ID must be between 1 and 100 characters'),
  ],
  handleValidationErrors,
  ttsController.cancelJob.bind(ttsController)
);

/**
 * @route POST /api/tts/jobs/:jobId/retry
 * @desc Retry failed job
 * @access Private
 */
router.post(
  '/jobs/:jobId/retry',
  protect,
  [
    param('jobId')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Job ID must be between 1 and 100 characters'),
  ],
  handleValidationErrors,
  ttsController.retryJob.bind(ttsController)
);

/**
 * @route GET /api/tts/voices
 * @desc Get available voices
 * @access Private
 */
router.get(
  '/voices',
  protect,
  [
    query('provider')
      .optional()
      .isIn(['elevenlabs', 'googlecloud', 'espeak', 'gtts', 'responsivevoice'])
      .withMessage('Invalid provider'),
  ],
  handleValidationErrors,
  ttsController.getAvailableVoices.bind(ttsController)
);

/**
 * @route GET /api/tts/user/jobs
 * @desc Get user's TTS jobs
 * @access Private
 */
router.get(
  '/user/jobs',
  protect,
  [
    query('status')
      .optional()
      .isIn(['queued', 'processing', 'completed', 'failed', 'cancelled'])
      .withMessage('Invalid status'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer'),
  ],
  handleValidationErrors,
  ttsController.getUserJobs.bind(ttsController)
);

/**
 * @route GET /api/tts/health
 * @desc Health check
 * @access Public
 */
router.get(
  '/health',
  ttsController.healthCheck.bind(ttsController)
);

// Admin routes (require admin role)
/**
 * @route GET /api/tts/admin/stats
 * @desc Get service statistics
 * @access Admin
 */
router.get(
  '/admin/stats',
  protect,
  ttsController.getServiceStats.bind(ttsController)
);

/**
 * @route POST /api/tts/admin/cleanup
 * @desc Cleanup old jobs
 * @access Admin
 */
router.post(
  '/admin/cleanup',
  protect,
  [
    body('maxAge')
      .optional()
      .isInt({ min: 3600000, max: 30 * 24 * 60 * 60 * 1000 }) // 1 hour to 30 days
      .withMessage('Max age must be between 1 hour and 30 days in milliseconds'),
  ],
  handleValidationErrors,
  ttsController.cleanupOldJobs.bind(ttsController)
);

/**
 * @route GET /api/tts/admin/dead-letter
 * @desc Get dead letter queue jobs
 * @access Admin
 */
router.get(
  '/admin/dead-letter',
  protect,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
  ],
  handleValidationErrors,
  ttsController.getDeadLetterJobs.bind(ttsController)
);

/**
 * @route POST /api/tts/admin/dead-letter/reprocess
 * @desc Reprocess dead letter queue jobs
 * @access Admin
 */
router.post(
  '/admin/dead-letter/reprocess',
  protect,
  [
    body('jobIds')
      .optional()
      .isArray()
      .withMessage('Job IDs must be an array'),
    body('jobIds.*')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Each job ID must be between 1 and 100 characters'),
  ],
  handleValidationErrors,
  ttsController.reprocessDeadLetterJobs.bind(ttsController)
);

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('TTS route error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router; 