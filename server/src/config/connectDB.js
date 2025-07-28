const mongoose = require('mongoose');

const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return mongoose.connection;
  }

  try {
    const mongoURI =
      process.env.MONGO_URI || 'mongodb://localhost:27017/VocalInk';
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    logger.db.connect(conn.connection.host);
    return conn;
  } catch (error) {
    logger.db.error(error);
    throw error;
  }
};

const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    logger.db.disconnect();
  }
};

module.exports = { connectDB, disconnectDB };
