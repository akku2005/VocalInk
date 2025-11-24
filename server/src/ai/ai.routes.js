const express = require('express');
const multer = require('multer');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  ttsRateLimiter,
  sttRateLimiter,
  summaryRateLimiter,
  analysisRateLimiter,
  fileUploadRateLimiter
} = require('../middleware/aiRateLimiter');
const aiController = require('./ai.controller');

// Import enhanced AI routes
const aiEnhancedRoutes = require('./ai-enhanced.routes');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Security fix: Only accept specific audio MIME types, remove overly permissive octet-stream
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
      'audio/aac',
      'audio/flac'
    ];

    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only specific audio formats are allowed (MP3, WAV, OGG, M4A, AAC, FLAC)'), false);
    }
  }
});

// Validation middleware
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}

// Apply general rate limiting to all AI routes
// Specific rate limiters will be applied to individual routes

// TTS Routes
router.post(
  '/tts/generate',
  protect,
  ttsRateLimiter,
  [
    body('text').optional().isString().isLength({ min: 1, max: 10000 }),
    body('provider').optional().isIn(['elevenlabs', 'googlecloud', 'espeak', 'gtts', 'responsivevoice']),
    body('voice').optional().isString(),
    body('voiceId').optional().isString(),
    body('voiceName').optional().isString(),
    body('languageCode').optional().isString(),
    body('ssmlGender').optional().isIn(['MALE', 'FEMALE', 'NEUTRAL']),
    body('speed').optional().isFloat({ min: 0.5, max: 3.0 }),
    body('speakingRate').optional().isFloat({ min: 0.25, max: 4.0 }),
    body('stability').optional().isFloat({ min: 0.0, max: 1.0 }),
    body('similarityBoost').optional().isFloat({ min: 0.0, max: 1.0 }),
    body('style').optional().isFloat({ min: 0.0, max: 1.0 }),
    body('useSpeakerBoost').optional().isBoolean(),
    body('pitch').optional().isFloat({ min: -20.0, max: 20.0 }),
    body('volumeGainDb').optional().isFloat({ min: -96.0, max: 16.0 }),
    body('language').optional().isString().isLength({ min: 2, max: 5 })
  ],
  validate,
  aiController.generateTTS
);

router.post(
  '/tts/generate/:blogId',
  protect,
  ttsRateLimiter,
  [
    param('blogId').isMongoId(),
    body('provider').optional().isIn(['elevenlabs', 'googlecloud', 'espeak', 'gtts', 'responsivevoice']),
    body('voice').optional().isString(),
    body('voiceId').optional().isString(),
    body('voiceName').optional().isString(),
    body('languageCode').optional().isString(),
    body('ssmlGender').optional().isIn(['MALE', 'FEMALE', 'NEUTRAL']),
    body('speed').optional().isFloat({ min: 0.5, max: 3.0 }),
    body('speakingRate').optional().isFloat({ min: 0.25, max: 4.0 }),
    body('stability').optional().isFloat({ min: 0.0, max: 1.0 }),
    body('similarityBoost').optional().isFloat({ min: 0.0, max: 1.0 }),
    body('style').optional().isFloat({ min: 0.0, max: 1.0 }),
    body('useSpeakerBoost').optional().isBoolean(),
    body('pitch').optional().isFloat({ min: -20.0, max: 20.0 }),
    body('volumeGainDb').optional().isFloat({ min: -96.0, max: 16.0 }),
    body('language').optional().isString().isLength({ min: 2, max: 5 })
  ],
  validate,
  aiController.generateTTS
);

router.get(
  '/tts/voices',
  protect,
  [
    query('provider').optional().isIn(['elevenlabs', 'googlecloud', 'espeak', 'gtts', 'responsivevoice'])
  ],
  validate,
  aiController.getAvailableVoices
);

// ElevenLabs specific routes
router.get(
  '/tts/elevenlabs/voices',
  protect,
  aiController.getElevenLabsVoices
);

