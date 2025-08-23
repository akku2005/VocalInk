#!/usr/bin/env node

const cluster = require('cluster');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Production startup script with clustering support
class ProductionServer {
  constructor() {
    this.config = require('./src/config/production');
    this.workers = new Map();
    this.isShuttingDown = false;
  }

  /**
   * Start the production server
   */
  async start() {
    try {
      console.log('🚀 Starting VocalInk Production Server...');
      console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`Node Version: ${process.version}`);
      console.log(`Platform: ${os.platform()} ${os.arch()}`);
      console.log(`CPU Cores: ${os.cpus().length}`);
      console.log(`Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`);

      // Set production environment variables
      process.env.NODE_ENV = 'production';
      
      // Enable production optimizations
      this.enableProductionOptimizations();

      // Check if clustering is enabled
      if (this.config.performance.clustering.enabled) {
        await this.startWithClustering();
      } else {
        await this.startSingleInstance();
      }

    } catch (error) {
      console.error('❌ Failed to start production server:', error);
      process.exit(1);
    }
  }

  /**
   * Enable production optimizations
   */
  enableProductionOptimizations() {
    // Set memory limits
    if (this.config.performance.memory.maxHeapSize) {
      const v8 = require('v8');
      const maxHeapSize = this.parseMemorySize(this.config.performance.memory.maxHeapSize);
      v8.setFlagsFromString(`--max-old-space-size=${maxHeapSize}`);
    }

    // Enable garbage collection monitoring
    if (this.config.performance.memory.gcInterval) {
      setInterval(() => {
        if (global.gc) {
          global.gc();
        }
      }, this.config.performance.memory.gcInterval);
    }

    // Set process limits
    process.setMaxListeners(0);
    process.setUncaughtExceptionCaptureCallback(this.handleUncaughtException.bind(this));
    process.setUnhandledRejectionCaptureCallback(this.handleUnhandledRejection.bind(this));

    // Handle signals
    process.on('SIGTERM', this.handleShutdown.bind(this));
    process.on('SIGINT', this.handleShutdown.bind(this));
    process.on('SIGUSR2', this.handleGracefulReload.bind(this));

    console.log('✅ Production optimizations enabled');
  }

  /**
   * Start with clustering
   */
  async startWithClustering() {
    if (cluster.isPrimary) {
      console.log('🔄 Starting with clustering...');
      
      const numWorkers = this.config.performance.clustering.workers;
      console.log(`📊 Spawning ${numWorkers} worker processes...`);

      // Spawn workers
      for (let i = 0; i < numWorkers; i++) {
        await this.spawnWorker();
      }

      // Monitor workers
      this.monitorWorkers();

      // Handle worker messages
      cluster.on('message', this.handleWorkerMessage.bind(this));

      console.log(`✅ Master process started with ${numWorkers} workers`);

    } else {
      // Worker process
      await this.startWorker();
    }
  }

  /**
   * Start single instance
   */
  async startSingleInstance() {
    console.log('🔄 Starting single instance...');
    
    // Import and start the app
    const app = require('./src/app');
    const server = app.listen(this.config.server.port, this.config.server.host, () => {
      console.log(`✅ Server running on ${this.config.server.host}:${this.config.server.port}`);
      console.log(`📊 Process ID: ${process.pid}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    this.setupGracefulShutdown(server);
  }

  /**
   * Spawn a worker process
   */
  async spawnWorker() {
    try {
      const worker = cluster.fork();
      
      this.workers.set(worker.id, {
        id: worker.id,
        pid: worker.process.pid,
        startTime: Date.now(),
        status: 'starting'
      });

      // Handle worker events
      worker.on('online', () => {
        console.log(`🟢 Worker ${worker.id} (PID: ${worker.process.pid}) is online`);
        this.workers.get(worker.id).status = 'online';
      });

      worker.on('message', (message) => {
        this.handleWorkerMessage(worker, message);
      });

      worker.on('exit', (code, signal) => {
        console.log(`🔴 Worker ${worker.id} (PID: ${worker.process.pid}) exited with code ${code} and signal ${signal}`);
        this.workers.delete(worker.id);
        
        // Restart worker if not shutting down
        if (!this.isShuttingDown && !worker.exitedAfterDisconnect) {
          console.log(`🔄 Restarting worker ${worker.id}...`);
          setTimeout(() => this.spawnWorker(), 1000);
        }
      });

      worker.on('error', (error) => {
        console.error(`❌ Worker ${worker.id} error:`, error);
        this.workers.get(worker.id).status = 'error';
      });

      return worker;
    } catch (error) {
      console.error(`❌ Failed to spawn worker:`, error);
      throw error;
    }
  }

  /**
   * Start worker process
   */
  async startWorker() {
    try {
      console.log(`🔄 Worker ${process.pid} starting...`);
      
      // Import and start the app
      const app = require('./src/app');
      const server = app.listen(this.config.server.port, this.config.server.host, () => {
        console.log(`✅ Worker ${process.pid} running on ${this.config.server.host}:${this.config.server.port}`);
        
        // Notify master that worker is ready
        if (process.send) {
          process.send({ type: 'worker_ready', pid: process.pid });
        }
      });

      // Graceful shutdown for worker
      this.setupGracefulShutdown(server);

    } catch (error) {
      console.error(`❌ Worker ${process.pid} failed to start:`, error);
      process.exit(1);
    }
  }

  /**
   * Monitor workers
   */
  monitorWorkers() {
    setInterval(() => {
      const stats = {
        total: this.workers.size,
        online: Array.from(this.workers.values()).filter(w => w.status === 'online').length,
        starting: Array.from(this.workers.values()).filter(w => w.status === 'starting').length,
        error: Array.from(this.workers.values()).filter(w => w.status === 'error').length
      };

      console.log(`📊 Worker Stats: ${stats.online}/${stats.total} online, ${stats.starting} starting, ${stats.error} errors`);

      // Check for stuck workers
      const now = Date.now();
      for (const [id, worker] of this.workers) {
        if (worker.status === 'starting' && (now - worker.startTime) > 30000) {
          console.warn(`⚠️ Worker ${id} stuck in starting state for ${Math.round((now - worker.startTime) / 1000)}s`);
        }
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Handle worker messages
   */
  handleWorkerMessage(worker, message) {
    if (message.type === 'worker_ready') {
      console.log(`✅ Worker ${worker.id} (PID: ${message.pid}) is ready`);
      this.workers.get(worker.id).status = 'ready';
    } else if (message.type === 'worker_error') {
      console.error(`❌ Worker ${worker.id} reported error:`, message.error);
      this.workers.get(worker.id).status = 'error';
    } else if (message.type === 'worker_stats') {
      // Handle worker statistics
      this.workers.get(worker.id).stats = message.stats;
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown(server) {
    const gracefulShutdown = async (signal) => {
      console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
      
      this.isShuttingDown = true;

      // Stop accepting new connections
      server.close(() => {
        console.log('✅ HTTP server closed');
      });

      // Close database connections
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
          console.log('✅ Database connection closed');
        }
      } catch (error) {
        console.warn('⚠️ Error closing database connection:', error.message);
      }

      // Close Redis connections
      try {
        const Redis = require('ioredis');
        if (global.redisClient) {
          await global.redisClient.quit();
          console.log('✅ Redis connection closed');
        }
      } catch (error) {
        console.warn('⚠️ Error closing Redis connection:', error.message);
      }

      // Close other connections
      try {
        if (global.webSocketService) {
          global.webSocketService.close();
          console.log('✅ WebSocket service closed');
        }
      } catch (error) {
        console.warn('⚠️ Error closing WebSocket service:', error.message);
      }

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Handle uncaught exceptions
   */
  handleUncaughtException(error) {
    console.error('❌ Uncaught Exception:', error);
    
    // Log to file if available
    try {
      const fs = require('fs');
      const logDir = path.join(__dirname, 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = path.join(logDir, 'uncaught-exceptions.log');
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] Uncaught Exception: ${error.stack}\n\n`;
      
      fs.appendFileSync(logFile, logEntry);
    } catch (logError) {
      console.error('Failed to log uncaught exception:', logError);
    }

    // Graceful shutdown
    this.handleShutdown();
  }

  /**
   * Handle unhandled rejections
   */
  handleUnhandledRejection(reason, promise) {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    
    // Log to file if available
    try {
      const fs = require('fs');
      const logDir = path.join(__dirname, 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = path.join(logDir, 'unhandled-rejections.log');
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] Unhandled Rejection: ${reason}\nPromise: ${promise}\n\n`;
      
      fs.appendFileSync(logFile, logEntry);
    } catch (logError) {
      console.error('Failed to log unhandled rejection:', logError);
    }
  }

  /**
   * Handle shutdown signal
   */
  handleShutdown() {
    if (this.isShuttingDown) return;
    
    console.log('\n🔄 Shutting down...');
    this.isShuttingDown = true;

    if (cluster.isPrimary) {
      // Disconnect all workers
      for (const [id, worker] of this.workers) {
        console.log(`🔄 Disconnecting worker ${id}...`);
        worker.disconnect();
      }

      // Force exit after timeout
      setTimeout(() => {
        console.log('⚠️ Force exit after timeout');
        process.exit(1);
      }, 10000);
    } else {
      // Worker process
      process.exit(0);
    }
  }

  /**
   * Handle graceful reload
   */
  handleGracefulReload() {
    console.log('\n🔄 Graceful reload requested...');
    
    if (cluster.isPrimary) {
      // Reload all workers
      for (const [id, worker] of this.workers) {
        console.log(`🔄 Reloading worker ${id}...`);
        worker.disconnect();
      }
    }
  }

  /**
   * Parse memory size string
   */
  parseMemorySize(size) {
    const units = { 'B': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024 };
    const match = size.match(/^(\d+)([KMGT]?B)$/i);
    
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toUpperCase();
      return Math.floor(value * units[unit] / 1024 / 1024); // Convert to MB
    }
    
    return 1024; // Default to 1GB
  }
}

// Start the production server
const productionServer = new ProductionServer();
productionServer.start().catch(error => {
  console.error('❌ Failed to start production server:', error);
  process.exit(1);
}); 