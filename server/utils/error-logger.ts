/**
 * A centralized logging utility that provides consistent log formatting
 * with various severity levels and contextual information.
 */

export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  DEBUG = 'DEBUG',
  PERFORMANCE = 'PERFORMANCE'
}

export enum LogCategory {
  SYSTEM = 'SYSTEM',
  DATABASE = 'DATABASE',
  AUTH = 'AUTH',
  API = 'API',
  PAYMENT = 'PAYMENT',
  SCHEDULER = 'SCHEDULER'
}

type LogSource = string;
type LogDetails = Record<string, any>;

/**
 * Format a log message with timestamp, level, source, and message
 */
function formatLogMessage(level: LogLevel, source: LogSource, message: string): string {
  const timestamp = new Date().toLocaleTimeString();
  return `${timestamp} [logger] ${level === LogLevel.ERROR || level === LogLevel.WARNING ? '⚠️ ' : ''}[${level}][${source}] ${message}`;
}

/**
 * Log an informational message
 * @param message The message to log
 * @param source The source of the log (component, service, etc.)
 * @param details Optional additional details
 */
export function logInfo(message: string, source: LogSource = 'SYSTEM', details?: LogDetails): void {
  console.log(formatLogMessage(LogLevel.INFO, source, message));
  if (details) {
    console.log(details);
  }
}

/**
 * Log a warning message
 * @param message The warning message
 * @param source The source of the log
 * @param details Optional additional details
 */
export function logWarning(message: string, source: LogSource = 'SYSTEM', details?: LogDetails): void {
  console.warn(formatLogMessage(LogLevel.WARNING, source, message));
  if (details) {
    console.warn(details);
  }
}

/**
 * Log an error message
 * @param message The error message
 * @param source The source of the log
 * @param details Optional additional details, like the error object
 */
export function logError(message: string, source: LogSource = 'SYSTEM', details?: LogDetails): void {
  console.error(formatLogMessage(LogLevel.ERROR, source, message));
  if (details && details.error) {
    console.error(details.error);
  } else if (details) {
    console.error(details);
  }
}

/**
 * Log a database-specific error message
 * @param message The error message
 * @param source The source of the log
 * @param details Optional additional details, like SQL query info
 */
export function logDbError(message: string, source: LogSource = 'DATABASE', details?: LogDetails): void {
  console.error(formatLogMessage(LogLevel.ERROR, source, `DB ERROR: ${message}`));
  if (details) {
    console.error(details);
  }
}

/**
 * Log a debug message (only in development)
 * @param message The debug message
 * @param source The source of the log
 * @param details Optional additional details
 */
export function logDebug(message: string, source: LogSource = 'DEBUG', details?: LogDetails): void {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(formatLogMessage(LogLevel.DEBUG, source, message));
    if (details) {
      console.debug(details);
    }
  }
}

/**
 * Log performance metrics
 * @param message The performance message
 * @param source The source of the log
 * @param details Optional additional timing details
 */
export function logPerformance(message: string, source: LogSource = 'PERFORMANCE', details?: LogDetails): void {
  console.log(formatLogMessage(LogLevel.PERFORMANCE, source, message));
  if (details) {
    console.log(details);
  }
}

/**
 * Create a performance timer
 * @param operationName Name of the operation being timed
 * @returns A function to call when the operation is complete
 */
export function createTimer(operationName: string): () => void {
  const startTime = performance.now();
  return () => {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    logPerformance(`Operation ${operationName} took ${duration}ms`, 'Performance', { 
      operation: operationName,
      durationMs: duration,
      startTime,
      endTime
    });
  };
}

/**
 * Static logger class for maintaining compatibility with existing logger implementation
 */
export class ErrorLogger {
  /**
   * Log an activity with the specified level, category, and details
   */
  static logActivity(
    level: LogLevel,
    category: LogCategory,
    message: string,
    source: string,
    details?: any
  ): void {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp} [logger] ${level === LogLevel.ERROR || level === LogLevel.WARNING ? '⚠️ ' : ''}[${level}][${source}] ${message}`;
    
    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(logMessage);
        if (details) console.error(details);
        break;
      case LogLevel.WARNING:
        console.warn(logMessage);
        if (details) console.warn(details);
        break;
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV !== 'production') {
          console.debug(logMessage);
          if (details) console.debug(details);
        }
        break;
      case LogLevel.INFO:
      case LogLevel.PERFORMANCE:
      default:
        console.log(logMessage);
        if (details) console.log(details);
        break;
    }
  }
}