import { log } from "../vite";

export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

interface ErrorLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
  details?: any;
}

/**
 * ErrorLogger provides structured error logging throughout the application
 */
export class ErrorLogger {
  private static logBuffer: ErrorLogEntry[] = [];
  private static MAX_BUFFER_SIZE = 100;
  
  /**
   * Log an error message
   * @param level The severity level of the error
   * @param message The error message
   * @param source The component or module where the error occurred
   * @param details Additional error details (object, error instance, etc.)
   */
  static logError(level: LogLevel, message: string, source: string, details?: any): void {
    // Create log entry
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      details: details ? this.sanitizeErrorDetails(details) : undefined
    };
    
    // Add to buffer with circular buffer behavior
    if (this.logBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift(); // Remove oldest entry
    }
    this.logBuffer.push(entry);
    
    // Format and output the log
    const formattedMessage = `[${entry.level}] ${entry.source}: ${entry.message}`;
    
    // Use the existing log function for consistency
    switch (level) {
      case LogLevel.INFO:
        log(formattedMessage, 'error-logger');
        break;
      case LogLevel.WARNING:
        log(`⚠️ ${formattedMessage}`, 'error-logger');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        log(`❌ ${formattedMessage}`, 'error-logger');
        console.error(formattedMessage, details || '');
        break;
    }
  }
  
  /**
   * Convenience method for logging database errors
   * @param operation The database operation that failed
   * @param error The error that occurred
   * @param entityId Optional ID of the entity being operated on
   */
  static logDatabaseError(operation: string, error: any, entityId?: number | string): void {
    let errorMessage = `Database error during ${operation}`;
    if (entityId !== undefined) {
      errorMessage += ` (ID: ${entityId})`;
    }
    
    this.logError(
      LogLevel.ERROR,
      errorMessage,
      'Database',
      error
    );
  }
  
  /**
   * Get recent error logs (useful for admin dashboard)
   * @param count The number of recent logs to retrieve
   * @param level Optional filter by log level
   */
  static getRecentLogs(count = 20, level?: LogLevel): ErrorLogEntry[] {
    let logs = [...this.logBuffer];
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    // Return most recent logs first
    return logs.reverse().slice(0, count);
  }
  
  /**
   * Sanitize error details to prevent sensitive data leakage
   * @param details The error details to sanitize
   */
  private static sanitizeErrorDetails(details: any): any {
    if (details instanceof Error) {
      return {
        name: details.name,
        message: details.message,
        stack: details.stack,
      };
    }
    
    // For objects, perform a deep copy and sanitize
    if (typeof details === 'object' && details !== null) {
      const sanitized = { ...details };
      
      // Remove potentially sensitive fields
      const sensitiveFields = ['password', 'secret', 'token', 'apiKey', 'api_key'];
      
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      }
      
      return sanitized;
    }
    
    return details;
  }
}

/**
 * Convenience functions for logging
 */
export const logInfo = (message: string, source: string, details?: any) => 
  ErrorLogger.logError(LogLevel.INFO, message, source, details);

export const logWarning = (message: string, source: string, details?: any) => 
  ErrorLogger.logError(LogLevel.WARNING, message, source, details);

export const logError = (message: string, source: string, details?: any) => 
  ErrorLogger.logError(LogLevel.ERROR, message, source, details);

export const logCritical = (message: string, source: string, details?: any) => 
  ErrorLogger.logError(LogLevel.CRITICAL, message, source, details);

export const logDbError = (operation: string, error: any, entityId?: number | string) => 
  ErrorLogger.logDatabaseError(operation, error, entityId);