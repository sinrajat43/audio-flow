import { AudioDownloadResult } from '../types';
import { config } from '../config/environment';
import { httpClient, IHttpClient } from '../adapters';
import { retryWithBackoff, isValidUrl } from '../utils/retry';
import { logInfo, logError } from '../utils/logger';
import { InvalidUrlError, DownloadError } from '../middleware/error-handler';

/**
 * Audio Service
 * Handles audio file downloads with retry logic
 * Uses HTTP client adapter for both mock and real implementations
 */
export class AudioService {
  constructor(private client: IHttpClient = httpClient) {}

  /**
   * Download audio file (works with both mock and real HTTP clients)
   * The behavior is determined by the injected HTTP client
   */
  async downloadAudio(audioUrl: string): Promise<AudioDownloadResult> {
    // Validate URL format
    if (!isValidUrl(audioUrl)) {
      throw new InvalidUrlError(audioUrl);
    }

    logInfo('Starting audio download', { audioUrl });

    try {
      const result = await retryWithBackoff(
        async () => {
          const response = await this.client.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            maxContentLength: 100 * 1024 * 1024,
          });

          const data = response.data as Buffer;

          return {
            success: true,
            contentType: response.headers['content-type'] || 'audio/mpeg',
            size: data.length,
            data,
          };
        },
        {
          maxAttempts: config.retry.maxAttempts,
          initialDelay: config.retry.initialDelay,
          maxDelay: config.retry.maxDelay,
        },
      );

      logInfo('Audio download successful', { audioUrl, size: result.size });
      return result;
    } catch (error) {
      logError('Audio download failed', error, { audioUrl });
      if (error instanceof InvalidUrlError || error instanceof DownloadError) {
        throw error;
      }
      throw new DownloadError(error instanceof Error ? error.message : 'Unknown download error');
    }
  }

  /**
   * Alias for backward compatibility
   */
  async mockDownload(audioUrl: string): Promise<AudioDownloadResult> {
    return this.downloadAudio(audioUrl);
  }

  /**
   * Alias for backward compatibility
   */
  async downloadAudioFile(audioUrl: string): Promise<AudioDownloadResult> {
    return this.downloadAudio(audioUrl);
  }
}

// Export singleton instance
export const audioService = new AudioService();
