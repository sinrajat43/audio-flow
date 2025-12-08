import { createApp } from './app';
import { connectDatabase } from './config/database';
import { config } from './config/environment';
import { logInfo, logError } from './utils/logger';

/**
 * Start the server
 */
async function start(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Create and configure the app
    const app = await createApp();

    // Start listening
    await app.listen({
      port: config.app.port,
      host: '0.0.0.0',
    });

    logInfo(`Server started successfully`, {
      port: config.app.port,
      environment: config.app.nodeEnv,
      azureConfigured: config.azure.isConfigured,
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logInfo(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  start();
}

export { start };
