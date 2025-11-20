const app = require('./src/app');
const logger = require('./src/utils/logger');
const webSocketService = require('./src/services/WebSocketService');
const { runStartupCleanup } = require('./src/utils/startupCleanup');

const DESIRED_PORT = parseInt(process.env.PORT, 10) || 5000;
const MAX_ATTEMPTS = 10;

// Lightweight health/heartbeat route (non-API)
// app.get('/test', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Server is running',
//     environment: process.env.NODE_ENV || 'development',
//     timestamp: new Date().toISOString(),
//   });
// });

function startServer(startPort = DESIRED_PORT, attemptsLeft = MAX_ATTEMPTS) {
  const server = app.listen(startPort, () => {
    logger.success(`🚀 Server is running on port ${startPort}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API Documentation: http://localhost:${startPort}/api-docs`);
    logger.info(`API Base URL: http://localhost:${startPort}/api`);
    logger.info(`WebSocket URL: ws://localhost:${startPort}/ws`);

    // Initialize WebSocket service after successful listen
    webSocketService.initialize(server);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      logger.error('Port in use:', { port: startPort, message: err.message });
      if (process.env.NODE_ENV !== 'production' && attemptsLeft > 0) {
        const nextPort = startPort + 1;
        logger.warn(`Attempting to use next port ${nextPort} (remaining attempts: ${attemptsLeft - 1})`);
        setTimeout(() => startServer(nextPort, attemptsLeft - 1), 500);
      } else {
        logger.error('Failed to start server due to port conflict');
        process.exit(1);
      }
    } else {
      logger.error('Server startup error:', { message: err?.message, name: err?.name, code: err?.code });
      process.exit(1);
    }
  });
}

async function bootstrap() {
  try {
    await runStartupCleanup();
  } catch (error) {
    logger.warn('Startup cleanup encountered an issue but will not block server start', {
      message: error.message,
    });
  }
  startServer();
}

bootstrap();
