import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

export const swaggerOptions: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: 'AudioFlow API',
      description: 'Audio transcription API service with mock and Azure Speech-to-Text integration',
      version: '1.0.0',
      contact: {
        name: 'AudioFlow',
        email: 'support@audioflow.dev',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.audioflow.dev',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'health',
        description: 'Health check endpoints',
      },
      {
        name: 'transcription',
        description: 'Mock transcription endpoints',
      },
      {
        name: 'azure',
        description: 'Azure Speech-to-Text endpoints',
      },
      {
        name: 'websocket',
        description: 'WebSocket streaming endpoints',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                statusCode: { type: 'number' },
              },
            },
          },
        },
        TranscriptionResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'MongoDB document ID' },
            audioUrl: { type: 'string', format: 'uri' },
            transcription: { type: 'string' },
            source: { type: 'string', enum: ['mock', 'azure'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TranscriptionList: {
          type: 'object',
          properties: {
            count: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
            transcriptions: {
              type: 'array',
              items: { $ref: '#/components/schemas/TranscriptionResponse' },
            },
          },
        },
        HealthResponse: {
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
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
};
