const logger = require('../utils/logger');

// Optional Redis import with fallback
let redis = null;
try {
  redis = require('redis');
} catch (error) {
  logger.warn('Redis module not found, using in-memory cache fallback');
}

class CacheService {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new Map(); // Fallback in-memory cache
    this.maxMemoryCache = parseInt(process.env.MAX_MEMORY_CACHE_SIZE) || 1000; // Prevent memory leaks
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    this.redisRetryCount = 0;
    this.maxRetries = parseInt(process.env.REDIS_MAX_RETRIES) || 3;
    this.retryDelay = parseInt(process.env.REDIS_RETRY_DELAY) || 2000;
    this.connectionTimeout = parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 5000;
    this.reconnectTimer = null;
    this.initializeRedis();
  }

  async initializeRedis() {
    if (!redis || process.env.ENABLE_CACHING !== 'true') {
      logger.info('Redis not available or disabled, using in-memory cache');
      return;
    }

    try {
      const redisConfig = {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB) || 0,
        socket: {
          connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 5000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              logger.error('Redis max retries exceeded, using memory cache');
              return false;
            }
            return Math.min(retries * this.retryDelay, 30000);
          }
        }
      };
      
      this.redisClient = redis.createClient(redisConfig);
      
      // Handle Redis events
      this.redisClient.on('connect', () => {
        logger.info('✅ Redis connection established');
        this.redisRetryCount = 0;
      });
      
      this.redisClient.on('error', (error) => {
        logger.warn('Redis connection error:', error.message);
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
          this.redisRetryCount++;
          if (this.redisRetryCount > this.maxRetries) {
            logger.error('Redis connection failed permanently, falling back to memory cache');
            this.redisClient = null;
          }
        }
      });
      
      this.redisClient.on('ready', () => {
        logger.info('✅ Redis ready for CacheService');
      });
      
      this.redisClient.on('reconnecting', () => {
        logger.info('🔄 Redis reconnecting...');
      });
      
      await this.redisClient.connect();
    } catch (error) {
      logger.warn('⚠️ Redis connection failed, using in-memory cache:', error.message);
      this.redisClient = null;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (this.redisClient && this.redisClient.isReady) {
        const cached = await this.redisClient.get(key);
        if (cached) {
          this.cacheStats.hits++;
          const { secureJSONParse } = require('../utils/secureParser');
          return secureJSONParse(cached, { maxLength: 10000 }) || null;
        }
      } else {
        // Check memory cache
        const cached = this.memoryCache.get(key);
        if (cached) {
          if (cached.expiresAt > Date.now()) {
            this.cacheStats.hits++;
            // Update access time for LRU eviction
            cached.accessTime = Date.now();
            return cached.data;
          } else {
            // Clean up expired entry
            this.memoryCache.delete(key);
          }
        }
      }
      
      this.cacheStats.misses++;
      return null;
    } catch (error) {
      logger.warn('Cache get failed:', error.message);
      // Fallback to memory cache if Redis fails
      const cached = this.memoryCache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        this.cacheStats.hits++;
        cached.accessTime = Date.now();
        return cached.data;
      }
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, data, ttlSeconds = 300) {
    try {
      this.cacheStats.sets++;
      
      if (this.redisClient && this.redisClient.isReady) {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
      } else {
        // Memory cache with size limit to prevent memory leaks
        if (this.memoryCache.size >= this.maxMemoryCache) {
          this.evictOldestMemoryCacheEntries();
        }
        
        this.memoryCache.set(key, {
          data,
          expiresAt: Date.now() + (ttlSeconds * 1000),
          accessTime: Date.now()
        });
      }
    } catch (error) {
      logger.warn('Cache set failed:', error.message);
      // Fallback to memory cache if Redis fails
      if (this.memoryCache.size >= this.maxMemoryCache) {
        this.evictOldestMemoryCacheEntries();
      }
      this.memoryCache.set(key, {
        data,
        expiresAt: Date.now() + (ttlSeconds * 1000),
        accessTime: Date.now()
      });
    }
  }

  /**
   * Evict oldest entries from memory cache (LRU)
   */
  evictOldestMemoryCacheEntries() {
    const entriesToEvict = Math.ceil(this.maxMemoryCache * 0.2); // Evict 20% when full
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => (a[1].accessTime || 0) - (b[1].accessTime || 0))
      .slice(0, entriesToEvict);
    
    entries.forEach(([key]) => this.memoryCache.delete(key));
    this.cacheStats.evictions += entries.length;
    
    if (entries.length > 0) {
      logger.debug(`Evicted ${entries.length} entries from memory cache`);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    try {
      this.cacheStats.deletes++;
      
      if (this.redisClient && this.redisClient.isReady) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      logger.warn('Cache delete failed:', error.message);
      // Fallback to memory cache
      this.memoryCache.delete(key);
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMultiple(keys) {
    try {
      this.cacheStats.deletes += keys.length;
      
      if (this.redisClient && this.redisClient.isReady) {
        await this.redisClient.del(keys);
      } else {
        keys.forEach(key => this.memoryCache.delete(key));
      }
    } catch (error) {
      logger.warn('Cache deleteMultiple failed:', error.message);
      // Fallback to memory cache
      keys.forEach(key => this.memoryCache.delete(key));
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.redisClient && this.redisClient.isReady) {
        await this.redisClient.flushDb();
      } else {
        this.memoryCache.clear();
      }
      logger.info('Cache cleared successfully');
    } catch (error) {
      logger.warn('Cache clear failed:', error.message);
      // Fallback to memory cache
      this.memoryCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? (this.cacheStats.hits / total * 100).toFixed(2) : 0;
    
    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      totalRequests: total,
      memoryCacheSize: this.memoryCache.size,
      maxMemoryCache: this.maxMemoryCache,
      redisAvailable: !!(this.redisClient && this.redisClient.isReady),
      redisRetries: this.redisRetryCount,
      cacheType: this.redisClient && this.redisClient.isReady ? 'redis' : 'memory'
    };
  }

  /**
   * Cache wrapper for functions
   */
  async cacheFunction(key, fn, ttlSeconds = 300) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  /**
   * Generate cache key
   */
  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (this.redisClient && this.redisClient.isReady) {
        await this.redisClient.ping();
        return { 
          status: 'healthy', 
          type: 'redis',
          connection: 'active',
          retries: this.redisRetryCount
        };
      } else {
        return { 
          status: 'healthy', 
          type: 'memory',
          connection: 'fallback',
          size: this.memoryCache.size,
          maxSize: this.maxMemoryCache
        };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message,
        type: 'memory',
        fallback: true
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        logger.info('Redis connection closed gracefully');
      }
    } catch (error) {
      logger.warn('Error closing Redis connection:', error.message);
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService; 