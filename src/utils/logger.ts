/**
 * CENTRALIZED LOGGING UTILITY
 * Provides structured logging with levels and context
 * Replaces raw console.log, console.error, etc.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  module?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  [key: string]: any; // Allow additional properties
}

class Logger {
  private isDev = import.meta.env.DEV;
  private minLevel: LogLevel = this.isDev ? 'debug' : 'warn';

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = (context?.timestamp || new Date()).toISOString();
    const module = context?.module ? `[${context.module}]` : '';
    const action = context?.action ? `(${context.action})` : '';
    return `${timestamp} ${level.toUpperCase()} ${module} ${action}: ${message}`.trim();
  }

  debug(message: string, context?: LogContext, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context), data);
    }
  }

  info(message: string, context?: LogContext, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context), data);
    }
  }

  warn(message: string, context?: LogContext, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context), data);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        this.formatMessage('error', message, context),
        error instanceof Error ? error.stack : errorMessage
      );
    }
  }

  /**
   * Log API requests and responses
   */
  logApiCall(
    method: string,
    endpoint: string,
    status?: number,
    duration?: number,
    context?: LogContext
  ): void {
    const message = `${method} ${endpoint}${status ? ` [${status}]` : ''}${duration ? ` (${duration}ms)` : ''}`;
    const level = status && status >= 400 ? 'warn' : 'debug';
    
    if (level === 'warn') {
      this.warn(message, context);
    } else {
      this.debug(message, context);
    }
  }

  /**
   * Log Firebase operations
   */
  logFirebaseOp(
    operation: string,
    collection: string,
    status: 'start' | 'success' | 'error',
    details?: unknown,
    context?: LogContext
  ): void {
    const message = `Firebase ${operation} [${collection}] - ${status}`;
    const level = status === 'error' ? 'error' : status === 'success' ? 'info' : 'debug';
    
    if (level === 'error') {
      this.error(message, details, context);
    } else if (level === 'info') {
      this.info(message, context, details);
    } else {
      this.debug(message, context, details);
    }
  }

  /**
   * Log authentication events
   */
  logAuthEvent(
    event: 'login' | 'logout' | 'signup' | 'error',
    userId?: string,
    details?: unknown
  ): void {
    const context: LogContext = { module: 'Auth', action: event, userId };
    
    if (event === 'error') {
      this.error('Authentication failed', details, context);
    } else {
      this.info(`User ${event}${userId ? ` (${userId})` : ''}`, context, details);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Also export type for context creation
export type { LogContext };
