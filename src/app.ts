import Fastify, { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { config } from './config/environment';
import { errorHandler } from './middleware/error-handler';
import { transcriptionRoutes } from './routes/transcription.routes';
import { azureTranscriptionRoutes } from './routes/azure-transcription.routes';
import { transcriptionWebSocket } from './websocket/transcription-stream';

/**
 * Creates and configures the Fastify application
 */
export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.app.isDevelopment,
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
      },
    },
  });

  // Register WebSocket plugin
  await app.register(websocket);

  // Health check endpoint
  app.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.nodeEnv,
      azure: {
        configured: config.azure.isConfigured,
      },
    };
  });

  // Root endpoint
  app.get('/', async () => {
    return {
      name: 'AudioFlow API',
      version: '1.0.0',
      description: 'Audio transcription service with mock and Azure Speech-to-Text integration',
      endpoints: {
        health: 'GET /health',
        mockTranscription: 'POST /transcription',
        azureTranscription: 'POST /azure-transcription',
        listTranscriptions: 'GET /transcriptions',
        websocket: 'WS /ws/transcription',
      },
    };
  });

  // Register routes
  await app.register(transcriptionRoutes);
  await app.register(azureTranscriptionRoutes);

  // Register WebSocket route
  app.register(async (fastify) => {
    fastify.get('/ws/transcription', { websocket: true }, transcriptionWebSocket);
  });

  // Register error handler
  app.setErrorHandler(errorHandler as any);

  return app;
}
