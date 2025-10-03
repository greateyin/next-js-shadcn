/**
 * @fileoverview Logging middleware for Next.js
 * @module logger/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { ipAddress } from '@vercel/functions';
import { performanceLogger, securityLogger } from './index';
import type { SecurityMetadata, PerformanceMetadata } from './types';

/**
 * Logging middleware for Next.js requests
 * @param {NextRequest} request - Next.js request object
 * @param {Function} next - Next middleware function
 * @returns {Promise<NextResponse>} Next.js response
 */
export async function loggingMiddleware(
    request: NextRequest,
    next: () => Promise<NextResponse>
): Promise<NextResponse> {
    const requestId = nanoid();
    const startTime = Date.now();

    // Log request
    const securityMeta: SecurityMetadata = {
        requestId,
        method: request.method,
        path: request.nextUrl.pathname,
        ip: ipAddress(request) || 
           request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
    };

    securityLogger.info('Incoming request', { metadata: securityMeta });

    try {
        // Process request
        const response = await next();

        // Log response time
        const duration = Date.now() - startTime;
        const perfMeta: PerformanceMetadata = {
            requestId,
            duration,
            operation: 'http_request',
            resource: request.nextUrl.pathname,
            status: response.status.toString(),
        };

        performanceLogger.info('Request completed', { metadata: perfMeta });

        // Add tracking headers
        response.headers.set('X-Request-ID', requestId);
        response.headers.set('X-Response-Time', `${duration}ms`);

        return response;
    } catch (error) {
        // Log error
        const duration = Date.now() - startTime;
        securityLogger.error('Request failed', {
            metadata: {
                ...securityMeta,
                error,
                duration,
            },
        });

        throw error;
    }
}

/**
 * Creates a logging middleware with configuration
 * @param {Object} config - Middleware configuration
 * @returns {Function} Configured middleware function
 */
export function createLoggingMiddleware(config: {
    excludePaths?: string[];
    sensitiveHeaders?: string[];
} = {}) {
    const { excludePaths = [], sensitiveHeaders = ['authorization', 'cookie'] } = config;

    return async function(request: NextRequest, next: () => Promise<NextResponse>) {
        // Skip logging for excluded paths
        if (excludePaths.some(path => request.nextUrl.pathname.startsWith(path))) {
            return next();
        }

        // Create sanitized headers for logging
        const headers = Object.fromEntries(request.headers.entries());
        sensitiveHeaders.forEach(header => {
            if (header in headers) {
                headers[header] = '[REDACTED]';
            }
        });

        return loggingMiddleware(request, next);
    };
}
