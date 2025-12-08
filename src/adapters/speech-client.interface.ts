import { LanguageCode } from '../types';

/**
 * Speech Client Interface
 * Abstract interface for speech-to-text services
 */

export interface SpeechRecognitionResult {
  text: string;
  confidence?: number;
  language: LanguageCode;
  duration?: number;
}

export interface ISpeechClient {
  /**
   * Check if the client is configured and ready
   */
  isConfigured(): boolean;

  /**
   * Transcribe audio from a buffer
   */
  transcribe(audioData: Buffer, language: LanguageCode): Promise<SpeechRecognitionResult>;
}

