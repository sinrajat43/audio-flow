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
        tags: ['azure'],
        summary: 'Create Azure transcription',
        description:
          'Transcribe audio using Azure Speech-to-Text API (or mock if not configured). Supports multiple languages.',
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
            language: {
              type: 'string',
              enum: ['en-US', 'fr-FR', 'es-ES', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR'],
              default: 'en-US',
              description: 'Language code for transcription',
              example: 'en-US',
            },
          },
        },
        response: {
          201: {
            description: 'Azure transcription created successfully',
            type: 'object',
            properties: {
              id: { type: 'string', description: 'MongoDB document ID' },
              audioUrl: { type: 'string', description: 'URL of the audio file' },
              transcription: { type: 'string', description: 'Transcribed text' },
              source: {
                type: 'string',
                enum: ['azure', 'mock'],
                description: 'Transcription source (azure if configured, mock otherwise)',
              },
              language: { type: 'string', description: 'Language used for transcription' },
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
      preHandler: validateBody(azureTranscriptionRequestSchema) as any,
    },
    azureTranscriptionController.createAzureTranscription.bind(azureTranscriptionController) as any,
  );
}

