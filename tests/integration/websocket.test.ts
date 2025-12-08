import { createApp } from '../../src/app';
import { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { TranscriptionModel } from '../../src/models/transcription.model';

describe('WebSocket Transcription Stream', () => {
  let app: FastifyInstance;
  let wsUrl: string;

  beforeAll(async () => {
    app = await createApp();
    await app.listen({ port: 0, host: '127.0.0.1' });

    // Get the actual port assigned
    const address = app.server.address();
    const port = typeof address === 'object' && address ? address.port : 3001;
    wsUrl = `ws://127.0.0.1:${port}/ws/transcription`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should establish WebSocket connection', (done) => {
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });

    ws.on('close', () => {
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  });

  it('should receive welcome message on connection', (done) => {
    const ws = new WebSocket(wsUrl);
    let receivedWelcome = false;

    ws.on('message', (data: Buffer) => {
      const message = JSON.parse(data.toString());

      if (!receivedWelcome) {
        expect(message.type).toBe('partial');
        expect(message.text).toContain('Connected');
        receivedWelcome = true;
        ws.close();
      }
    });

    ws.on('close', () => {
      expect(receivedWelcome).toBe(true);
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  });

  it('should process audio chunks and send partial results', (done) => {
    const ws = new WebSocket(wsUrl);
    let partialCount = 0;
    let welcomeReceived = false;

    ws.on('open', () => {
      // Send first chunk
      ws.send(
        JSON.stringify({
          type: 'chunk',
          data: 'base64-encoded-audio-chunk-1',
          isLast: false,
        }),
      );
    });

    ws.on('message', (data: Buffer) => {
      const message = JSON.parse(data.toString());

      if (!welcomeReceived) {
        welcomeReceived = true;
        return;
      }

      if (message.type === 'partial') {
        partialCount++;
        expect(message.text).toBeDefined();
        expect(message.confidence).toBeGreaterThanOrEqual(0);
        expect(message.confidence).toBeLessThanOrEqual(1);

        if (partialCount >= 1) {
          ws.close();
        }
      }
    });

    ws.on('close', () => {
      expect(partialCount).toBeGreaterThan(0);
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 10000);

  it('should handle complete transcription flow', (done) => {
    const ws = new WebSocket(wsUrl);
    let finalReceived = false;
    let welcomeReceived = false;

    ws.on('open', () => {
      // Send multiple chunks
      ws.send(
        JSON.stringify({
          type: 'chunk',
          data: 'chunk-1',
          isLast: false,
        }),
      );

      setTimeout(() => {
        ws.send(
          JSON.stringify({
            type: 'chunk',
            data: 'chunk-2',
            isLast: false,
          }),
        );
      }, 100);

      setTimeout(() => {
        ws.send(
          JSON.stringify({
            type: 'chunk',
            data: 'chunk-3',
            isLast: true,
          }),
        );
      }, 200);
    });

    ws.on('message', async (data: Buffer) => {
      const message = JSON.parse(data.toString());

      if (!welcomeReceived) {
        welcomeReceived = true;
        return;
      }

      if (message.type === 'final') {
        finalReceived = true;
        expect(message.text).toBeDefined();
        expect(message.id).toBeDefined();

        // Verify in database
        const dbRecord = await TranscriptionModel.findById(message.id);
        expect(dbRecord).toBeDefined();
        expect(dbRecord?.metadata?.sessionId).toBeDefined();
        expect(dbRecord?.metadata?.chunkCount).toBe(3);
      }
    });

    ws.on('close', () => {
      expect(finalReceived).toBe(true);
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 15000);

  it('should handle invalid JSON gracefully', (done) => {
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      ws.send('invalid-json');
    });

    ws.on('message', (data: Buffer) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'error') {
        expect(message.message).toBeDefined();
        expect(message.code).toBeDefined();
        ws.close();
      }
    });

    ws.on('close', () => {
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 10000);
});

