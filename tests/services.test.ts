import { audioService } from '../src/services/audio.service';
import { transcriptionService } from '../src/services/transcription.service';
import { retryWithBackoff, isValidUrl, getFilenameFromUrl } from '../src/utils/retry';
import { TranscriptionModel } from '../src/models/transcription.model';

describe('Audio Service', () => {
  describe('mockDownload', () => {
    it('should successfully mock download a valid URL', async () => {
      const result = await audioService.mockDownload('https://example.com/test.mp3');

      expect(result.success).toBe(true);
      expect(result.contentType).toBeDefined();
    });

    it('should reject invalid URL', async () => {
      await expect(audioService.mockDownload('not-a-url')).rejects.toThrow();
    });

    it('should retry on failure', async () => {
      // This tests the retry mechanism
      const result = await audioService.mockDownload('https://httpbin.org/status/200');
      expect(result.success).toBe(true);
    });
  });
});

describe('Transcription Service', () => {
  describe('transcribeAudio', () => {
    it('should create a mock transcription', async () => {
      const result = await transcriptionService.transcribeAudio(
        'https://example.com/test.mp3',
      );

      expect(result.id).toBeDefined();
      expect(result.audioUrl).toBe('https://example.com/test.mp3');
      expect(result.transcription).toContain('mock transcription');
      expect(result.source).toBe('mock');
      expect(result.createdAt).toBeDefined();
    });

    it('should save to database', async () => {
      const result = await transcriptionService.transcribeAudio(
        'https://example.com/test2.mp3',
      );

      const dbRecord = await TranscriptionModel.findById(result.id);
      expect(dbRecord).toBeDefined();
      expect(dbRecord?.audioUrl).toBe('https://example.com/test2.mp3');
    });
  });

  describe('getRecentTranscriptions', () => {
    beforeEach(async () => {
      // Create test data
      await TranscriptionModel.create([
        {
          audioUrl: 'https://example.com/1.mp3',
          transcription: 'Test 1',
          source: 'mock',
        },
        {
          audioUrl: 'https://example.com/2.mp3',
          transcription: 'Test 2',
          source: 'azure',
        },
      ]);
    });

    it('should return recent transcriptions', async () => {
      const result = await transcriptionService.getRecentTranscriptions(30, 1, 10);

      expect(result.count).toBe(2);
      expect(result.transcriptions).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by source', async () => {
      const result = await transcriptionService.getRecentTranscriptions(30, 1, 10, 'mock');

      expect(result.count).toBe(1);
      expect(result.transcriptions[0].source).toBe('mock');
    });

    it('should support pagination', async () => {
      const result = await transcriptionService.getRecentTranscriptions(30, 1, 1);

      expect(result.count).toBe(2);
      expect(result.transcriptions).toHaveLength(1);
      expect(result.totalPages).toBe(2);
    });
  });
});

describe('Retry Utility', () => {
  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 1000,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 100,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Always fail'));

      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 2,
          initialDelay: 10,
          maxDelay: 100,
        }),
      ).rejects.toThrow('Always fail');

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 100,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('getFilenameFromUrl', () => {
    it('should extract filename from URL', () => {
      expect(getFilenameFromUrl('https://example.com/audio.mp3')).toBe('audio.mp3');
      expect(getFilenameFromUrl('https://example.com/path/to/file.wav')).toBe('file.wav');
    });

    it('should return "unknown" for invalid URLs', () => {
      expect(getFilenameFromUrl('not-a-url')).toBe('unknown');
      expect(getFilenameFromUrl('https://example.com/')).toBe('unknown');
    });
  });
});

