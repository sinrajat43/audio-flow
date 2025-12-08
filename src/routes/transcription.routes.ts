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
        body: {
          type: 'object',
          required: ['audioUrl'],
          properties: {
            audioUrl: {
              type: 'string',
              format: 'uri',
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              audioUrl: { type: 'string' },
              transcription: { type: 'string' },
              source: { type: 'string' },
              createdAt: { type: 'string' },
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
        querystring: {
          type: 'object',
          properties: {
            days: {
              type: 'number',
              default: 30,
            },
            page: {
              type: 'number',
              default: 1,
            },
            limit: {
              type: 'number',
              default: 10,
            },
            source: {
              type: 'string',
              enum: ['mock', 'azure'],
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              count: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              totalPages: { type: 'number' },
              transcriptions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    audioUrl: { type: 'string' },
                    transcription: { type: 'string' },
                    source: { type: 'string' },
                    language: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
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
