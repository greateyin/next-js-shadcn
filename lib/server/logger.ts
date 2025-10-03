/**
 * @fileoverview Server-side logger implementation
 * @module lib/server/logger
 */

interface LoggerConfig {
    environment: string;
    appName: string;
}

interface Logger {
    error: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    info: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
    child: (meta: any) => Logger;
}

const createLogger = (config: LoggerConfig): Logger => {
    const { environment, appName } = config;

    const formatMessage = (level: string, message: string, meta?: any) => {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}] ${appName}: ${message} ${metaStr}`;
    };

    const logger: Logger = {
        error: (message: string, meta?: any) => console.error(formatMessage('error', message, meta)),
        warn: (message: string, meta?: any) => console.warn(formatMessage('warn', message, meta)),
        info: (message: string, meta?: any) => console.info(formatMessage('info', message, meta)),
        debug: (message: string, meta?: any) => {
            if (environment === 'development') {
                console.debug(formatMessage('debug', message, meta));
            }
        },
        child: (meta: any) => {
            return {
                error: (message: string, extraMeta?: any) => logger.error(message, { ...meta, ...extraMeta }),
                warn: (message: string, extraMeta?: any) => logger.warn(message, { ...meta, ...extraMeta }),
                info: (message: string, extraMeta?: any) => logger.info(message, { ...meta, ...extraMeta }),
                debug: (message: string, extraMeta?: any) => logger.debug(message, { ...meta, ...extraMeta }),
                child: (childMeta: any) => logger.child({ ...meta, ...childMeta }),
            };
        },
    };

    return logger;
};

// Create a logger instance
const baseLogger = createLogger({
    environment: process.env.NODE_ENV || 'development',
    appName: 'auth-service',
});

// Create an auth-specific logger
export const authLogger = baseLogger.child({
    component: 'auth',
    version: process.env.APP_VERSION || '1.0.0',
});
