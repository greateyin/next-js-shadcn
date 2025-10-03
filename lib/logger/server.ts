/**
 * @fileoverview Server-side logger implementation
 * @module logger/server
 */

import winston from 'winston';
import { LogLevel } from './types';

// Check if server-side logging is enabled via environment variable
const isServerLoggingEnabled = typeof process !== 'undefined' && 
  (process.env.SERVER_SIDE_LOG_ON === 'true' || process.env.NEXT_PUBLIC_SERVER_SIDE_LOG_ON === 'true');

// Create custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  })
);

// Create a null transport that doesn't log anything when logging is disabled
const nullTransport = new winston.transports.Console({
  silent: true
});

// Create server logger instance
const serverLogger = winston.createLogger({
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  format: customFormat,
  defaultMeta: {
    service: 'next-auth',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    isServerLoggingEnabled
      ? new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            customFormat
          ),
        })
      : nullTransport
  ],
});

// Only add Elasticsearch transport if logging is enabled and URL is defined
if (isServerLoggingEnabled && process.env.ELASTICSEARCH_URL) {
  import('winston-elasticsearch').then(({ ElasticsearchTransport }) => {
    serverLogger.add(new ElasticsearchTransport({
      level: process.env.ELASTICSEARCH_LOG_LEVEL as LogLevel || 'info',
      clientOpts: { 
        node: process.env.ELASTICSEARCH_URL,
        maxRetries: 5,
        requestTimeout: 10000
      },
      indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'nextjs-logs',
      indexSuffixPattern: 'YYYY.MM.DD',
      source: process.env.NODE_ENV || 'development'
    }));
  }).catch((error) => {
    console.error('Failed to initialize Elasticsearch transport:', error);
  });
}

export { serverLogger };