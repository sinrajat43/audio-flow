import { audioService } from './audio.service';
import { TranscriptionModel } from '../models/transcription.model';
import { TranscriptionResponse, LanguageCode } from '../types';
import { speechClient, ISpeechClient } from '../adapters';
import { logInfo, logWarn, logError } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';

/**
 * Azure Speech Service
 * Handles Speech-to-Text using adapter pattern
 * Works with both mock and real Azure implementations transparently
 */
export class AzureSpeechService {
  constructor(private client: ISpeechClient = speechClient) {
    if (this.client.isConfigured()) {
      logInfo('Speech Service configured and ready');
    } else {
      logWarn('Speech Service using mock implementation');
    }
  }

  /**
   * Process audio URL and create transcription
   * Uses speech client adapter (works with both mock and real implementations)
   */
  async transcribeAudio(
    audioUrl: string,
    language: LanguageCode = 'en-US',
  ): Promise<TranscriptionResponse> {
    logInfo('Starting transcription', { audioUrl, language });

    let transcription: string;
    const source: 'azure' | 'mock' = this.client.isConfigured() ? 'azure' : 'mock';

    try {
      // Download audio file using HTTP client adapter
      const audioResult = await audioService.downloadAudio(audioUrl);

      if (!audioResult.data) {
        throw new Error('Failed to download audio file');
      }

      // Transcribe using speech client adapter (with retry)
      const result = await retryWithBackoff(
        async () => {
          return await this.client.transcribe(audioResult.data as Buffer, language);
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          onRetry: (attempt, error) => {
            logWarn(`Retrying transcription (attempt ${attempt})`, {
              audioUrl,
              error: error.message,
            });
          },
        },
      );

      transcription = result.text;
      logInfo('Transcription successful', { audioUrl, source });
    } catch (error) {
      logError('Transcription failed', error, { audioUrl });
      throw error;
    }

    // Save to MongoDB
    const transcriptionDoc = await TranscriptionModel.create({
      audioUrl,
      transcription,
      source,
      language,
    });

    logInfo('Transcription saved to database', {
      id: transcriptionDoc.id,
      source,
    });

    // Return response
    return {
      id: transcriptionDoc.id,
      audioUrl: transcriptionDoc.audioUrl,
      transcription: transcriptionDoc.transcription,
      source: transcriptionDoc.source,
      language: transcriptionDoc.language,
      createdAt: transcriptionDoc.createdAt,
    };
  }
}

// Export singleton instance
export const azureSpeechService = new AzureSpeechService();
