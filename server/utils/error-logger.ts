
import { log } from "../vite";

export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export enum LogCategory {
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  USER_ACTIVITY = 'USER_ACTIVITY',
  SYSTEM = 'SYSTEM',
  AUDIT = 'AUDIT'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  source: string;
  details?: any;
  userId?: number;
}

export class ErrorLogger {
  private static logBuffer: LogEntry[] = [];
  private static MAX_BUFFER_SIZE = 1000;
  private static SENSITIVE_FIELDS = [
    'password', 'secret', 'token', 'apiKey', 'api_key', 
    'creditCard', 'ssn', 'email', 'phone', 'address'
  ];
  
  static logActivity(
    level: LogLevel,
    category: LogCategory,
    message: string,
    source: string,
    details?: any,
    userId?: number
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      source,
      details: details ? this.sanitizeData(details) : undefined,
      userId: userId
    };
    
    this.addToBuffer(entry);
    this.outputLog(entry);
  }

  private static addToBuffer(entry: LogEntry): void {
    if (this.logBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift();
    }
    this.logBuffer.push(entry);
  }

  private static outputLog(entry: LogEntry): void {
    const formattedMessage = `[${entry.level}][${entry.category}] ${entry.source}: ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.INFO:
        log(formattedMessage, 'logger');
        break;
      case LogLevel.WARNING:
        log(`⚠️ ${formattedMessage}`, 'logger');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        log(`❌ ${formattedMessage}`, 'logger');
        console.error(formattedMessage, entry.details || '');
        break;
    }
  }

  private static sanitizeData(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      for (const field of this.SENSITIVE_FIELDS) {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      }

      // Remove potentially sensitive URL parameters
      if (sanitized.url) {
        try {
          const url = new URL(sanitized.url);
          url.search = '[REDACTED]';
          sanitized.url = url.toString();
        } catch (e) {
          // Not a valid URL, leave as is
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  private static hashIdentifier(id: number | string): string {
    // In production, use a proper hashing function
    return `hashed_${id}`;
  }

  static getRecentLogs(
    count = 20,
    level?: LogLevel,
    category?: LogCategory
  ): LogEntry[] {
    let logs = [...this.logBuffer];
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    if (category) {
      logs = logs.filter(log => log.category === category);
    }
    
    return logs.reverse().slice(0, count);
  }

  // Convenience methods for different log types
  static logPerformance(operation: string, duration: number, details?: any): void {
    this.logActivity(
      LogLevel.INFO,
      LogCategory.PERFORMANCE,
      `Operation ${operation} took ${duration}ms`,
      'Performance',
      details
    );
  }

  static logUserActivity(action: string, userId: number, details?: any): void {
    this.logActivity(
      LogLevel.INFO,
      LogCategory.USER_ACTIVITY,
      `User performed action: ${action}`,
      'UserActivity',
      details,
      userId
    );
  }

  static logAudit(action: string, userId: number, details?: any): void {
    this.logActivity(
      LogLevel.INFO,
      LogCategory.AUDIT,
      `Audit: ${action}`,
      'AuditLog',
      details,
      userId
    );
  }

  static logSecurity(event: string, details?: any, userId?: number): void {
    this.logActivity(
      LogLevel.WARNING,
      LogCategory.SECURITY,
      `Security event: ${event}`,
      'Security',
      details,
      userId
    );
  }
}

// Export convenience functions
export const logInfo = (message: string, source: string, details?: any) => 
  ErrorLogger.logActivity(LogLevel.INFO, LogCategory.SYSTEM, message, source, details);

export const logWarning = (message: string, source: string, details?: any) => 
  ErrorLogger.logActivity(LogLevel.WARNING, LogCategory.SYSTEM, message, source, details);

export const logError = (message: string, source: string, details?: any) => 
  ErrorLogger.logActivity(LogLevel.ERROR, LogCategory.SYSTEM, message, source, details);

export const logCritical = (message: string, source: string, details?: any) => 
  ErrorLogger.logActivity(LogLevel.CRITICAL, LogCategory.SYSTEM, message, source, details);

export const logDbError = (operation: string, error: any, entityId?: number) => 
  ErrorLogger.logActivity(LogLevel.ERROR, LogCategory.SYSTEM, `Database error during ${operation}`, 'Database', { error, entityId });
