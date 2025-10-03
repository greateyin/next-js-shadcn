// lib/serverLogger.ts

// Check if server-side logging is enabled via environment variable
const isServerLoggingEnabled = typeof process !== 'undefined' && 
  (process.env.SERVER_SIDE_LOG_ON === 'true' || process.env.NEXT_PUBLIC_SERVER_SIDE_LOG_ON === 'true');

export const logger = {
  info: (message: string, meta?: unknown) => {
    if (!isServerLoggingEnabled) return;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message: string, meta?: unknown) => {
    if (!isServerLoggingEnabled) return;
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, meta?: unknown) => {
    if (!isServerLoggingEnabled) return;
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  debug: (message: string, meta?: unknown) => {
    if (!isServerLoggingEnabled) return;
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
  }
};