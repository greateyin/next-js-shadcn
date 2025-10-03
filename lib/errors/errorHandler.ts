import { NextResponse } from 'next/server';

import { AppError } from './AppError';

export function handleError(error: Error | AppError): NextResponse {
  if (error instanceof AppError) {
    return new NextResponse(
      JSON.stringify({
        status: 'error',
        code: error.code,
        message: error.message,
      }),
      {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Handle unknown errors
  console.error('Unhandled error:', error);
  return new NextResponse(
    JSON.stringify({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
