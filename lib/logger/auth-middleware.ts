import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { authLogger } from './index';

export async function withAuthLogging(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
) {
    const requestId = nanoid();
    const startTime = Date.now();

    try {
        // Log auth request
        authLogger.info('Auth request received', {
            requestId,
            method: request.method,
            url: request.url,
            headers: Object.fromEntries(request.headers),
        });

        // Execute handler
        const response = await handler(request);

        // Log auth response
        authLogger.info('Auth request completed', {
            requestId,
            status: response.status,
            duration: Date.now() - startTime,
        });

        return response;
    } catch (error) {
        // Log auth error
        authLogger.error('Auth request failed', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime,
        });

        throw error;
    }
}
