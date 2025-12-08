import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError, ErrorResponse } from '../types';
import { logError } from '../utils/logger';
import { ZodError } from 'zod';

/**
 * Custom application error class
 */
export class ApplicationError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    // Capture stack trace in V8 environments
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

// Common error types
export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ExternalServiceError extends ApplicationError {
  constructor(message: string, serviceName: string) {
    super(message, 503, `${serviceName.toUpperCase()}_ERROR`);
  }
}

export class InvalidUrlError extends ValidationError {
  constructor(url: string) {
    super(`Invalid URL format: ${url}`);
    this.code = 'INVALID_URL';
  }
}

export class DownloadError extends ApplicationError {
  constructor(message: string) {
    super(message, 500, 'DOWNLOAD_ERROR');
  }
}

/**
 * Global error handler for Fastify
 */
export async function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Log the error
  logError('Error occurred', error, {
    url: request.url,
    method: request.method,
    params: request.params,
    query: request.query,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        statusCode: 400,
        details: error.errors,
      },
    };
    return reply.status(400).send(errorResponse);
  }

  // Handle application errors
  if (error instanceof ApplicationError) {
    const errorResponse: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      },
    };
    return reply.status(error.statusCode).send(errorResponse);
  }

  // Handle Fastify validation errors
  if ('validation' in error) {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        statusCode: 400,
        details: error.validation,
      },
    };
    return reply.status(400).send(errorResponse);
  }

  // Handle unknown errors
  const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
  const errorResponse: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode,
    },
  };

  return reply.status(statusCode).send(errorResponse);
}
