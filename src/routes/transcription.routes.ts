import { FastifyInstance } from 'fastify';
import { transcriptionController } from '../controllers/transcription.controller';
import {
  validateBody,
  validateQuery,
  transcriptionRequestSchema,
  transcriptionsQuerySchema,
} from '../middleware/validation';

/**
 * Transcription routes
 * Handles mock transcription endpoints
 */
export async function transcriptionRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /transcription - Create mock transcription
  fastify.post(
    '/transcription',
    {
      schema: {
        tags: ['transcription'],
        summary: 'Create mock transcription',
        description: 'Download audio from URL (mock) and generate transcription',
        body: {
          type: 'object',
          required: ['audioUrl'],
          properties: {
            audioUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL of the audio file to transcribe',
              example: 'https://example.com/audio.mp3',
            },
          },
        },
        response: {
          201: {
            description: 'Transcription created successfully',
            type: 'object',
            properties: {
              id: { type: 'string', description: 'MongoDB document ID' },
              audioUrl: { type: 'string', description: 'URL of the audio file' },
              transcription: { type: 'string', description: 'Generated transcription text' },
              source: { type: 'string', enum: ['mock'], description: 'Transcription source' },
              createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            },
          },
          400: {
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
          500: {
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
        },
      } as const,
      preHandler: validateBody(transcriptionRequestSchema) as any,
    },
    transcriptionController.createTranscription.bind(transcriptionController) as any,
  );

  // GET /transcriptions - Get recent transcriptions
  fastify.get(
    '/transcriptions',
    {
      schema: {
        tags: ['transcription'],
        summary: 'List transcriptions',
        description: 'Retrieve transcriptions from the last N days with pagination',
        querystring: {
          type: 'object',
          properties: {
            days: {
              type: 'integer',
              default: 30,
              minimum: 1,
              description: 'Number of days to look back (default: 30)',
            },
            page: {
              type: 'integer',
              default: 1,
              minimum: 1,
              description: 'Page number for pagination (default: 1)',
            },
            limit: {
              type: 'integer',
              default: 10,
              minimum: 1,
              maximum: 100,
              description: 'Number of results per page (default: 10, max: 100)',
            },
            source: {
              type: 'string',
              enum: ['mock', 'azure'],
              description: 'Filter by transcription source',
            },
          },
        },
        response: {
          200: {
            description: 'List of transcriptions',
            type: 'object',
            properties: {
              count: { type: 'number', description: 'Total number of transcriptions' },
              page: { type: 'number', description: 'Current page number' },
              limit: { type: 'number', description: 'Results per page' },
              totalPages: { type: 'number', description: 'Total number of pages' },
              transcriptions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    audioUrl: { type: 'string' },
                    transcription: { type: 'string' },
                    source: { type: 'string', enum: ['mock', 'azure'] },
                    language: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          400: {
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
          500: {
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
        },
      } as const,
      preHandler: validateQuery(transcriptionsQuerySchema) as any,
    },
    transcriptionController.getTranscriptions.bind(transcriptionController) as any,
  );
}
