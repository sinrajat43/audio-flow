import { TranscriptionModel } from '../models/transcription.model';
import { audioService } from './audio.service';
import { TranscriptionResponse } from '../types';
import { logInfo } from '../utils/logger';
import { getFilenameFromUrl } from '../utils/retry';

/**
 * Transcription Service
 * Handles mock transcription logic
 */
export class TranscriptionService {
  /**
   * Generate mock transcription text
   */
  private generateMockTranscription(audioUrl: string): string {
    const filename = getFilenameFromUrl(audioUrl);
    const timestamp = new Date().toISOString();

    return `This is a mock transcription of the audio file: ${filename}. The audio was processed at ${timestamp}.  
    In a real implementation, this would contain the actual transcribed text from the audio content. 
    This mock service simulates the transcription process for testing and development purposes.`;
  }

  /**
   * Process audio URL and create mock transcription
   */
  async transcribeAudio(audioUrl: string): Promise<TranscriptionResponse> {
    logInfo('Starting mock transcription', { audioUrl });

    // Step 1: Download the audio file (uses adapter - mock or real)
    await audioService.downloadAudio(audioUrl);

    // Step 2: Generate mock transcription
    const transcription = this.generateMockTranscription(audioUrl);

    // Step 3: Save to MongoDB
    const transcriptionDoc = await TranscriptionModel.create({
      audioUrl,
      transcription,
      source: 'mock',
    });

    logInfo('Mock transcription completed', {
      id: transcriptionDoc.id,
      audioUrl,
    });

    // Step 4: Return response
    return {
      id: transcriptionDoc.id,
      audioUrl: transcriptionDoc.audioUrl,
      transcription: transcriptionDoc.transcription,
      source: transcriptionDoc.source,
      createdAt: transcriptionDoc.createdAt,
    };
  }

  /**
   * Get transcriptions from the last N days
   */
  async getRecentTranscriptions(
    days = 30,
    page = 1,
    limit = 10,
    source?: string,
  ): Promise<{
    count: number;
    page: number;
    limit: number;
    totalPages: number;
    transcriptions: TranscriptionResponse[];
  }> {
    logInfo('Fetching recent transcriptions', { days, page, limit, source });

    const result = await TranscriptionModel.findRecentTranscriptions(days, page, limit, source);

    return {
      count: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      transcriptions: result.transcriptions.map((doc: any) => ({
        id: doc._id.toString(),
        audioUrl: doc.audioUrl,
        transcription: doc.transcription,
        source: doc.source,
        language: doc.language,
        createdAt: doc.createdAt,
      })),
    };
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();
