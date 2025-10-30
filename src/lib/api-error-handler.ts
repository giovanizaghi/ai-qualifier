/**
 * API Error Handling Utilities
 * Provides consistent error responses across all API routes
 */

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard API error response format
 */
export interface ApiError {
  error: string;
  message: string;
  details?: any;
  code?: string;
}

/**
 * Error types with corresponding HTTP status codes
 */
export enum ApiErrorType {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  VALIDATION_ERROR = 422,
  RATE_LIMIT = 429,
  INTERNAL_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  type: ApiErrorType,
  message: string,
  details?: any
): NextResponse<ApiError> {
  const errorMap: Record<ApiErrorType, string> = {
    [ApiErrorType.BAD_REQUEST]: 'Bad Request',
    [ApiErrorType.UNAUTHORIZED]: 'Unauthorized',
    [ApiErrorType.FORBIDDEN]: 'Forbidden',
    [ApiErrorType.NOT_FOUND]: 'Not Found',
    [ApiErrorType.CONFLICT]: 'Conflict',
    [ApiErrorType.VALIDATION_ERROR]: 'Validation Error',
    [ApiErrorType.RATE_LIMIT]: 'Rate Limit Exceeded',
    [ApiErrorType.INTERNAL_ERROR]: 'Internal Server Error',
    [ApiErrorType.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  };

  return NextResponse.json(
    {
      error: errorMap[type],
      message,
      details,
      code: type.toString(),
    },
    { status: type }
  );
}

/**
 * Handle different types of errors and return appropriate responses
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return createErrorResponse(
      ApiErrorType.VALIDATION_ERROR,
      'Validation failed',
      error.issues
    );
  }

  // Prisma errors
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'meta' in error
  ) {
    const prismaError = error as {
      code: string;
      meta?: { target?: any; cause?: any };
    };
    
    switch (prismaError.code) {
      case 'P2002':
        return createErrorResponse(
          ApiErrorType.CONFLICT,
          'A record with this information already exists',
          { field: prismaError.meta?.target }
        );
      case 'P2025':
        return createErrorResponse(
          ApiErrorType.NOT_FOUND,
          'Record not found',
          { field: prismaError.meta?.cause }
        );
      default:
        if (prismaError.code.startsWith('P')) {
          return createErrorResponse(
            ApiErrorType.INTERNAL_ERROR,
            'Database error occurred',
            { code: prismaError.code }
          );
        }
    }
  }

  // OpenAI API errors
  if (error instanceof Error && error.message.includes('OpenAI')) {
    return createErrorResponse(
      ApiErrorType.SERVICE_UNAVAILABLE,
      'AI service temporarily unavailable',
      { message: error.message }
    );
  }

  // Rate limit errors
  if (error instanceof Error && error.message.includes('rate limit')) {
    return createErrorResponse(
      ApiErrorType.RATE_LIMIT,
      'Too many requests. Please try again later.',
      { message: error.message }
    );
  }

  // Generic errors
  if (error instanceof Error) {
    return createErrorResponse(
      ApiErrorType.INTERNAL_ERROR,
      error.message || 'An unexpected error occurred'
    );
  }

  // Unknown errors
  return createErrorResponse(
    ApiErrorType.INTERNAL_ERROR,
    'An unexpected error occurred'
  );
}

/**
 * Async wrapper for API route handlers with error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiError>> {
  return handler().catch(handleApiError);
}

/**
 * Validate request body against a schema
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: { parse: (data: unknown) => T }
): T {
  try {
    return schema.parse(body);
  } catch (error) {
    throw error; // Will be caught by handleApiError
  }
}

/**
 * Common error messages
 */
export const ErrorMessages = {
  UNAUTHORIZED: 'You must be logged in to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  INVALID_DOMAIN: 'Invalid domain format',
  ANALYSIS_FAILED: 'Failed to analyze domain',
  ICP_GENERATION_FAILED: 'Failed to generate ICP',
  QUALIFICATION_FAILED: 'Failed to qualify prospect',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait before trying again.',
  INVALID_INPUT: 'Invalid input provided',
  SERVER_ERROR: 'An internal server error occurred',
} as const;
