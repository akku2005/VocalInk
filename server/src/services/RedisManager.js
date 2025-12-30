/**
 * RedisManager - Centralized Redis Connection Management
 * 
 * This singleton manages all Redis connections across the application,
 * providing connection pooling, health checks, and graceful shutdown.
 * 
 * Benefits:
 * - Single source of truth for Redis configuration
 * - Reduced connection overhead (connection reuse)
 * - Consistent error handling and retry logic
 * - Centralized graceful shutdown
 * - Memory fallback support for non-critical operations
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisManager {
  constructor() {
    this.clients = new Map();
    this.isInitialized = false;
    this.connectionConfig = null;
    this.memoryFallback = new Map(); // Fallback for when Redis is unavailable
    this.maxMemoryFallback = parseInt(process.env.MAX_MEMORY_CACHE_SIZE) || 1000;
  }

  /**
   * Build Redis configuration from environment variables
   * Supports both REDIS_URL and individual host/port/password vars
   */
  buildConfig() {
    if (this.connectionConfig) return this.connectionConfig;

    const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES, 10) || 3;
    const retryDelay = parseInt(process.env.REDIS_RETRY_DELAY, 10) || 1000;
    const connectTimeout = parseInt(process.env.REDIS_CONNECT_TIMEOUT, 10) || 5000;
    const redisUrl = process.env.REDIS_URL;

    // Base config options shared by all connection types
    const baseOptions = {
      maxRetriesPerRequest: maxRetries,
      retryStrategy: (times) => {
        if (times > maxRetries) {
          logger.error('Redis max retries exceeded');
          return null; // Stop retrying
        }
        const delay = Math.min(times * retryDelay, 30000);
        logger.info(`Redis reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
      },
      lazyConnect: true,
      enableReadyCheck: true,
      keepAlive: 30000,
      connectTimeout,
      commandTimeout: 5000,
      enableOfflineQueue: true,
    };

    // Parse REDIS_URL if provided
    if (redisUrl) {
      try {
        const parsed = new URL(redisUrl);
        this.connectionConfig = {
          host: parsed.hostname,
          port: parseInt(parsed.port || '6379', 10),
          password: parsed.password || undefined,
          db: parsed.pathname ? parseInt(parsed.pathname.slice(1) || '0', 10) : 0,
          ...baseOptions,
        };
        logger.debug('Redis config built from REDIS_URL');
        return this.connectionConfig;
      } catch (error) {
        logger.warn('Invalid REDIS_URL, falling back to host/port variables', { 
          message: error.message 
        });
      }
    }

    // Fallback to individual environment variables
    this.connectionConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB, 10) || 0,
      ...baseOptions,
    };

    logger.debug('Redis config built from host/port variables');
    return this.connectionConfig;
  }

  /**
   * Get or create a named Redis client
   * Reuses existing connections for the same name
   * 
   * @param {string} name - Unique name for this client (e.g., 'cache', 'queue')
   * @returns {Redis} - ioredis client instance
   */
  getClient(name = 'default') {
    if (this.clients.has(name)) {
      return this.clients.get(name);
    }

    const config = this.buildConfig();
    const client = new Redis(config);

    // Setup event handlers
    client.on('connect', () => {
      logger.info(`Redis client '${name}' connected`);
    });

    client.on('ready', () => {
      logger.info(`Redis client '${name}' ready`);
      this.isInitialized = true;
    });

    client.on('error', (err) => {
      logger.warn(`Redis client '${name}' error:`, { message: err.message });
    });

    client.on('close', () => {
      logger.debug(`Redis client '${name}' connection closed`);
    });

    client.on('reconnecting', (delay) => {
      logger.info(`🔄 Redis client '${name}' reconnecting in ${delay}ms`);
    });

    this.clients.set(name, client);
    return client;
  }

  /**
   * Get a dedicated subscriber client for Pub/Sub
   * Pub/Sub requires a dedicated connection that can't be used for other commands
   * 
   * @param {string} name - Base name for the subscriber
   * @returns {Redis} - ioredis client for subscriptions
   */
  getSubscriber(name = 'default') {
    return this.getClient(`${name}-subscriber`);
  }

  /**
   * Get a dedicated publisher client for Pub/Sub
   * 
   * @param {string} name - Base name for the publisher
   * @returns {Redis} - ioredis client for publishing
   */
  getPublisher(name = 'default') {
    return this.getClient(`${name}-publisher`);
  }

  /**
   * Get Redis configuration for Bull queues
   * Bull manages its own connections, so we just provide the config
   * 
   * @returns {Object} - Redis configuration object for Bull
   */
  getBullConfig() {
    const config = this.buildConfig();
    // Bull uses slightly different config format
    return {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY, 10) || 1000,
    };
  }

  /**
   * Check if any Redis client is connected and ready
   * 
   * @returns {boolean}
   */
  isConnected() {
    for (const client of this.clients.values()) {
      if (client.status === 'ready') {
        return true;
      }
    }
    return false;
  }

  /**
   * Get a specific client's connection status
   * 
   * @param {string} name - Client name
   * @returns {string} - Connection status
   */
  getClientStatus(name = 'default') {
    const client = this.clients.get(name);
    return client ? client.status : 'not_created';
  }

  /**
   * Perform a health check on Redis
   * 
   * @returns {Promise<Object>} - Health status object
   */
  async healthCheck() {
    try {
      const client = this.getClient('health-check');
      
      if (client.status !== 'ready') {
        await client.connect();
      }
      
      const start = Date.now();
      await client.ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        type: 'redis',
        latency: `${latency}ms`,
        connections: this.clients.size,
        clients: Array.from(this.clients.keys()),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        type: 'redis',
        error: error.message,
        fallback: 'memory',
      };
    }
  }

  /**
   * Get statistics about all Redis clients
   * 
   * @returns {Object} - Statistics object
   */
  getStats() {
    const stats = {
      totalClients: this.clients.size,
      clients: {},
      memoryFallbackSize: this.memoryFallback.size,
    };

    for (const [name, client] of this.clients) {
      stats.clients[name] = {
        status: client.status,
        options: {
          host: client.options.host,
          port: client.options.port,
          db: client.options.db,
        },
      };
    }

    return stats;
  }

  // ============================================
  // Memory Fallback Methods (for cache operations)
  // ============================================

  /**
   * Get value from memory fallback
   * Used when Redis is unavailable
   */
  getFromMemory(key) {
    const cached = this.memoryFallback.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      cached.accessTime = Date.now();
      return cached.data;
    }
    if (cached) {
      this.memoryFallback.delete(key);
    }
    return null;
  }

  /**
   * Set value in memory fallback
   */
  setInMemory(key, data, ttlSeconds = 300) {
    // Evict old entries if at capacity
    if (this.memoryFallback.size >= this.maxMemoryFallback) {
      this.evictOldestMemoryEntries();
    }

    this.memoryFallback.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      accessTime: Date.now(),
    });
  }

  /**
   * Delete from memory fallback
   */
  deleteFromMemory(key) {
    this.memoryFallback.delete(key);
  }

  /**
   * Clear all memory fallback entries
   */
  clearMemory() {
    this.memoryFallback.clear();
  }

  /**
   * Evict oldest entries from memory (LRU eviction)
   */
  evictOldestMemoryEntries() {
    const entriesToEvict = Math.ceil(this.maxMemoryFallback * 0.2);
    const entries = Array.from(this.memoryFallback.entries())
      .sort((a, b) => (a[1].accessTime || 0) - (b[1].accessTime || 0))
      .slice(0, entriesToEvict);

    entries.forEach(([key]) => this.memoryFallback.delete(key));
    
    if (entries.length > 0) {
      logger.debug(`Evicted ${entries.length} entries from memory fallback`);
    }
  }

  // ============================================
  // Graceful Shutdown
  // ============================================

  /**
   * Gracefully close all Redis connections
   * Should be called during application shutdown
   */
  async shutdown() {
    logger.info('Shutting down Redis connections...');

    const shutdownPromises = [];

    for (const [name, client] of this.clients) {
      shutdownPromises.push(
        client.quit()
          .then(() => {
            logger.info(` Redis client '${name}' closed`);
          })
          .catch((err) => {
            logger.warn(` Error closing Redis client '${name}':`, { message: err.message });
            // Force disconnect if quit fails
            client.disconnect();
          })
      );
    }

    await Promise.allSettled(shutdownPromises);
    
    this.clients.clear();
    this.memoryFallback.clear();
    this.isInitialized = false;
    this.connectionConfig = null;

    logger.info('All Redis connections closed');
  }

  /**
   * Force disconnect all clients (for emergency shutdown)
   */
  forceDisconnect() {
    for (const [name, client] of this.clients) {
      try {
        client.disconnect();
        logger.info(`Force disconnected Redis client '${name}'`);
      } catch (err) {
        logger.warn(`Error force disconnecting '${name}':`, { message: err.message });
      }
    }
    this.clients.clear();
  }
}

// Singleton instance
const redisManager = new RedisManager();

module.exports = redisManager;
