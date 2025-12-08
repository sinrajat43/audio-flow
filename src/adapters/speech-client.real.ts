import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { ISpeechClient, SpeechRecognitionResult } from './speech-client.interface';
import { LanguageCode } from '../types';
import { config } from '../config/environment';
import { logInfo, logError } from '../utils/logger';
import { ExternalServiceError } from '../middleware/error-handler';

/**
 * Real Azure Speech Client Implementation
 * Uses Azure Cognitive Services Speech SDK
 */
export class RealSpeechClient implements ISpeechClient {
  private speechKey: string | undefined;
  private speechRegion: string | undefined;

  constructor() {
    this.speechKey = config.azure.speechKey;
    this.speechRegion = config.azure.speechRegion;
  }

  isConfigured(): boolean {
    return Boolean(this.speechKey && this.speechRegion);
  }

  async transcribe(audioData: Buffer, language: LanguageCode): Promise<SpeechRecognitionResult> {
    if (!this.isConfigured()) {
      throw new ExternalServiceError('Azure Speech credentials not configured', 'Azure');
    }

    logInfo('Starting Azure Speech transcription', { language });

    return new Promise((resolve, reject) => {
      try {
        // Configure Azure Speech
        const speechConfig = sdk.SpeechConfig.fromSubscription(
          this.speechKey!,
          this.speechRegion!,
        );
        speechConfig.speechRecognitionLanguage = language;

        // Create audio config from buffer
        const audioConfig = sdk.AudioConfig.fromWavFileInput(audioData as any);

        // Create speech recognizer
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        let transcription = '';
        const startTime = Date.now();

        // Handle recognized speech
        recognizer.recognized = (_s, e) => {
          if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
            transcription += e.result.text + ' ';
          }
        };

        // Handle session stopped
        recognizer.sessionStopped = () => {
          recognizer.stopContinuousRecognitionAsync();
          const duration = Date.now() - startTime;

          resolve({
            text: transcription.trim(),
            language,
            duration,
            confidence: 0.9, // Azure doesn't provide overall confidence
          });
        };

        // Handle errors
        recognizer.canceled = (_s, e) => {
          recognizer.stopContinuousRecognitionAsync();
          if (e.reason === sdk.CancellationReason.Error) {
            reject(new ExternalServiceError(e.errorDetails, 'Azure Speech'));
          } else {
            const duration = Date.now() - startTime;
            resolve({
              text: transcription.trim(),
              language,
              duration,
            });
          }
        };

        // Start recognition
        recognizer.startContinuousRecognitionAsync(
          () => {
            logInfo('Azure speech recognition started');
          },
          (err) => {
            reject(new ExternalServiceError(err, 'Azure Speech'));
          },
        );

        // Set timeout
        setTimeout(() => {
          recognizer.stopContinuousRecognitionAsync();
          if (transcription) {
            const duration = Date.now() - startTime;
            resolve({
              text: transcription.trim(),
              language,
              duration,
            });
          } else {
            reject(new ExternalServiceError('Transcription timeout', 'Azure Speech'));
          }
        }, 60000); // 60 second timeout
      } catch (error) {
        logError('Azure Speech transcription error', error);
        reject(error);
      }
    });
  }
}

