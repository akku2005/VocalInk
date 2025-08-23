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
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    this.initializeRedis();
  }

  async initializeRedis() {
    if (!redis) {
      logger.info('Redis not available, using in-memory cache');
      return;
    }

    try {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          lazyConnect: true
        }
      });
      
      await this.redisClient.connect();
      logger.info('✅ Redis connected for CacheService');
    } catch (error) {
      logger.warn('⚠️ Redis not available for CacheService, using in-memory cache');
      this.redisClient = null;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (this.redisClient) {
        const cached = await this.redisClient.get(key);
        if (cached) {
          this.cacheStats.hits++;
          return JSON.parse(cached);
        }
      } else {
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          this.cacheStats.hits++;
          return cached.data;
        }
        this.memoryCache.delete(key);
      }
      
      this.cacheStats.misses++;
      return null;
    } catch (error) {
      logger.warn('Cache get failed:', error.message);
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
      
      if (this.redisClient) {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
      } else {
        this.memoryCache.set(key, {
          data,
          expiresAt: Date.now() + (ttlSeconds * 1000)
        });
      }
    } catch (error) {
      logger.warn('Cache set failed:', error.message);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    try {
      this.cacheStats.deletes++;
      
      if (this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      logger.warn('Cache delete failed:', error.message);
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMultiple(keys) {
    try {
      this.cacheStats.deletes += keys.length;
      
      if (this.redisClient) {
        await this.redisClient.del(keys);
      } else {
        keys.forEach(key => this.memoryCache.delete(key));
      }
    } catch (error) {
      logger.warn('Cache deleteMultiple failed:', error.message);
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.redisClient) {
        await this.redisClient.flushDb();
      } else {
        this.memoryCache.clear();
      }
      logger.info('Cache cleared successfully');
    } catch (error) {
      logger.warn('Cache clear failed:', error.message);
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
      redisAvailable: !!this.redisClient
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
      if (this.redisClient) {
        await this.redisClient.ping();
        return { status: 'healthy', type: 'redis' };
      } else {
        return { status: 'healthy', type: 'memory' };
      }
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService; 