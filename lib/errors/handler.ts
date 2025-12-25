/**
 * Error Handler Centralizat
 * Sanitizează errors pentru producție, log detalii server-side
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError } from './types'

const isDevelopment = process.env.NODE_ENV === 'development'

interface ErrorResponse {
  error: {
    message: string
    code: string
    statusCode: number
    details?: unknown
    stack?: string
  }
}

/**
 * Handle error și returnează NextResponse
 */
export function handleError(error: unknown): NextResponse<ErrorResponse> {
  // Log error server-side (întotdeauna)
  console.error('Error occurred:', error)

  // AppError (custom errors)
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          ...(isDevelopment && { stack: error.stack })
        }
      },
      { status: error.statusCode }
    )
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: isDevelopment ? error.errors : undefined
        }
      },
      { status: 400 }
    )
  }

  // Supabase errors
  if (isSupabaseError(error)) {
    return NextResponse.json(
      {
        error: {
          message: isDevelopment ? error.message : 'Database operation failed',
          code: 'DATABASE_ERROR',
          statusCode: 500,
          details: isDevelopment ? error : undefined
        }
      },
      { status: 500 }
    )
  }

  // Generic Error
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          message: isDevelopment ? error.message : 'An unexpected error occurred',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          stack: isDevelopment ? error.stack : undefined
        }
      },
      { status: 500 }
    )
  }

  // Unknown error type
  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500
      }
    },
    { status: 500 }
  )
}

/**
 * Type guard pentru Supabase errors
 */
function isSupabaseError(error: unknown): error is { message: string; code?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  )
}

/**
 * Wrapper pentru async API routes cu error handling
 * @example
 * export const POST = withErrorHandling(async (request) => {
 *   // ... handler logic
 * })
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>
) {
  return async (...args: T): Promise<NextResponse<R | ErrorResponse>> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleError(error)
    }
  }
}