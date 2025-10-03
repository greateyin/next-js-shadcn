/**
 * Type definition for log levels.
 * @typedef {'INFO' | 'WARN' | 'ERROR' | 'DEBUG'} LogLevel
 */
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

// Check if client-side logging is enabled via environment variable
const isClientLoggingEnabled = typeof process !== 'undefined' && 
  process.env.NEXT_PUBLIC_CLIENT_SIDE_LOG_ON === 'true';

/**
 * ClientLogger class for logging messages in the client.
 */
class ClientLogger {
    private static instance: ClientLogger;
    private isEnabled: boolean;

    /**
     * Private constructor to enforce singleton pattern.
     */
    private constructor() {
        this.isEnabled = isClientLoggingEnabled;
    }

    /**
     * Gets the single instance of the ClientLogger.
     * @returns {ClientLogger} The singleton instance of the ClientLogger.
     */
    public static getInstance(): ClientLogger {
        if (!ClientLogger.instance) {
            ClientLogger.instance = new ClientLogger();
        }
        return ClientLogger.instance;
    }

    /**
     * Logs a message with a specified level and optional metadata.
     * @param {LogLevel} level - The level of the log message.
     * @param {string} message - The log message.
     * @param {Record<string, unknown>} [metadata] - Optional metadata to include with the log message.
     */
    public log(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
        if (!this.isEnabled) return;

        const timestamp = new Date().toISOString();

        // Log to console in the client with appropriate method
        switch(level) {
            case 'INFO':
                console.info(`[${timestamp}] ${level}: ${message}`, metadata || {});
                break;
            case 'WARN':
                console.warn(`[${timestamp}] ${level}: ${message}`, metadata || {});
                break;
            case 'ERROR':
                console.error(`[${timestamp}] ${level}: ${message}`, metadata || {});
                break;
            case 'DEBUG':
                console.debug(`[${timestamp}] ${level}: ${message}`, metadata || {});
                break;
            default:
                console.log(`[${timestamp}] ${level}: ${message}`, metadata || {});
        }
    }

    /**
     * Logs an info message.
     * @param {string} message - The info message.
     * @param {Record<string, unknown>} [metadata] - Optional metadata to include with the log message.
     */
    public info(message: string, metadata?: Record<string, unknown>) {
        this.log('INFO', message, metadata);
    }

    /**
     * Logs a warning message.
     * @param {string} message - The warning message.
     * @param {Record<string, unknown>} [metadata] - Optional metadata to include with the log message.
     */
    public warn(message: string, metadata?: Record<string, unknown>) {
        this.log('WARN', message, metadata);
    }

    /**
     * Logs an error message.
     * @param {string} message - The error message.
     * @param {Record<string, unknown>} [metadata] - Optional metadata to include with the log message.
     */
    public error(message: string, metadata?: Record<string, unknown>) {
        this.log('ERROR', message, metadata);
    }

    /**
     * Logs a debug message.
     * @param {string} message - The debug message.
     * @param {Record<string, unknown>} [metadata] - Optional metadata to include with the log message.
     */
    public debug(message: string, metadata?: Record<string, unknown>) {
        this.log('DEBUG', message, metadata);
    }
}

/**
 * The singleton instance of the ClientLogger.
 * @type {ClientLogger}
 */
export const clientLogger = ClientLogger.getInstance();