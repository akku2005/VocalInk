const path = require('path');

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    trustProxy: true,
    compression: true,
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-CSRF-Token',
        'X-Session-Token',
        'X-Device-Fingerprint',
        'X-Correlation-ID',
      ],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Rate-Limit-Remaining'],
      maxAge: 86400
    }
  },

  // Database Configuration
  database: {
    uri: process.env.MONGO_URI,
    options: {
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 20,
      minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE) || 5,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      bufferCommands: false,
      autoIndex: false, // Disable auto-indexing in production
      readPreference: 'secondaryPreferred', // Read from secondary in production
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 10000
      }
    },
    indexes: {
      background: true, // Create indexes in background
      maxTimeMS: 300000 // 5 minutes max for index creation
    }
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
    options: {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxClient: parseInt(process.env.REDIS_MAX_CLIENTS) || 50,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined
    }
  },

  // Security Configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      ieNoOpen: true,
      noSniff: true,
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    },
    rateLimiting: {
      general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.GENERAL_RATE_LIMIT_MAX) || 100,
        standardHeaders: true,
        legacyHeaders: false
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5
      },
      api: {
        windowMs: 15 * 60 * 1000,
        max: parseInt(process.env.API_RATE_LIMIT_MAX) || 200
      },
      ai: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: parseInt(process.env.AI_RATE_LIMIT_PER_HOUR) || 100
      }
    },
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-CSRF-Token',
        'X-Session-Token',
        'X-Device-Fingerprint',
        'X-Correlation-ID'
      ],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Rate-Limit-Remaining'],
      maxAge: 86400
    }
  },

  // AI Services Configuration
  ai: {
    machineLearning: {
      enabled: process.env.AI_ML_ENABLED === 'true',
      modelPath: process.env.AI_MODEL_PATH || path.join(__dirname, '../../models'),
      tensorflowBackend: 'tensorflow',
      maxConcurrentModels: parseInt(process.env.AI_MAX_CONCURRENT_MODELS) || 3,
      modelCacheSize: parseInt(process.env.AI_MODEL_CACHE_SIZE) || 100,
      trainingEnabled: process.env.AI_TRAINING_ENABLED === 'true'
    },
    services: {
      sentiment: {
        enabled: process.env.AI_SENTIMENT_ENABLED === 'true',
        modelType: 'neural_network',
        confidenceThreshold: parseFloat(process.env.AI_SENTIMENT_CONFIDENCE_THRESHOLD) || 0.7
      },
      topicClassification: {
        enabled: process.env.AI_TOPIC_CLASSIFICATION_ENABLED === 'true',
        modelType: 'neural_network',
        confidenceThreshold: parseFloat(process.env.AI_TOPIC_CONFIDENCE_THRESHOLD) || 0.6
      },
      contentQuality: {
        enabled: process.env.AI_CONTENT_QUALITY_ENABLED === 'true',
        modelType: 'neural_network',
        confidenceThreshold: parseFloat(process.env.AI_QUALITY_CONFIDENCE_THRESHOLD) || 0.7
      }
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    transports: {
      file: {
        enabled: true,
        filename: process.env.LOG_FILE || 'logs/app.log',
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
        tailable: true
      },
      console: {
        enabled: process.env.LOG_CONSOLE_ENABLED !== 'false'
      }
    },
    morgan: {
      enabled: true,
      format: 'combined',
      skip: (req, res) => res.statusCode < 400
    }
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.ENABLE_MONITORING === 'true',
    healthCheck: {
      enabled: true,
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
      timeout: 5000
    },
    metrics: {
      enabled: process.env.ENABLE_METRICS === 'true',
      collectInterval: parseInt(process.env.METRICS_COLLECT_INTERVAL) || 60000
    },
    sentry: {
      enabled: !!process.env.SENTRY_DSN,
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
      environment: process.env.NODE_ENV || 'production'
    }
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES ? process.env.ALLOWED_FILE_TYPES.split(',') : [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ],
    uploadPath: process.env.UPLOAD_PATH || 'uploads',
    enableScanning: process.env.ENABLE_FILE_SCANNING === 'true',
    enableValidation: process.env.ENABLE_FILE_VALIDATION === 'true',
    maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST) || 5
  },

  // TTS Configuration
  tts: {
    queue: {
      enabled: process.env.TTS_QUEUE_ENABLED === 'true',
      maxConcurrentJobs: parseInt(process.env.TTS_MAX_CONCURRENT_JOBS) || 5,
      jobTimeout: parseInt(process.env.TTS_JOB_TIMEOUT) || 300000,
      retryAttempts: parseInt(process.env.TTS_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.TTS_RETRY_DELAY) || 2000
    },
    storage: {
      provider: process.env.TTS_STORAGE_PROVIDER || 'local',
      local: {
        path: process.env.TTS_LOCAL_PATH || 'public/tts',
        maxAge: process.env.TTS_LOCAL_MAX_AGE || '1d'
      },
      cloud: {
        provider: process.env.TTS_CLOUD_PROVIDER || 'b2',
        bucket: process.env.TTS_CLOUD_BUCKET,
        region: process.env.TTS_CLOUD_REGION,
        credentials: process.env.TTS_CLOUD_CREDENTIALS
      }
    },
    cleanup: {
      enabled: process.env.ENABLE_TTS_CLEANUP === 'true',
      retentionHours: parseInt(process.env.TTS_FILE_RETENTION_HOURS) || 24,
      interval: 24 * 60 * 60 * 1000 // 24 hours
    }
  },

  // Cache Configuration
  cache: {
    enabled: process.env.ENABLE_CACHING === 'true',
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    maxKeys: parseInt(process.env.CACHE_MAX_KEYS) || 1000,
    strategies: {
      user: {
        ttl: 1800, // 30 minutes
        maxKeys: 100
      },
      content: {
        ttl: 3600, // 1 hour
        maxKeys: 500
      },
      ai: {
        ttl: 600, // 10 minutes
        maxKeys: 200
      }
    }
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET,
    cookie: {
      secure: process.env.SESSION_COOKIE_SECURE === 'true',
      httpOnly: process.env.SESSION_COOKIE_HTTPONLY !== 'false',
      sameSite: process.env.SESSION_COOKIE_SAMESITE || 'strict',
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000
    },
    resave: process.env.SESSION_RESAVE === 'true',
    saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED === 'true',
    store: {
      type: process.env.SESSION_STORE || 'redis',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_SESSION_DB) || 1
      }
    }
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'noreply@vocalink.com',
    support: process.env.EMAIL_SUPPORT || 'support@vocalink.com',
    templates: {
      path: process.env.EMAIL_TEMPLATES_PATH || 'src/templates/email',
      engine: 'handlebars'
    },
    queue: {
      enabled: process.env.EMAIL_QUEUE_ENABLED === 'true',
      maxConcurrent: parseInt(process.env.EMAIL_MAX_CONCURRENT) || 5,
      retryAttempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS) || 3
    }
  },

  // Performance Configuration
  performance: {
    compression: {
      enabled: process.env.ENABLE_COMPRESSION === 'true',
      level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
      threshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024
    },
    clustering: {
      enabled: process.env.ENABLE_CLUSTERING === 'true',
      workers: parseInt(process.env.CLUSTER_WORKERS) || require('os').cpus().length
    },
    memory: {
      maxHeapSize: process.env.MAX_HEAP_SIZE || '1G',
      gcInterval: parseInt(process.env.GC_INTERVAL) || 30000
    }
  }
}; 