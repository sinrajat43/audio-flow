import { ISpeechClient, SpeechRecognitionResult } from './speech-client.interface';
import { LanguageCode } from '../types';
import { logInfo } from '../utils/logger';

/**
 * Mock Speech Client Implementation
 * Returns mock transcription results
 */
export class MockSpeechClient implements ISpeechClient {
  isConfigured(): boolean {
    // Mock is always "configured"
    return true;
  }

  async transcribe(audioData: Buffer, language: LanguageCode): Promise<SpeechRecognitionResult> {
    logInfo('Starting mock speech transcription', { language, dataSize: audioData.length });

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate mock transcription based on language
    const transcriptions: Record<string, string> = {
      'en-US': 'This is a mock transcription in English. The audio has been processed successfully.',
      'fr-FR': 'Ceci est une transcription fictive en français. L\'audio a été traité avec succès.',
      'es-ES': 'Esta es una transcripción simulada en español. El audio se ha procesado correctamente.',
      'de-DE': 'Dies ist eine simulierte Transkription auf Deutsch. Das Audio wurde erfolgreich verarbeitet.',
      'it-IT': 'Questa è una trascrizione simulata in italiano. L\'audio è stato elaborato con successo.',
      'ja-JP': 'これは日本語のモック文字起こしです。オーディオは正常に処理されました。',
      'ko-KR': '이것은 한국어 모의 전사입니다. 오디오가 성공적으로 처리되었습니다.',
    };

    const text = transcriptions[language] || transcriptions['en-US'];

    return {
      text,
      language,
      confidence: 0.95,
      duration: 2500,
    };
  }
}

