const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectDB } = require('./config/connectDB');
const apiRouter = require('./routes');
const swaggerDocument = require('../swagger.json');
const swaggerUi = require('swagger-ui-express');

// Optional: Use logger if available
let logger = console;
try {
  logger = require('./utils/logger');
} catch (e) {}

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB().then(() => logger.info('Database connected')).catch(err => logger.error(err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API documentation
app.use('/api-docs',swaggerUi.serve,swaggerUi.setup(swaggerDocument));

// API routes
app.use('/api', apiRouter);

module.exports = app; 