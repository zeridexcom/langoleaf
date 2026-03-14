import { ApiError, ErrorCode, ERROR_HTTP_STATUS } from '@/types/api'
import { ZodError } from 'zod'

export class AppError extends Error {
  public code: ErrorCode
  public statusCode: number
  public details?: Array<{ field: string; message: string }>

  constructor(
    code: ErrorCode,
    message: string,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = ERROR_HTTP_STATUS[code]
    this.details = details
  }
}

export function createAppError(
  code: ErrorCode,
  message: string,
  details?: Array<{ field: string; message: string }>
): AppError {
  return new AppError(code, message, details)
}

export function handleZodError(error: ZodError): AppError {
  const details = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))

  return new AppError(
    'VALIDATION_ERROR',
    'Validation failed',
    details
  )
}

export function handleSupabaseError(error: unknown): AppError {
  if (error instanceof Error) {
    // Check for specific Supabase error patterns
    const message = error.message.toLowerCase()
    
    if (message.includes('unique constraint')) {
      return new AppError('CONFLICT', 'A record with this information already exists')
    }
    
    if (message.includes('foreign key constraint')) {
      return new AppError('VALIDATION_ERROR', 'Referenced record does not exist')
    }
    
    if (message.includes('not found')) {
      return new AppError('NOT_FOUND', 'Record not found')
    }
    
    if (message.includes('permission denied') || message.includes('rls')) {
      return new AppError('FORBIDDEN', 'You do not have permission to perform this action')
    }
    
    return new AppError('INTERNAL_ERROR', error.message)
  }
  
  return new AppError('INTERNAL_ERROR', 'An unexpected error occurred')
}

export function formatErrorResponse(error: unknown): { success: false; error: ApiError } {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    }
  }

  if (error instanceof ZodError) {
    const appError = handleZodError(error)
    return {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details,
      },
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    }
  }

  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

// Common error creators
export const Errors = {
  unauthorized: (message = 'Unauthorized') => createAppError('UNAUTHORIZED', message),
  forbidden: (message = 'Forbidden') => createAppError('FORBIDDEN', message),
  notFound: (message = 'Not found') => createAppError('NOT_FOUND', message),
  conflict: (message = 'Conflict') => createAppError('CONFLICT', message),
  validation: (message = 'Validation failed', details?: Array<{ field: string; message: string }>) => 
    createAppError('VALIDATION_ERROR', message, details),
  badRequest: (message = 'Bad request') => createAppError('BAD_REQUEST', message),
  internal: (message = 'Internal server error') => createAppError('INTERNAL_ERROR', message),
}
