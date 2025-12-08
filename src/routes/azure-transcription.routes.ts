import { FastifyInstance } from 'fastify';
import { azureTranscriptionController } from '../controllers/azure-transcription.controller';
import {
  validateBody,
  azureTranscriptionRequestSchema,
} from '../middleware/validation';

/**
 * Azure transcription routes
 * Handles Azure Speech-to-Text integration
 */
export async function azureTranscriptionRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /azure-transcription - Create Azure transcription
  fastify.post(
    '/azure-transcription',
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
            language: {
              type: 'string',
              enum: ['en-US', 'fr-FR', 'es-ES', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR'],
              default: 'en-US',
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
              language: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      } as const,
      preHandler: validateBody(azureTranscriptionRequestSchema) as any,
    },
    azureTranscriptionController.createAzureTranscription.bind(azureTranscriptionController) as any,
  );
}