router.get(
  '/tts/elevenlabs/voices/:voiceId',
  protect,
  [
    param('voiceId').isString().isLength({ min: 1, max: 100 })
  ],
  validate,
  aiController.getElevenLabsVoiceDetails
);

// Google Cloud specific routes
router.get(
  '/tts/googlecloud/voices',
  protect,
  aiController.getGoogleCloudVoices
);

router.get(
  '/tts/googlecloud/voices/:voiceName',
  protect,
  [
    param('voiceName').isString().isLength({ min: 1, max: 100 })
  ],
  validate,
  aiController.getGoogleCloudVoiceDetails
);

router.get(
  '/tts/stats',
  protect,
  aiController.getTTSStats
);

router.post(
  '/tts/customize/:blogId',
  protect,
  [
    param('blogId').isMongoId(),
    body('voice').optional().isString(),
    body('speed').optional().isFloat({ min: 0.5, max: 3.0 }),
    body('pitch').optional().isFloat({ min: 0.5, max: 2.0 }),
    body('volume').optional().isFloat({ min: 0.0, max: 1.0 }),
    body('language').optional().isString().isLength({ min: 2, max: 5 })
  ],
  validate,
  aiController.customizeVoice
);

// STT Routes
router.post(
  '/stt/transcribe',
  protect,
  fileUploadRateLimiter,
  upload.single('audio'),
  [
    body('language').optional().isString().isLength({ min: 2, max: 10 }),
    body('format').optional().isIn(['wav', 'mp3', 'ogg', 'm4a'])
  ],
  validate,
  aiController.transcribeAudio
);

router.post(
  '/stt/transcribe-file',
  protect,
  fileUploadRateLimiter,
  upload.single('audio'),
  [
    body('language').optional().isString().isLength({ min: 2, max: 10 }),
    body('format').optional().isIn(['wav', 'mp3', 'ogg', 'm4a']),
    body('filename').optional().isString()
  ],
  validate,
  aiController.transcribeFile
);

router.get(
  '/stt/transcription/:transcriptId',
  protect,
  [
    param('transcriptId').isString().isLength({ min: 1, max: 100 })
  ],
  validate,
  aiController.getTranscription
);

