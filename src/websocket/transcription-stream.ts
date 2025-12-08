import { FastifyRequest } from 'fastify';
import { WebSocket } from '@fastify/websocket';
import { TranscriptionModel } from '../models/transcription.model';
import { WebSocketMessage, WebSocketChunkMessage } from '../types';
import { logInfo, logError, logWarn } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { sleep } from '../utils/retry';

/**
 * WebSocket handler for streaming transcription
 * Accepts audio chunks and streams back partial/final transcription results
 */
export async function transcriptionWebSocket(
  connection: WebSocket,
  request: FastifyRequest,
): Promise<void> {
  // Wrap WebSocket in object for consistent interface
  const socket = connection;
  const sessionId = uuidv4();
  const startTime = new Date();
  let chunkCount = 0;
  const audioChunks: string[] = [];
  let isComplete = false;

  logInfo('WebSocket connection established', {
    sessionId,
    remoteAddress: request.ip,
  });

  // Send welcome message
  const welcomeMessage: WebSocketMessage = {
    type: 'partial',
    text: 'Connected. Ready to receive audio chunks.',
    confidence: 1.0,
  };
  socket.send(JSON.stringify(welcomeMessage));

  /**
   * Generate mock partial transcription from accumulated chunks
   */
  const generatePartialTranscription = (chunks: string[]): string => {
    const words = [
      'Hello',
      'this',
      'is',
      'a',
      'streaming',
      'transcription',
      'test',
      'with',
      'partial',
      'results',
      'being',
      'sent',
      'in',
      'real',
      'time',
      'as',
      'audio',
      'chunks',
      'are',
      'processed',
    ];

    const numWords = Math.min(chunks.length * 2, words.length);
    return words.slice(0, numWords).join(' ');
  };

  /**
   * Generate final transcription text
   */
  const generateFinalTranscription = (chunks: string[]): string => {
    return (
      `This is a mock streaming transcription result from ${chunks.length} audio chunks. ` +
      `Session ID: ${sessionId}. ` +
      `In a real implementation, this would contain the complete transcription of all received audio data. ` +
      `The streaming service processed the audio in real-time and generated partial results throughout the session.`
    );
  };

  /**
   * Process audio chunks and send partial results
   */
  const processChunks = async () => {
    while (!isComplete && audioChunks.length > 0) {
      try {
        // Generate partial transcription
        const partialText = generatePartialTranscription(audioChunks);
        const confidence = Math.min(0.5 + audioChunks.length * 0.05, 0.95);

        const partialMessage: WebSocketMessage = {
          type: 'partial',
          text: partialText,
          confidence: parseFloat(confidence.toFixed(2)),
        };

        socket.send(JSON.stringify(partialMessage));

        logInfo('Sent partial transcription', {
          sessionId,
          chunks: audioChunks.length,
          confidence,
        });

        // Wait before sending next partial result
        await sleep(500);
      } catch (error) {
        logError('Error processing chunks', error, { sessionId });
        break;
      }
    }
  };

  // Handle incoming messages
  socket.on('message', async (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString()) as WebSocketChunkMessage;

      if (data.type === 'chunk') {
        chunkCount++;
        audioChunks.push(data.data);

        logInfo('Received audio chunk', {
          sessionId,
          chunkNumber: chunkCount,
          isLast: data.isLast,
        });

        // Process chunks and send partial results
        if (chunkCount === 1) {
          // Start processing in background
          processChunks().catch((error) => {
            logError('Error in chunk processing', error, { sessionId });
          });
        }

        // Handle last chunk
        if (data.isLast) {
          isComplete = true;

          // Wait a bit for final processing
          await sleep(1000);

          // Generate final transcription
          const finalText = generateFinalTranscription(audioChunks);

          // Save to MongoDB
          const transcriptionDoc = await TranscriptionModel.create({
            audioUrl: `ws://streaming-session/${sessionId}`,
            transcription: finalText,
            source: 'mock',
            metadata: {
              sessionId,
              duration: Date.now() - startTime.getTime(),
              chunkCount,
            },
          });

          // Send final message
          const finalMessage: WebSocketMessage = {
            type: 'final',
            text: finalText,
            id: transcriptionDoc.id,
          };
          socket.send(JSON.stringify(finalMessage));

          logInfo('Streaming transcription completed', {
            sessionId,
            id: transcriptionDoc.id,
            chunkCount,
            duration: Date.now() - startTime.getTime(),
          });

          // Close connection
          socket.close();
        }
      } else {
        logWarn('Unknown message type received', { sessionId, type: data.type });
      }
    } catch (error) {
      logError('Error handling WebSocket message', error, { sessionId });

      const errorMessage: WebSocketMessage = {
        type: 'error',
        message: 'Failed to process audio chunk',
        code: 'PROCESSING_ERROR',
      };
      socket.send(JSON.stringify(errorMessage));
    }
  });

  // Handle connection close
  socket.on('close', () => {
    isComplete = true;
    const duration = Date.now() - startTime.getTime();

    logInfo('WebSocket connection closed', {
      sessionId,
      chunkCount,
      duration,
      completed: audioChunks.length > 0 && chunkCount > 0,
    });
  });

  // Handle errors
  socket.on('error', (error: Error) => {
    isComplete = true;
    logError('WebSocket error', error, { sessionId });
  });
}
