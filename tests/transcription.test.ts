import { createApp } from '../src/app';
import { FastifyInstance } from 'fastify';
import { TranscriptionModel } from '../src/models/transcription.model';

describe('Transcription API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /transcription', () => {
    it('should create a mock transcription successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/transcription',
        payload: {
          audioUrl: 'https://example.com/sample.mp3',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);

      expect(data).toHaveProperty('id');
      expect(data.audioUrl).toBe('https://example.com/sample.mp3');
      expect(data.transcription).toContain('mock transcription');
      expect(data.source).toBe('mock');
      expect(data).toHaveProperty('createdAt');
    });

    it('should reject invalid URL format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/transcription',
        payload: {
          audioUrl: 'not-a-valid-url',
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing audioUrl', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/transcription',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toBeDefined();
    });

    it('should save transcription to database', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/transcription',
        payload: {
          audioUrl: 'https://example.com/test.mp3',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);

      // Verify in database
      const dbRecord = await TranscriptionModel.findById(data.id);
      expect(dbRecord).toBeDefined();
      expect(dbRecord?.audioUrl).toBe('https://example.com/test.mp3');
      expect(dbRecord?.source).toBe('mock');
    });
  });

  describe('GET /transcriptions', () => {
    beforeEach(async () => {
      // Create test data
      const now = new Date();
      const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

      await TranscriptionModel.create([
        {
          audioUrl: 'https://example.com/recent1.mp3',
          transcription: 'Recent transcription 1',
          source: 'mock',
          createdAt: twentyDaysAgo,
        },
        {
          audioUrl: 'https://example.com/recent2.mp3',
          transcription: 'Recent transcription 2',
          source: 'azure',
          createdAt: now,
        },
        {
          audioUrl: 'https://example.com/old.mp3',
          transcription: 'Old transcription',
          source: 'mock',
          createdAt: fortyDaysAgo,
        },
      ]);
    });

    it('should return transcriptions from last 30 days by default', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/transcriptions',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);

      expect(data.count).toBe(2);
      expect(data.transcriptions).toHaveLength(2);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(10);
    });

    it('should filter by custom days parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/transcriptions?days=50',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);

      expect(data.count).toBe(3);
      expect(data.transcriptions).toHaveLength(3);
    });

    it('should filter by source', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/transcriptions?source=azure',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);

      expect(data.count).toBe(1);
      expect(data.transcriptions[0].source).toBe('azure');
    });

    it('should support pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/transcriptions?page=1&limit=1',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);

      expect(data.count).toBe(2);
      expect(data.transcriptions).toHaveLength(1);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(1);
      expect(data.totalPages).toBe(2);
    });

    it('should return empty array when no transcriptions found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/transcriptions?days=1',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);

      expect(data.count).toBe(0);
      expect(data.transcriptions).toHaveLength(0);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);

      expect(data.status).toBe('healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data.environment).toBe('test');
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);

      expect(data.name).toBe('AudioFlow API');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('endpoints');
    });
  });
});

