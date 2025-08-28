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
 * Log an audit event
 * @param message The message to log
 * @param userId The user who performed the action
 * @param details Additional details to include in the log
 */
export function logAudit(message: string, userId: number, details?: any): void {
  ErrorLogger.logAudit(message, userId, details);
}

/**
 * Logger object with methods for various log levels
 */
export const logger = {
  info: logInfo,
  warning: logWarning,
  error: logError,
  critical: logCritical,
  audit: logAudit
};