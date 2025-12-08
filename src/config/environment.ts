import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  AZURE_SPEECH_KEY: z.string().optional(),
  AZURE_SPEECH_REGION: z.string().optional(),
  MAX_RETRY_ATTEMPTS: z.string().transform(Number).default('3'),
  RETRY_INITIAL_DELAY: z.string().transform(Number).default('1000'),
  RETRY_MAX_DELAY: z.string().transform(Number).default('10000'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`,
      );
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
};

export const env = parseEnv();

// Check if Azure credentials are available
export const hasAzureCredentials = (): boolean => {
  return Boolean(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION);
};

// Export individual configuration objects for better organization
export const config = {
  app: {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
  },
  database: {
    uri: env.MONGODB_URI,
  },
  azure: {
    speechKey: env.AZURE_SPEECH_KEY,
    speechRegion: env.AZURE_SPEECH_REGION,
    isConfigured: hasAzureCredentials(),
  },
  retry: {
    maxAttempts: env.MAX_RETRY_ATTEMPTS,
    initialDelay: env.RETRY_INITIAL_DELAY,
    maxDelay: env.RETRY_MAX_DELAY,
  },
};
