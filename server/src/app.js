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
connectDB().then(() => {
  logger.success('Application initialized successfully');
}).catch(err => {
  logger.error('Failed to initialize application:', err.message);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json());

// Custom morgan format with colors
morgan.token('status-color', (req, res) => {
  const status = res.statusCode;
  const color = status >= 500 ? 31 : status >= 400 ? 33 : status >= 300 ? 36 : 32;
  return `\x1b[${color}m${status}\x1b[0m`;
});

app.use(morgan(':method :url :status-color :res[content-length] - :response-time ms'));

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
logger.info('Swagger documentation available at /api-docs');

// API routes
app.use('/api', apiRouter);
logger.info('API routes mounted at /api');

module.exports = app; 