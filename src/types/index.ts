import { Document } from 'mongoose';

// Transcription source types
export type TranscriptionSource = 'mock' | 'azure';

// Language codes supported by Azure Speech
export type LanguageCode = 'en-US' | 'fr-FR' | 'es-ES' | 'de-DE' | 'it-IT' | 'ja-JP' | 'ko-KR';

// Request types
export interface TranscriptionRequest {
  audioUrl: string;
}

export interface AzureTranscriptionRequest {
  audioUrl: string;
  language?: LanguageCode;
}

// Response types
export interface TranscriptionResponse {
  id: string;
  audioUrl: string;
  transcription: string;
  source: TranscriptionSource;
  language?: LanguageCode;
  createdAt: Date;
}

export interface TranscriptionsListResponse {
  count: number;
  page: number;
  limit: number;
  totalPages: number;
  transcriptions: TranscriptionResponse[];
}

// WebSocket message types
export interface WebSocketChunkMessage {
  type: 'chunk';
  data: string; // base64 encoded audio chunk
  isLast: boolean;
}

export interface WebSocketPartialMessage {
  type: 'partial';
  text: string;
  confidence: number;
}

export interface WebSocketFinalMessage {
  type: 'final';
  text: string;
  id: string;
}

export interface WebSocketErrorMessage {
  type: 'error';
  message: string;
  code: string;
}

export type WebSocketMessage =
  | WebSocketChunkMessage
  | WebSocketPartialMessage
  | WebSocketFinalMessage
  | WebSocketErrorMessage;

// Database document types
export interface ITranscription extends Document {
  audioUrl: string;
  transcription: string;
  source: TranscriptionSource;
  language?: LanguageCode;
  metadata?: {
    sessionId?: string;
    duration?: number;
    chunkCount?: number;
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

// Audio download result
export interface AudioDownloadResult {
  success: boolean;
  filePath?: string;
  contentType?: string;
  size?: number;
  error?: string;
  data?: Buffer;
}

// Retry options
export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  onRetry?: (attempt: number, error: Error) => void;
}
