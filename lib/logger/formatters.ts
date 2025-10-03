/**
 * @fileoverview Custom formatters for Winston logger
 * @module logger/formatters
 */

import winston from 'winston';
import { FormatterOptions } from './types';

/**
 * Creates a custom console formatter
 * @param {FormatterOptions} options - Formatter options
 * @returns {winston.Logform.Format} Winston format
 */
export const createConsoleFormatter = (options: FormatterOptions = {}): winston.Logform.Format => {
    const {
        colorize = true,
        includeTimestamp = true,
        timestampFormat = 'YYYY-MM-DD HH:mm:ss',
    } = options;

    const formats = [
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
    ];

    if (colorize) {
        formats.push(winston.format.colorize());
    }

    if (includeTimestamp) {
        formats.push(winston.format.timestamp({ format: timestampFormat }));
    }

    formats.push(
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
            let output = '';

            if (timestamp) {
                output += `${timestamp} `;
            }

            output += `[${level}] ${message}`;

            if (Object.keys(metadata).length > 0) {
                const metaString = JSON.stringify(metadata, null, 2);
                output += `\n${metaString}`;
            }

            return output;
        })
    );

    return winston.format.combine(...formats);
};

/**
 * Creates a custom Elasticsearch formatter
 * @returns {winston.Logform.Format} Winston format
 */
export const createElasticsearchFormatter = (): winston.Logform.Format => {
    return winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info: any) => {
            // Add additional fields for Elasticsearch
            info['@timestamp'] = info.timestamp;
            info.fields = {
                ...(info.metadata || {}),
                level: info.level,
                message: info.message,
            };
            return info;
        })()
    );
};
