import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ValidationError } from './error-handler';

// Validation schemas
export const transcriptionRequestSchema = z.object({
  audioUrl: z.string().url('Invalid URL format'),
});

export const azureTranscriptionRequestSchema = z.object({
  audioUrl: z.string().url('Invalid URL format'),
  language: z.enum(['en-US', 'fr-FR', 'es-ES', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR']).optional(),
});

export const transcriptionsQuerySchema = z.object({
  days: z.preprocess((val) => (val ? Number(val) : 30), z.number().default(30)),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().default(1)),
  limit: z.preprocess((val) => (val ? Number(val) : 10), z.number().default(10)),
  source: z.enum(['mock', 'azure']).optional(),
});

/**
 * Validates request body against a Zod schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(
          (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`,
        );
        throw new ValidationError(messages.join(', '));
      }
      throw error;
    }
  };
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      request.query = schema.parse(request.query);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(
          (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`,
        );
        throw new ValidationError(messages.join(', '));
      }
      throw error;
    }
  };
}
