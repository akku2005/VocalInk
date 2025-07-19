const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        logger.info('Using existing database connection');
        return mongoose.connection;
    }

    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/umd';
        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        isConnected = true;
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        logger.error(`MongoDB connection error: ${error.message}`);
        throw error;
    }
};

const disconnectDB = async () => {
    if (isConnected) {
        await mongoose.connection.close();
        isConnected = false;
        logger.info('MongoDB connection closed');
    }
};

module.exports = { connectDB, disconnectDB }; 