const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'password',
    from: process.env.EMAIL_FROM || 'no-reply@example.com',
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    baseUrl: 'https://api.elevenlabs.io/v1',
    defaultVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
    defaultSettings: {
      stability: 0.5,
      similarityBoost: 0.5,
      style: 0.0,
      useSpeakerBoost: true
    }
  },
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: (() => {
      try {
        if (process.env.GOOGLE_CLOUD_CREDENTIALS && process.env.GOOGLE_CLOUD_CREDENTIALS.trim().startsWith('{')) {
          return JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
        }
        return null;
      } catch (error) {
        console.warn('⚠️  Google Cloud credentials not properly configured. Google Cloud TTS will be disabled.');
        console.warn('   To enable Google Cloud TTS, set GOOGLE_CLOUD_CREDENTIALS with valid service account JSON.');
        return null;
      }
    })(),
    defaultVoice: {
      languageCode: 'en-US',
      name: 'en-US-Standard-A',
      ssmlGender: 'FEMALE'
    },
    defaultSettings: {
      speakingRate: 1.0,
      pitch: 0.0,
      volumeGainDb: 0.0,
      effectsProfileId: []
    }
  },
  ttsStorage: {
    provider: process.env.TTS_STORAGE_PROVIDER || 'local', // 'local' | 'b2' (S3-compatible) | 'b2_native'
    // Backblaze B2 S3-compatible config
    b2: {
      enabled: process.env.TTS_STORAGE_PROVIDER === 'b2',
      region: process.env.B2_S3_REGION || 'us-east-005',
      endpoint: process.env.B2_S3_ENDPOINT || 's3.us-east-005.backblazeb2.com',
      bucket: process.env.B2_S3_BUCKET,
      keyId: process.env.B2_S3_KEY_ID,
      appKey: process.env.B2_S3_APP_KEY,
      public: process.env.B2_S3_PUBLIC === 'true',
      signedUrlTtlSeconds: parseInt(process.env.B2_SIGNED_URL_TTL || '3600', 10),
    },
    // Backblaze B2 Native API config (works with Application Keys and b2_authorize_account)
    b2Native: {
      enabled: process.env.TTS_STORAGE_PROVIDER === 'b2_native',
      keyId: process.env.B2_NATIVE_KEY_ID,
      appKey: process.env.B2_NATIVE_APP_KEY,
      bucketName: process.env.B2_NATIVE_BUCKET,
      bucketId: process.env.B2_NATIVE_BUCKET_ID, // optional; will be resolved if not provided
      signedUrlTtlSeconds: parseInt(process.env.B2_NATIVE_SIGNED_URL_TTL || '3600', 10),
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret',
    accessExpiration: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    resetExpiration: process.env.JWT_RESET_EXPIRES_IN || '24h',
    verificationExpiration: process.env.JWT_VERIFICATION_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'akash',
    audience: process.env.JWT_AUDIENCE || 'akash',
  },
  security: {
    login: { maxAttempts: 10 },
    passwordReset: { maxAttempts: 5 },
    verification: { maxAttempts: 5 },
    resetToken: { length: 32 },
    rateLimits: {
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5,
        message: 'Too many authentication attempts, please try again later',
      },
      sensitive: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10,
        message: 'Too many sensitive operations, please try again later',
      },
    },
    token: {
      types: {
        ACCESS: 'access',
        REFRESH: 'refresh',
        RESET: 'reset',
        VERIFICATION: 'verification',
      },
      expiresIn: {
        access: '15m',
        refresh: '7d',
        reset: '1h',
        verification: '10m',
      },
      issuer: process.env.JWT_ISSUER || 'vocalink',
      audience: process.env.JWT_AUDIENCE || 'vocalink_users',
    },
  },
};
