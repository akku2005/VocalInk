const logger = require('../utils/logger');
const redisManager = require('./RedisManager');

class CacheService {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new Map(); // Fallback in-memory cache
    this.maxMemoryCache = parseInt(process.env.MAX_MEMORY_CACHE_SIZE) || 1000;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    this.isInitialized = false;
    this.initializeRedis();
  }

  async initializeRedis() {
    if (process.env.ENABLE_CACHING !== 'true') {
      logger.info('Caching disabled, using in-memory cache');
      return;
    }

    try {
      // Use centralized RedisManager
      this.redisClient = redisManager.getClient('cache');
      
      // Connect if not already connected
      if (this.redisClient.status !== 'ready') {
        await this.redisClient.connect();
      }
      
      this.isInitialized = true;
      logger.info(' CacheService initialized with Redis');
    } catch (error) {
      logger.warn(' Redis connection failed, using in-memory cache:', error.message);
      this.redisClient = null;
    }
  }

  /**
   * Check if Redis is available and ready
   */
  get isRedisReady() {
    return this.redisClient && this.redisClient.status === 'ready';
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (this.isRedisReady) {
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
      
      if (this.isRedisReady) {
        await this.redisClient.setex(key, ttlSeconds, JSON.stringify(data));
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
      
      if (this.isRedisReady) {
        await this.redisClient.del(key);
      }
      // Always delete from memory cache too (dual-write pattern)
      this.memoryCache.delete(key);
    } catch (error) {
      logger.warn('Cache delete failed:', error.message);
      this.memoryCache.delete(key);
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMultiple(keys) {
    try {
      this.cacheStats.deletes += keys.length;
      
      if (this.isRedisReady) {
        await this.redisClient.del(...keys);
      }
      keys.forEach(key => this.memoryCache.delete(key));
    } catch (error) {
      logger.warn('Cache deleteMultiple failed:', error.message);
      keys.forEach(key => this.memoryCache.delete(key));
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.isRedisReady) {
        await this.redisClient.flushdb();
      }
      this.memoryCache.clear();
      logger.info('Cache cleared successfully');
    } catch (error) {
      logger.warn('Cache clear failed:', error.message);
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
      redisAvailable: this.isRedisReady,
      cacheType: this.isRedisReady ? 'redis' : 'memory'
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
      if (this.isRedisReady) {
        await this.redisClient.ping();
        return { 
          status: 'healthy', 
          type: 'redis',
          connection: 'active'
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
   * Graceful shutdown - now delegated to RedisManager
   */
  async shutdown() {
    // RedisManager handles the actual connection cleanup
    // Just clear local state
    this.memoryCache.clear();
    logger.info('CacheService shutdown complete');
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService; 