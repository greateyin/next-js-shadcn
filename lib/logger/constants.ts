/**
 * @fileoverview Logging constants and configurations
 * @module logger/constants
 */

/** Available log levels */
export const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
} as const;

/** Log categories for better organization */
export const LOG_CATEGORIES = {
    AUTH: 'auth',
    DATABASE: 'database',
    API: 'api',
    SECURITY: 'security',
    PERFORMANCE: 'performance',
} as const;

/** Standard metadata fields for structured logging */
export const METADATA_FIELDS = {
    TIMESTAMP: 'timestamp',
    LEVEL: 'level',
    MESSAGE: 'message',
    CATEGORY: 'category',
    ACTION: 'action',
    STATUS: 'status',
    ERROR: 'error',
    USER_ID: 'userId',
    REQUEST_ID: 'requestId',
    DURATION: 'duration',
} as const;

/** Elasticsearch index configuration */
export const ES_CONFIG = {
    INDEX_PREFIX: 'auth-service-logs',
    REFRESH_INTERVAL: '5s',
    NUMBER_OF_SHARDS: 1,
    NUMBER_OF_REPLICAS: 1,
} as const;

/** Default logging configuration */
export const DEFAULT_CONFIG = {
    APP_NAME: 'auth-service',
    VERSION: process.env.APP_VERSION || '1.0.0',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL,
} as const;
