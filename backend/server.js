import app from './src/app.js';
import { config } from './src/config/env.js';
import { initDatabase } from './src/config/db.js';
import { logger } from './src/utils/logger.js';

async function startServer() {
  try {
    logger.info('Initializing ResearchLens backend...');
    
    // Connect to PostgreSQL and apply migrations
    await initDatabase();

    const server = app.listen(config.PORT, () => {
      logger.info(`ResearchLens API server successfully running on http://localhost:${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Scholarly APIs: OpenAlex (${config.OPENALEX_API_URL}), Crossref (${config.CROSSREF_API_URL})`);
      logger.info(`AI Integration: ${config.GEMINI_API_KEY ? 'Gemini 2.5 API Key Configured' : 'Local Deterministic Extraction Mode (Set GEMINI_API_KEY for live generative calls)'}`);
    });

    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
