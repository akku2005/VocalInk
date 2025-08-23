const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const options = {
      // Connection pool
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE) || 2,

      // Timeouts
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 5000,
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
      maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME_MS) || 30000,

      // Retries & write behavior
      retryWrites: true,

      // Mongoose-specific
      bufferCommands: false,
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    logger.success(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { message: err.message, name: err.name, code: err.code });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error during MongoDB shutdown:', { message: err.message, name: err.name, code: err.code });
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    logger.error('Database connection failed:', { message: error.message, name: error.name, code: error.code });
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    // In non-production, continue running without DB
    return null;
  }
};

// Health check for database
const checkDatabaseHealth = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    logger.error('Database health check failed:', { message: error.message, name: error.name, code: error.code });
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

// Get database statistics
const getDatabaseStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      connections: stats.connections,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to get database stats:', { message: error.message, name: error.name, code: error.code });
    return { error: error.message, timestamp: new Date().toISOString() };
  }
};

module.exports = { connectDB, checkDatabaseHealth, getDatabaseStats };
