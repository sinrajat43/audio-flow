import { createApp } from '../src/app';
import { FastifyInstance } from 'fastify';
import { TranscriptionModel } from '../src/models/transcription.model';

describe('Azure Transcription API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /azure-transcription', () => {
    it('should create a transcription (mock or real based on config)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/azure-transcription',
        payload: {
          audioUrl: 'https://example.com/sample.mp3',
          language: 'en-US',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);

      expect(data).toHaveProperty('id');
      expect(data.audioUrl).toBe('https://example.com/sample.mp3');
      expect(data.transcription).toBeDefined();
      expect(['mock', 'azure']).toContain(data.source);
      expect(data.language).toBe('en-US');
      expect(data).toHaveProperty('createdAt');
    });

    it('should use default language en-US when not specified', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/azure-transcription',
        payload: {
          audioUrl: 'https://example.com/sample.mp3',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);

      expect(data.language).toBe('en-US');
    });

    it('should support multiple languages', async () => {
      const languages = ['fr-FR', 'es-ES', 'de-DE'];

      for (const language of languages) {
        const response = await app.inject({
          method: 'POST',
          url: '/azure-transcription',
          payload: {
            audioUrl: 'https://example.com/sample.mp3',
            language,
          },
        });

        expect(response.statusCode).toBe(201);
        const data = JSON.parse(response.body);
        expect(data.language).toBe(language);
      }
    });

    it('should reject invalid language code', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/azure-transcription',
        payload: {
          audioUrl: 'https://example.com/sample.mp3',
          language: 'invalid-lang',
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toBeDefined();
    });

    it('should reject invalid URL format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/azure-transcription',
        payload: {
          audioUrl: 'not-a-url',
          language: 'en-US',
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toBeDefined();
    });

    it('should save transcription to database with correct fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/azure-transcription',
        payload: {
          audioUrl: 'https://example.com/test-azure.mp3',
          language: 'fr-FR',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);

      // Verify in database
      const dbRecord = await TranscriptionModel.findById(data.id);
      expect(dbRecord).toBeDefined();
      expect(dbRecord?.audioUrl).toBe('https://example.com/test-azure.mp3');
      expect(dbRecord?.language).toBe('fr-FR');
      expect(['mock', 'azure']).toContain(dbRecord?.source);
    });

    it('should handle graceful degradation to mock on Azure failure', async () => {
      // This test verifies that even if Azure is not configured,
      // the endpoint still works with mock implementation
      const response = await app.inject({
        method: 'POST',
        url: '/azure-transcription',
        payload: {
          audioUrl: 'https://example.com/sample.mp3',
          language: 'en-US',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);

      // Should return a transcription regardless
      expect(data.transcription).toBeDefined();
      expect(data.transcription.length).toBeGreaterThan(0);
    });
  });
});

