/**
 * @fileoverview Client-side logger implementation
 * @module logger/client
 */

import { LogLevel } from './types';

// Check if client-side logging is enabled via environment variable
const isClientLoggingEnabled = typeof process !== 'undefined' && 
  process.env.NEXT_PUBLIC_CLIENT_SIDE_LOG_ON === 'true';

/**
 * Simple client-side logger
 */
class ClientLogger {
    private level: LogLevel;
    private isEnabled: boolean;

    constructor(level: LogLevel = 'info') {
        this.level = level;
        this.isEnabled = isClientLoggingEnabled;
    }

    private shouldLog(messageLevel: LogLevel): boolean {
        if (!this.isEnabled) return false;
        
        const levels: Record<LogLevel, number> = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
        };
        return levels[messageLevel] <= levels[this.level];
    }

    private formatLog(message: string, meta?: Record<string, unknown>): [string, string, Record<string, unknown>] {
        const timestamp = new Date().toISOString();
        return [`[${timestamp}]`, message, meta || {}];
    }

    error(message: string, meta?: Record<string, unknown>): void {
        if (this.shouldLog('error')) {
            console.error('[ERROR]', ...this.formatLog(message, meta));
        }
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        if (this.shouldLog('warn')) {
            console.warn('[WARN]', ...this.formatLog(message, meta));
        }
    }

    info(message: string, meta?: Record<string, unknown>): void {
        if (this.shouldLog('info')) {
            console.info('[INFO]', ...this.formatLog(message, meta));
        }
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        if (this.shouldLog('debug')) {
            console.debug('[DEBUG]', ...this.formatLog(message, meta));
        }
    }
}

export const clientLogger = new ClientLogger(
    (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info'
);