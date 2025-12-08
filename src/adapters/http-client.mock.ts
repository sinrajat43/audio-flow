import { IHttpClient, HttpResponse, HttpRequestConfig } from './http-client.interface';
import { logInfo } from '../utils/logger';
import { getFilenameFromUrl } from '../utils/retry';

/**
 * Mock HTTP Client Implementation
 * Returns mock responses without making actual HTTP requests
 */
export class MockHttpClient implements IHttpClient {
  /**
   * Simulate audio file data
   */
  private generateMockAudioData(url: string): Buffer {
    const filename = getFilenameFromUrl(url);
    // Generate a small mock audio buffer
    const mockData = `MOCK_AUDIO_DATA_FOR_${filename}`;
    return Buffer.from(mockData);
  }

  async get(url: string, config?: HttpRequestConfig): Promise<HttpResponse> {
    logInfo('Mock HTTP GET request', { url });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const isAudioRequest = config?.responseType === 'arraybuffer';

    return {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': isAudioRequest ? 'audio/mpeg' : 'application/json',
        'content-length': isAudioRequest ? '1024000' : '100',
      },
      data: isAudioRequest ? this.generateMockAudioData(url) : { success: true },
    };
  }

  async head(url: string, _config?: HttpRequestConfig): Promise<HttpResponse> {
    logInfo('Mock HTTP HEAD request', { url });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'audio/mpeg',
        'content-length': '1024000',
      },
      data: undefined,
    };
  }

  async post(url: string, data?: any, _config?: HttpRequestConfig): Promise<HttpResponse> {
    logInfo('Mock HTTP POST request', { url, data });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
      },
      data: { success: true, message: 'Mock response' },
    };
  }
}

