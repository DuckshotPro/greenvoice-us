import { ErrorLogger, LogLevel, LogCategory } from "./error-logger";

/**
 * Logger utility functions for consistent logging across the application
 */

/**
 * Log an informational message
 * @param message The message to log
 * @param source The source component/module
 * @param details Additional details to include in the log
 */
export function logInfo(message: string, source: string, details?: any): void {
  ErrorLogger.logActivity(
    LogLevel.INFO,
    LogCategory.SYSTEM,
    message,
    source,
    details
  );
}

/**
 * Log a warning message
 * @param message The message to log
 * @param source The source component/module
 * @param details Additional details to include in the log
 */
export function logWarning(message: string, source: string, details?: any): void {
  ErrorLogger.logActivity(
    LogLevel.WARNING,
    LogCategory.SYSTEM,
    message,
    source,
    details
  );
}

/**
 * Log an error message
 * @param message The message to log
 * @param source The source component/module
 * @param details Additional details to include in the log
 */
export function logError(message: string, source: string, details?: any): void {
  ErrorLogger.logActivity(
    LogLevel.ERROR,
    LogCategory.SYSTEM,
    message,
    source,
    details
  );
}

/**
 * Log a critical error message
 * @param message The message to log
 * @param source The source component/module
 * @param details Additional details to include in the log
 */
export function logCritical(message: string, source: string, details?: any): void {
  ErrorLogger.logActivity(
    LogLevel.CRITICAL,
    LogCategory.SYSTEM,
    message,
    source,
    details
  );
}

/**
 * Logger object with methods for various log levels
 */
export const logger = {
  info: logInfo,
  warning: logWarning,
  error: logError,
  critical: logCritical,
  
  /**
   * Batch log multiple messages to reduce console spam
   */
  batch: (messages: Array<{ level: string; message: string; source?: string; details?: any }>) => {
    messages.forEach(({ level, message, source = 'SYSTEM', details }) => {
      switch (level.toLowerCase()) {
        case 'info':
          logInfo(message, source, details);
          break;
        case 'warning':
          logWarning(message, source, details);
          break;
        case 'error':
          logError(message, source, details);
          break;
        case 'critical':
          logCritical(message, source, details);
          break;
        default:
          logInfo(message, source, details);
      }
    });
  }
};