import { FastifyRequest, FastifyReply } from 'fastify';
import { azureSpeechService } from '../services/azure-speech.service';
import { AzureTranscriptionRequest } from '../types';
import { logInfo } from '../utils/logger';

/**
 * Controller for Azure transcription endpoints
 */
export class AzureTranscriptionController {
  /**
   * POST /azure-transcription
   * Create a new transcription using Azure Speech-to-Text
   */
  async createAzureTranscription(
    request: FastifyRequest<{ Body: AzureTranscriptionRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { audioUrl, language = 'en-US' } = request.body;

    logInfo('Creating Azure transcription', { audioUrl, language });

    const result = await azureSpeechService.transcribeAudio(audioUrl, language);

    reply.status(201).send(result);
  }
}

// Export singleton instance
export const azureTranscriptionController = new AzureTranscriptionController();
