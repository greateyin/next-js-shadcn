/**
 * @fileoverview Type definitions for logging system
 * @module logger/types
 */

import { LOG_LEVELS, LOG_CATEGORIES } from './constants';

/** Available log levels type */
export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

/** Log categories type */
export type LogCategory = typeof LOG_CATEGORIES[keyof typeof LOG_CATEGORIES];

/** Base metadata interface for all logs */
export interface BaseMetadata {
    timestamp?: string;
    category?: LogCategory;
    action?: string;
    status?: string;
    requestId?: string;
    userId?: string;
    duration?: number;
}

/** Error metadata interface */
export interface ErrorMetadata extends BaseMetadata {
    error: Error | unknown;
    stack?: string;
    code?: string | number;
}

/** Performance metadata interface */
export interface PerformanceMetadata extends BaseMetadata {
    duration: number;
    operation: string;
    resource?: string;
}

/** Security metadata interface */
export interface SecurityMetadata extends BaseMetadata {
    ip?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    attemptCount?: number;
}

/** Logger configuration interface */
export interface LoggerConfig {
    appName: string;
    environment: string;
    version: string;
    level: LogLevel;
    elasticsearchUrl?: string;
    defaultMeta?: BaseMetadata;
}

/** Log formatter options */
export interface FormatterOptions {
    colorize?: boolean;
    includeTimestamp?: boolean;
    timestampFormat?: string;
}
