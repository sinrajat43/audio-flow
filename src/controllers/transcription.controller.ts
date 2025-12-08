import { FastifyRequest, FastifyReply } from 'fastify';
import { transcriptionService } from '../services/transcription.service';
import { TranscriptionRequest } from '../types';
import { logInfo } from '../utils/logger';

/**
 * Controller for mock transcription endpoints
 */
export class TranscriptionController {
  /**
   * POST /transcription
   * Create a new mock transcription
   */
  async createTranscription(
    request: FastifyRequest<{ Body: TranscriptionRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { audioUrl } = request.body;

    logInfo('Creating mock transcription', { audioUrl });

    const result = await transcriptionService.transcribeAudio(audioUrl);

    reply.status(201).send(result);
  }

  /**
   * GET /transcriptions
   * Get transcriptions from the last N days
   */
  async getTranscriptions(
    request: FastifyRequest<{
      Querystring: { days?: number; page?: number; limit?: number; source?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { days = 30, page = 1, limit = 10, source } = request.query;

    logInfo('Fetching transcriptions', { days, page, limit, source });

    const result = await transcriptionService.getRecentTranscriptions(
      Number(days),
      Number(page),
      Number(limit),
      source,
    );

    reply.status(200).send(result);
  }
}

// Export singleton instance
export const transcriptionController = new TranscriptionController();
