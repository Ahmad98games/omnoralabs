/**
 * OMNORA PLATFORM LOGGER
 * 
 * Provides environment-aware observability for the rendering engine.
 */

const PREFIX = '[Omnora Engine]';

const isDev = process.env.NODE_ENV === 'development';

export const Logger = {
    debug: (message: string, ...args: unknown[]) => {
        if (isDev) console.debug(`${PREFIX} DEBUG: ${message}`, ...args);
    },
    info: (message: string, ...args: unknown[]) => {
        if (isDev) console.info(`${PREFIX} INFO: ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
        console.warn(`${PREFIX} WARNING: ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
        console.error(`${PREFIX} CRITICAL_ERROR: ${message}`, ...args);
    }
};
