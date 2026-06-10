import app from './app.js';
import logger from './lib/logger.js';

const PORT = 8620;

const server = app.listen(PORT, () => {
  logger.info(`Music player server ready on port ${PORT}`);
  console.log(`Server ready on port ${PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
