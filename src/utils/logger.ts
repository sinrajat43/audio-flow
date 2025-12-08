import pino from 'pino';
import { config } from '../config/environment';

// Create logger instance with pretty printing in development
export const logger = pino({
  level: config.app.logLevel,
  transport:
    config.app.isDevelopment || config.app.isTest
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

// Helper functions for structured logging
export const logInfo = (message: string, data?: Record<string, unknown>) => {
  logger.info(data || {}, message);
};

export const logError = (
  message: string,
  error?: Error | unknown,
  data?: Record<string, unknown>,
) => {
  if (error instanceof Error) {
    logger.error(
      {
        ...data,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      },
      message,
    );
  } else {
    logger.error({ ...data, error }, message);
  }
};

export const logWarn = (message: string, data?: Record<string, unknown>) => {
  logger.warn(data || {}, message);
};

export const logDebug = (message: string, data?: Record<string, unknown>) => {
  logger.debug(data || {}, message);
};
