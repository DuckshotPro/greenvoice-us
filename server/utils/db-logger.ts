
import { storage } from '../models/storage';
import { logInfo, logError } from './logger';

/**
 * DBLogger provides methods for logging database operations
 * This helps with debugging, performance monitoring, and auditing
 */
export class DBLogger {
  private static readonly SOURCE = 'Database';
  
  /**
   * Log a database query
   * @param operation The database operation (e.g., SELECT, INSERT)
   * @param table The table being accessed
   * @param duration Time taken for the operation in milliseconds
   * @param details Additional details about the operation
   */
  static logQuery(
    operation: string,
    table: string,
    duration: number,
    details?: Record<string, any>
  ): void {
    logInfo(
      `DB ${operation} on ${table} (${duration}ms)`,
      this.SOURCE,
      details
    );
    
    // For performance monitoring, log slower queries at a higher level
    if (duration > 500) {
      logError(
        `Slow DB ${operation} on ${table} (${duration}ms)`,
        this.SOURCE,
        details
      );
    }
  }
  
  /**
   * Log a database error
   * @param operation The database operation that failed
   * @param table The table being accessed
   * @param error The error that occurred
   * @param details Additional details about the operation
   */
  static logError(
    operation: string,
    table: string,
    error: unknown,
    details?: Record<string, any>
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logError(
      `DB Error in ${operation} on ${table}: ${errorMessage}`,
      this.SOURCE,
      {
        ...details,
        errorStack
      }
    );
  }
  
  /**
   * Log a database transaction
   * @param status Status of the transaction (started, committed, rolled back)
   * @param details Additional details about the transaction
   */
  static logTransaction(
    status: 'started' | 'committed' | 'rolled_back',
    details?: Record<string, any>
  ): void {
    logInfo(
      `Transaction ${status}`,
      this.SOURCE,
      details
    );
  }
  
  /**
   * Log a database schema change
   * @param operation The schema operation (e.g., CREATE TABLE, ALTER TABLE)
   * @param object The database object being modified
   * @param details Additional details about the operation
   */
  static logSchemaChange(
    operation: string,
    object: string,
    details?: Record<string, any>
  ): void {
    logInfo(
      `Schema change: ${operation} ${object}`,
      this.SOURCE,
      details
    );
    
    // Store schema changes for auditing
    try {
      storage.storeSchemaChange({
        operation,
        object,
        timestamp: new Date().toISOString(),
        details: details ? JSON.stringify(details) : undefined
      });
    } catch (error) {
      console.error('Failed to store schema change:', error);
    }
  }
  
  /**
   * Log a database connection event
   * @param status Status of the connection (connected, disconnected)
   * @param details Additional details about the connection
   */
  static logConnection(
    status: 'connected' | 'disconnected' | 'failed',
    details?: Record<string, any>
  ): void {
    if (status === 'failed') {
      logError(
        `Database connection ${status}`,
        this.SOURCE,
        details
      );
    } else {
      logInfo(
        `Database connection ${status}`,
        this.SOURCE,
        details
      );
    }
  }
}

// Export pre-configured loggers for common database operations
export const dbLoggers = {
  query: (operation: string, table: string, duration: number, details?: Record<string, any>) =>
    DBLogger.logQuery(operation, table, duration, details),
    
  error: (operation: string, table: string, error: unknown, details?: Record<string, any>) =>
    DBLogger.logError(operation, table, error, details),
    
  transaction: (status: 'started' | 'committed' | 'rolled_back', details?: Record<string, any>) =>
    DBLogger.logTransaction(status, details),
    
  schemaChange: (operation: string, object: string, details?: Record<string, any>) =>
    DBLogger.logSchemaChange(operation, object, details),
    
  connection: (status: 'connected' | 'disconnected' | 'failed', details?: Record<string, any>) =>
    DBLogger.logConnection(status, details)
};
