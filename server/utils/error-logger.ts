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
/**
 * Interface for log entry objects
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  source: string;
  message: string;
  details?: any;
}

export class ErrorLogger {
  // Array to store log entries
  private static logEntries: LogEntry[] = [];
  private static MAX_LOGS = 1000; // Maximum logs to store in memory
  private static isShippingEnabled = !!process.env.LOG_SHIP_URL;
  private static shipUrl = process.env.LOG_SHIP_URL || '';
  private static shipToken = process.env.LOG_SHIP_TOKEN || '';
  
  /**
   * Sanitize data by removing sensitive information
   */
  static sanitizeData(data: Record<string, any>): Record<string, any> {
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // List of sensitive fields to mask
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization', 
      'auth', 'credential', 'cookie', 'session', 'jwt'
    ];
    
    // Recursively sanitize the object
    const sanitizeObject = (obj: Record<string, any>) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        // Check if the key contains any sensitive information
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          // Recursively sanitize nested objects
          sanitizeObject(obj[key]);
        }
      });
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }
  
  /**
   * Log performance metrics for endpoints/operations
   * @param operation Description of the operation being measured
   * @param durationMs Duration in milliseconds
   * @param details Additional context about the operation
   */
  static logPerformance(operation: string, durationMs: number, details?: Record<string, any>): void {
    const level = durationMs > 500 ? LogLevel.WARNING : LogLevel.PERFORMANCE;
    const message = `${operation} took ${durationMs}ms to complete`;
    
    this.logActivity(
      level,
      LogCategory.SYSTEM,
      message,
      'Performance',
      details
    );
    
    // Also store in the performance metrics system
    if (durationMs > 500) {
      this.storeLogEntry({
        timestamp: new Date(),
        level,
        source: 'Performance',
        message,
        details
      });
    }
  }

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
    const timestamp = new Date();
    const logMessage = `${timestamp.toLocaleTimeString()} [logger] ${level === LogLevel.ERROR || level === LogLevel.WARNING ? '⚠️ ' : ''}[${level}][${source}] ${message}`;
    
    // Store log entry in memory
    this.storeLogEntry({
      timestamp,
      level,
      source,
      message,
      details
    });
    
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
  
  /**
   * Store a log entry in memory
   */
  private static storeLogEntry(entry: LogEntry): void {
    this.logEntries.push(entry);
    
    // Maintain max log size by removing oldest entries
    if (this.logEntries.length > this.MAX_LOGS) {
      this.logEntries = this.logEntries.slice(-this.MAX_LOGS);
    }

    // Best-effort shipping for important logs
    try {
      shipIfNeeded(entry);
    } catch (_) {
      // Do not throw from logger
    }
  }
  
  /**
   * Get recent logs, optionally filtered by level
   */
  static getRecentLogs(count: number = 100, level?: LogLevel): LogEntry[] {
    // If level is specified, filter logs by level
    const filteredLogs = level 
      ? this.logEntries.filter(log => log.level === level)
      : this.logEntries;
      
    // Return most recent logs based on count
    return filteredLogs.slice(-count).reverse();
  }
}

// Ship logs offsite if configured and criteria match
function shipIfNeeded(entry: LogEntry) {
  const isShippingEnabled = !!process.env.LOG_SHIP_URL;
  const shipUrl = process.env.LOG_SHIP_URL || '';
  const shipToken = process.env.LOG_SHIP_TOKEN || '';
  if (!isShippingEnabled) return;

  const shouldShip = (
    entry.level === LogLevel.ERROR ||
    entry.level === LogLevel.CRITICAL ||
    entry.level === LogLevel.WARNING ||
    entry.source === 'Audit'
  );
  if (!shouldShip) return;

  const payload = {
    timestamp: entry.timestamp.toISOString(),
    level: entry.level,
    source: entry.source,
    message: entry.message,
    details: entry.details ?? null
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (shipToken) headers['Authorization'] = `Bearer ${shipToken}`;
  if (typeof fetch === 'function') {
    setTimeout(() => {
      void fetch(shipUrl, { method: 'POST', headers, body: JSON.stringify(payload) }).catch(() => {});
    }, 0);
  }
}

/**
 * Audit logging wrapper for semantically important events (DB, auth, security)
 */
export function logAudit(message: string, details?: any): void {
  ErrorLogger.logActivity(
    LogLevel.INFO,
    LogCategory.DATABASE,
    message,
    'Audit',
    details
  );
}