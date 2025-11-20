const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { secureJSONParse } = require('../utils/secureParser');

dotenv.config();

const ENV_FILE_PATH = path.resolve(__dirname, '../../.env');
const GOOGLE_CREDENTIALS_PARSE_OPTIONS = {
  maxLength: 5000,
  validateSchema: (data) => typeof data === 'object' && data !== null && data.type === 'service_account'
};

const stripInlineComment = (value = '') => {
  if (!value || typeof value !== 'string') return null;
  const hashIndex = value.indexOf('#');
  const sanitized = (hashIndex >= 0 ? value.slice(0, hashIndex) : value).trim();
  return sanitized || null;
};

const readMultilineEnvBlock = (key) => {
  try {
    if (!fs.existsSync(ENV_FILE_PATH)) return null;
    const lines = fs.readFileSync(ENV_FILE_PATH, 'utf8').split(/\r?\n/);
    const block = [];
    let capturing = false;
    let depth = 0;

    for (const line of lines) {
      if (!capturing) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith(`${key}=`)) {
          const payload = line.slice(line.indexOf('=') + 1);
          if (!payload.trim().startsWith('{')) {
            continue;
          }
          capturing = true;
          block.push(payload);
          depth += (payload.match(/{/g) || []).length;
          depth -= (payload.match(/}/g) || []).length;
          if (depth <= 0) {
            break;
          }
        }
      } else {
        block.push(line);
        depth += (line.match(/{/g) || []).length;
        depth -= (line.match(/}/g) || []).length;
        if (depth <= 0) {
          break;
        }
      }
    }

    if (!block.length) {
      return null;
    }

    const reconstructed = block.join('\n').trim();
    return reconstructed.startsWith('{') ? reconstructed : null;
  } catch (error) {
    console.warn(`Failed to rebuild multi-line ${key} from .env:`, error.message);
    return null;
  }
};

const loadCredentialsFromFile = (filePath) => {
  if (!filePath) return null;
  try {
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolvedPath)) {
      console.warn('Google Cloud credentials file not found at', resolvedPath);
      return null;
    }

    const content = fs.readFileSync(resolvedPath, 'utf8');
    return secureJSONParse(content, GOOGLE_CREDENTIALS_PARSE_OPTIONS);
  } catch (error) {
    console.warn('Failed to load Google Cloud credentials file:', error.message);
    return null;
  }
};

const getGoogleCloudCredentials = () => {
  const fileOverride = process.env.GOOGLE_CLOUD_CREDENTIALS_PATH || process.env.GOOGLE_CLOUD_CREDENTIALS_FILE;
  if (fileOverride) {
    const parsed = loadCredentialsFromFile(fileOverride);
    if (parsed) {
      return parsed;
    }
  }

  const raw = process.env.GOOGLE_CLOUD_CREDENTIALS;
  if (!raw) return null;

  let candidate = raw.trim();
  if (!candidate.startsWith('{') || !candidate.endsWith('}')) {
    const reconstructed = readMultilineEnvBlock('GOOGLE_CLOUD_CREDENTIALS');
    if (reconstructed) {
      candidate = reconstructed;
    }
  }

  if (!candidate.trim().startsWith('{')) {
    return null;
  }

  const parsed = secureJSONParse(candidate, GOOGLE_CREDENTIALS_PARSE_OPTIONS);
  if (parsed) {
    return parsed;
  }

  console.warn('Google Cloud credentials appear to be invalid JSON.');
  return null;
};

const googleCredentials = getGoogleCloudCredentials();

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
    projectId: stripInlineComment(process.env.GOOGLE_CLOUD_PROJECT_ID),
    credentials: googleCredentials,
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
    secret: process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'CHANGE_THIS_IN_PRODUCTION',
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
