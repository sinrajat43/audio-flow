/**
 * Adapter Factory
 * Creates and exports appropriate adapter instances based on configuration
 */

import { config } from '../config/environment';
import { IHttpClient } from './http-client.interface';
import { RealHttpClient } from './http-client.real';
import { MockHttpClient } from './http-client.mock';
import { ISpeechClient } from './speech-client.interface';
import { RealSpeechClient } from './speech-client.real';
import { MockSpeechClient } from './speech-client.mock';
import { logInfo } from '../utils/logger';

/**
 * Create HTTP Client based on environment
 */
function createHttpClient(): IHttpClient {
  // Use mock HTTP client in test environment, real otherwise
  if (config.app.isTest) {
    logInfo('Using Mock HTTP Client');
    return new MockHttpClient();
  }

  logInfo('Using Real HTTP Client');
  return new RealHttpClient();
}

/**
 * Create Speech Client based on Azure configuration
 */
function createSpeechClient(): ISpeechClient {
  // Use real Azure client if configured, mock otherwise
  if (config.azure.isConfigured) {
    logInfo('Using Real Azure Speech Client');
    return new RealSpeechClient();
  }

  logInfo('Using Mock Speech Client (Azure credentials not configured)');
  return new MockSpeechClient();
}

// Export singleton instances
export const httpClient = createHttpClient();
export const speechClient = createSpeechClient();

// Export interfaces for typing
export * from './http-client.interface';
export * from './speech-client.interface';
