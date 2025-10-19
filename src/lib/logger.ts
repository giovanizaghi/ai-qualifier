/**
 * Application logging utility with structured logging support
 * Supports different log levels and integrates with external monitoring services
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    duration?: number;
    memory?: number;
  };
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private context: LogContext = {};

  private constructor() {
    this.logLevel = this.getLogLevelFromEnv();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      case 'FATAL':
        return LogLevel.FATAL;
      default:
        return process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(level: LogLevel, message: string, additionalContext?: Partial<LogContext>, error?: Error): LogEntry {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...additionalContext },
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        ...(error.stack && { stack: error.stack }),
      };
    }

    // Add performance metrics if available
    if (typeof window !== 'undefined' && window.performance) {
      logEntry.performance = {
        memory: (performance as any).memory?.usedJSHeapSize,
      };
    }

    return logEntry;
  }

  private async sendToExternalService(logEntry: LogEntry): Promise<void> {
    // Only send important logs to external services in production
    if (process.env.NODE_ENV !== 'production' || logEntry.level < LogLevel.WARN) {
      return;
    }

    try {
      // TODO: Replace with actual logging service (e.g., Sentry, LogRocket, DataDog)
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        // Example Sentry integration
        // Sentry.addBreadcrumb({
        //   message: logEntry.message,
        //   level: this.mapLogLevelToSentry(logEntry.level),
        //   data: logEntry.context,
        // });
      }

      // Send to custom logging endpoint
      if (process.env.NEXT_PUBLIC_LOGGING_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_LOGGING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logEntry),
        }).catch(() => {
          // Silently fail to prevent logging errors from affecting the application
        });
      }
    } catch {
      // Silently fail - logging should never break the application
    }
  }

  private formatLogForConsole(logEntry: LogEntry): void {
    const levelColors = {
      [LogLevel.DEBUG]: 'color: gray',
      [LogLevel.INFO]: 'color: blue',
      [LogLevel.WARN]: 'color: orange',
      [LogLevel.ERROR]: 'color: red',
      [LogLevel.FATAL]: 'color: red; font-weight: bold',
    };

    const levelNames = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.ERROR]: 'ERROR',
      [LogLevel.FATAL]: 'FATAL',
    };

    const style = levelColors[logEntry.level];
    const prefix = `[${levelNames[logEntry.level]}] ${logEntry.timestamp}`;

    if (logEntry.error) {
      console.error(`%c${prefix}`, style, logEntry.message, logEntry.context, logEntry.error);
    } else if (logEntry.level >= LogLevel.ERROR) {
      console.error(`%c${prefix}`, style, logEntry.message, logEntry.context);
    } else if (logEntry.level >= LogLevel.WARN) {
      console.warn(`%c${prefix}`, style, logEntry.message, logEntry.context);
    } else {
      console.log(`%c${prefix}`, style, logEntry.message, logEntry.context);
    }
  }

  private log(level: LogLevel, message: string, context?: Partial<LogContext>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = this.createLogEntry(level, message, context, error);

    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.formatLogForConsole(logEntry);
    }

    // Send to external services
    this.sendToExternalService(logEntry);
  }

  debug(message: string, context?: Partial<LogContext>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Partial<LogContext>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Partial<LogContext>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  // Performance logging
  time(label: string): void {
    if (typeof window !== 'undefined') {
      console.time(label);
    }
  }

  timeEnd(label: string, context?: Partial<LogContext>): void {
    if (typeof window !== 'undefined') {
      console.timeEnd(label);
      this.info(`Performance: ${label} completed`, context);
    }
  }

  // Structured performance logging
  async measureAsync<T>(
    label: string, 
    fn: () => Promise<T>, 
    context?: Partial<LogContext>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Performance: ${label} completed`, {
        ...context,
        metadata: { ...context?.metadata, duration },
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Performance: ${label} failed`, error instanceof Error ? error : new Error(String(error)), {
        ...context,
        metadata: { ...context?.metadata, duration },
      });
      throw error;
    }
  }
}

// Create singleton instance
const logger = Logger.getInstance();

// Export convenient functions
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  fatal: logger.fatal.bind(logger),
  time: logger.time.bind(logger),
  timeEnd: logger.timeEnd.bind(logger),
  measureAsync: logger.measureAsync.bind(logger),
  setContext: logger.setContext.bind(logger),
  clearContext: logger.clearContext.bind(logger),
};

// React hook for component-level logging
export function useLogger(componentName: string) {
  const componentLogger = {
    debug: (message: string, context?: Partial<LogContext>) =>
      logger.debug(message, { ...context, component: componentName }),
    info: (message: string, context?: Partial<LogContext>) =>
      logger.info(message, { ...context, component: componentName }),
    warn: (message: string, context?: Partial<LogContext>) =>
      logger.warn(message, { ...context, component: componentName }),
    error: (message: string, error?: Error, context?: Partial<LogContext>) =>
      logger.error(message, error, { ...context, component: componentName }),
    fatal: (message: string, error?: Error, context?: Partial<LogContext>) =>
      logger.fatal(message, error, { ...context, component: componentName }),
  };

  return componentLogger;
}

// API route logging middleware
export function withLogging<T extends (...args: any[]) => any>(
  handler: T,
  handlerName: string
): T {
  return ((...args: Parameters<T>) => {
    const start = Date.now();
    logger.setContext({ action: handlerName });

    try {
      const result = handler(...args);
      
      if (result instanceof Promise) {
        return result
          .then((res) => {
            const duration = Date.now() - start;
            logger.info(`API: ${handlerName} completed`, {
              metadata: { duration, status: 'success' },
            });
            return res;
          })
          .catch((error) => {
            const duration = Date.now() - start;
            logger.error(`API: ${handlerName} failed`, error, {
              metadata: { duration, status: 'error' },
            });
            throw error;
          })
          .finally(() => {
            logger.clearContext();
          });
      } else {
        const duration = Date.now() - start;
        logger.info(`API: ${handlerName} completed`, {
          metadata: { duration, status: 'success' },
        });
        logger.clearContext();
        return result;
      }
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`API: ${handlerName} failed`, error instanceof Error ? error : new Error(String(error)), {
        metadata: { duration, status: 'error' },
      });
      logger.clearContext();
      throw error;
    }
  }) as T;
}

export default logger;