router.get(
  '/stt/transcriptions',
  protect,
  [
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  aiController.getUserTranscriptions
);

router.get(
  '/stt/languages',
  protect,
  aiController.getAvailableLanguages
);

// Summary Routes
router.post(
  '/summary/generate',
  protect,
  summaryRateLimiter,
  [
    body('content').optional().isString().isLength({ min: 10, max: 50000 }),
    body('maxLength').optional().isInt({ min: 50, max: 1000 }),
    body('style').optional().isIn(['concise', 'detailed', 'bullet', 'numbered']),
    body('includeKeyPoints').optional().isBoolean(),
    body('language').optional().isString().isLength({ min: 2, max: 5 })
  ],
  validate,
  aiController.generateSummary
);

router.post(
  '/summary/generate/:blogId',
  protect,
  summaryRateLimiter,
  [
    param('blogId').isMongoId(),
    body('maxLength').optional().isInt({ min: 50, max: 1000 }),
    body('style').optional().isIn(['concise', 'detailed', 'bullet', 'numbered']),
    body('includeKeyPoints').optional().isBoolean(),
    body('language').optional().isString().isLength({ min: 2, max: 5 })
  ],
  validate,
  aiController.generateSummary
);

router.post(
  '/summary/key-points',
  protect,
  [
    body('content').optional().isString().isLength({ min: 10, max: 50000 }),
    body('maxPoints').optional().isInt({ min: 1, max: 20 }),
    body('minLength').optional().isInt({ min: 5, max: 200 }),
    body('maxLength').optional().isInt({ min: 10, max: 500 })
  ],
  validate,
  aiController.generateKeyPoints
);

router.post(
  '/summary/key-points/:blogId',
  protect,
  [
    param('blogId').isMongoId(),
    body('maxPoints').optional().isInt({ min: 1, max: 20 }),
    body('minLength').optional().isInt({ min: 5, max: 200 }),
    body('maxLength').optional().isInt({ min: 10, max: 500 })
  ],
  validate,
  aiController.generateKeyPoints
);

router.post(
  '/summary/tldr',
  protect,
  [
    body('content').optional().isString().isLength({ min: 10, max: 50000 }),
    body('maxLength').optional().isInt({ min: 20, max: 500 }),
    body('style').optional().isIn(['casual', 'formal', 'bullet'])
  ],
  validate,
  aiController.generateTLDR
);

router.post(
  '/summary/tldr/:blogId',
  protect,
  [
    param('blogId').isMongoId(),
    body('maxLength').optional().isInt({ min: 20, max: 500 }),
    body('style').optional().isIn(['casual', 'formal', 'bullet'])
  ],
  validate,
  aiController.generateTLDR
);

// Blog Content Generation Route
router.post(
  '/generate-blog',
  protect,
  summaryRateLimiter, // Reuse summary rate limiter for blog generation
  [
    body('topic').isString().isLength({ min: 3, max: 500 }).trim(),
    body('tone').optional().isIn(['professional', 'casual', 'technical', 'creative', 'educational']),
    body('length').optional().isIn(['short', 'medium', 'long']),
    body('language').optional().isString().isLength({ min: 2, max: 5 })
  ],
  validate,
  aiController.generateBlogContent
);

// Analysis Routes
router.post(
  '/analyze/content',
  protect,
  analysisRateLimiter,
  [
    body('content').optional().isString().isLength({ min: 10, max: 50000 }),
    body('includeSentiment').optional().isBoolean(),
    body('includeTopics').optional().isBoolean(),
    body('includeReadability').optional().isBoolean(),
    body('includeSEO').optional().isBoolean(),
    body('includeSuggestions').optional().isBoolean()
  ],
  validate,
  aiController.analyzeContent
);

router.post(
  '/analyze/content/:blogId',
  protect,
  analysisRateLimiter,
  [
    param('blogId').isMongoId(),
    body('includeSentiment').optional().isBoolean(),
    body('includeTopics').optional().isBoolean(),
    body('includeReadability').optional().isBoolean(),
    body('includeSEO').optional().isBoolean(),
    body('includeSuggestions').optional().isBoolean()
  ],
  validate,
  aiController.analyzeContent
);

router.post(
  '/analyze/sentiment',
  protect,
  [
    body('content').optional().isString().isLength({ min: 10, max: 50000 })
  ],
  validate,
  aiController.analyzeSentiment
);

router.post(
  '/analyze/sentiment/:blogId',
  protect,
  [
    param('blogId').isMongoId()
  ],
  validate,
  aiController.analyzeSentiment
);

router.post(
  '/analyze/seo',
  protect,
  [
    body('content').optional().isString().isLength({ min: 10, max: 50000 })
  ],
  validate,
  aiController.analyzeSEO
);

router.post(
  '/analyze/seo/:blogId',
  protect,
  [
    param('blogId').isMongoId()
  ],
  validate,
  aiController.analyzeSEO
);

// Utility endpoints
router.post(
  '/stats/content',
  protect,
  [
    body('content').optional().isString().isLength({ min: 1, max: 50000 })
  ],
  validate,
  aiController.getContentStats
);

router.post(
  '/stats/content/:blogId',
  protect,
  [
    param('blogId').isMongoId()
  ],
  validate,
  aiController.getContentStats
);

// ===== ENHANCED AI ROUTES =====
// Mount enhanced AI routes under /enhanced prefix
router.use('/enhanced', aiEnhancedRoutes);

// Error handling for file uploads
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 10MB.',
        error: error.message
      });
    }
    return res.status(400).json({
      message: 'File upload error',
      error: error.message
    });
  }

  if (error.message === 'Only audio files are allowed') {
    return res.status(400).json({
      message: 'Only audio files are allowed',
      error: error.message
    });
  }

  next(error);
});

module.exports = router; 