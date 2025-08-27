
import { db } from "../models/db";
import { logInfo } from "../utils/error-logger";

/**
 * Database operation logger
 * Logs database operations for auditing and debugging
 */
export class DbLogger {
  /**
   * Log a database create operation
   * @param entity The entity name (table/collection)
   * @param userId The user who performed the action
   * @param data The data that was created (sanitized)
   * @param entityId The ID of the created entity
   */
  static logCreate(entity: string, userId: number, data: any, entityId?: number): void {
    // Sanitize data to remove sensitive fields
    const safeData = this.sanitizeData(data);
    
    logInfo(`DB create ${entity}`, 'DbLogger', {
      userId,
      action: 'create',
      entity,
      entityId,
      data: safeData
    });
  }
  
  /**
   * Log a database update operation
   * @param entity The entity name (table/collection)
   * @param userId The user who performed the action
   * @param entityId The ID of the updated entity
   * @param changes What fields were changed
   * @param previousValues Optional previous values for important fields
   */
  static logUpdate(
    entity: string, 
    userId: number, 
    entityId: number, 
    changes: string[],
    previousValues?: Record<string, any>
  ): void {
    logInfo(`DB update ${entity} #${entityId}`, 'DbLogger', {
      userId,
      action: 'update',
      entity,
      entityId,
      changedFields: changes,
      previousValues: previousValues ? this.sanitizeData(previousValues) : undefined
    });
  }
  
  /**
   * Log a database delete operation
   * @param entity The entity name (table/collection)
   * @param userId The user who performed the action
   * @param entityId The ID of the deleted entity
   */
  static logDelete(entity: string, userId: number, entityId: number): void {
    logInfo(`DB delete ${entity} #${entityId}`, 'DbLogger', {
      userId,
      action: 'delete',
      entity,
      entityId
    });
  }
  
  /**
   * Sanitize data by removing sensitive fields
   * @param data The data to sanitize
   * @returns Sanitized data
   */
  private static sanitizeData(data: any): any {
    if (!data) return data;
    
    const sensitiveFields = [
      'password', 'secret', 'token', 'apiKey', 'api_key', 
      'creditCard', 'ssn', 'email', 'phone', 'address'
    ];
    
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}
