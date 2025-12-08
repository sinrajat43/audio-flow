import Fastify, { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config/environment';
import { errorHandler } from './middleware/error-handler';
import { transcriptionRoutes } from './routes/transcription.routes';
import { azureTranscriptionRoutes } from './routes/azure-transcription.routes';
import { transcriptionWebSocket } from './websocket/transcription-stream';
import { swaggerOptions, swaggerUiOptions } from './config/swagger';

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
        // Allow OpenAPI keywords for Swagger documentation
        strict: false,
      },
    },
  });

  // Register Swagger documentation
  await app.register(swagger, swaggerOptions);
  await app.register(swaggerUi, swaggerUiOptions);

  // Register WebSocket plugin
  await app.register(websocket);

  // Health check endpoint
  app.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        description: 'Check API health status',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'number' },
              environment: { type: 'string' },
              azure: {
                type: 'object',
                properties: {
                  configured: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.app.nodeEnv,
        azure: {
          configured: config.azure.isConfigured,
        },
      };
    },
  );

  // Root endpoint
  app.get(
    '/',
    {
      schema: {
        hide: true, // Hide from Swagger docs
      },
    },
    async () => {
      return {
        name: 'AudioFlow API',
        version: '1.0.0',
        description: 'Audio transcription service with mock and Azure Speech-to-Text integration',
        documentation: '/docs',
        endpoints: {
          health: 'GET /health',
          mockTranscription: 'POST /transcription',
          azureTranscription: 'POST /azure-transcription',
          listTranscriptions: 'GET /transcriptions',
          websocket: 'WS /ws/transcription',
        },
      };
    },
  );

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
