/**
 * Configuration interface for the logger
 * @interface LoggerConfig
 */
interface LoggerConfig {
    /** Application environment (development/production) */
    environment: string;
    /** Application name for log identification */
    appName: string;
}

/**
 * Logger interface defining the available logging methods
 */
interface Logger {
    info(message: string, meta?: Record<string, any>): void;
    error(message: string, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    debug(message: string, meta?: Record<string, any>): void;
}

/**
 * Creates a basic console logger
 */
const createLogger = (config: LoggerConfig): Logger => {
    const { environment, appName } = config;
    const isDev = environment === 'development';

    const formatMessage = (level: string, message: string, meta?: Record<string, any>) => {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}] ${appName}: ${message}${metaStr}`;
    };

    return {
        info: (message: string, meta?: Record<string, any>) => {
            console.log(formatMessage('INFO', message, meta));
        },
        error: (message: string, meta?: Record<string, any>) => {
            console.error(formatMessage('ERROR', message, meta));
        },
        warn: (message: string, meta?: Record<string, any>) => {
            console.warn(formatMessage('WARN', message, meta));
        },
        debug: (message: string, meta?: Record<string, any>) => {
            if (isDev) {
                console.debug(formatMessage('DEBUG', message, meta));
            }
        },
    };
};

/**
 * Application logger instance
 */
const defaultConfig: LoggerConfig = {
    environment: process.env.NODE_ENV || 'development',
    appName: 'NextAuth',
};

export const logger = createLogger(defaultConfig);
