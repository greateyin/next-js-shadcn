/**
 * @fileoverview Universal logger implementation for both client and server
 * @module logger
 */

import { LogLevel } from './types';

// Environment detection
const isServer = typeof window === 'undefined';

// Log enablement flags
const isClientLoggingEnabled = typeof process !== 'undefined' && 
  process.env.NEXT_PUBLIC_CLIENT_SIDE_LOG_ON === 'true';
const isServerLoggingEnabled = typeof process !== 'undefined' && 
  (process.env.SERVER_SIDE_LOG_ON === 'true' || process.env.NEXT_PUBLIC_SERVER_SIDE_LOG_ON === 'true');

// Basic logger implementation
class UniversalLogger {
  private level: LogLevel;
  private category?: string;
  private isEnabled: boolean;

  constructor(level: LogLevel = 'info', category?: string) {
    this.level = level;
    this.category = category;
    this.isEnabled = isServer ? isServerLoggingEnabled : isClientLoggingEnabled;
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

  private formatMeta(meta?: Record<string, unknown>) {
    return {
      ...meta,
      category: this.category,
      timestamp: new Date().toISOString(),
      environment: isServer ? 'server' : 'client',
    };
  }

  error(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, this.formatMeta(meta));
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, this.formatMeta(meta));
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, this.formatMeta(meta));
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, this.formatMeta(meta));
    }
  }

  child(options: { category: string }): UniversalLogger {
    return new UniversalLogger(this.level, options.category);
  }
}

// Create default logger instance
const defaultLogger = new UniversalLogger(
  (isServer ? process.env.LOG_LEVEL : process.env.NEXT_PUBLIC_LOG_LEVEL) as LogLevel || 'info'
);

// Create specialized loggers
export const authLogger = defaultLogger.child({ category: 'auth' });
export const securityLogger = defaultLogger.child({ category: 'security' });
export const performanceLogger = defaultLogger.child({ category: 'performance' });

// Export the logger instance as default
export const logger = defaultLogger;

// Export types
export * from './types';