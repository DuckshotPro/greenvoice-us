import { logInfo, logError } from '../utils/error-logger';

/**
 * Audit log retention service
 * Automatically cleans up old audit logs based on configured retention period
 */
export class AuditRetentionService {
  private static instance: AuditRetentionService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): AuditRetentionService {
    if (!AuditRetentionService.instance) {
      AuditRetentionService.instance = new AuditRetentionService();
    }
    return AuditRetentionService.instance;
  }

  /**
   * Start the retention service
   * Runs cleanup job at specified interval (default: daily)
   */
  start(): void {
    if (this.isRunning) {
      logInfo('Audit retention service already running', 'AuditRetention');
      return;
    }

    const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '30');
    const cleanupIntervalHours = parseInt(process.env.LOG_CLEANUP_INTERVAL_HOURS || '24');
    
    logInfo('Starting audit retention service', 'AuditRetention', {
      retentionDays,
      cleanupIntervalHours
    });

    // Run initial cleanup
    this.performCleanup();

    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.performCleanup();
    }, cleanupIntervalHours * 60 * 60 * 1000); // Convert hours to milliseconds

    this.isRunning = true;
  }

  /**
   * Stop the retention service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logInfo('Audit retention service stopped', 'AuditRetention');
  }

  /**
   * Perform cleanup of old audit logs
   */
  private async performCleanup(): Promise<void> {
    try {
      const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '30');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Call the cleanup endpoint
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/audit-logs/cleanup?days=${retentionDays}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        logInfo('Audit log cleanup completed successfully', 'AuditRetention', {
          retentionDays,
          cutoffDate: cutoffDate.toISOString(),
          result
        });
      } else {
        throw new Error(`Cleanup failed with status: ${response.status}`);
      }

    } catch (error) {
      logError('Failed to perform audit log cleanup', 'AuditRetention', {
        error,
        retentionDays: process.env.LOG_RETENTION_DAYS || '30'
      });
    }
  }

  /**
   * Manually trigger cleanup (for testing/admin use)
   */
  async manualCleanup(days?: number): Promise<void> {
    const retentionDays = days || parseInt(process.env.LOG_RETENTION_DAYS || '30');
    logInfo('Manual audit log cleanup triggered', 'AuditRetention', { retentionDays });
    
    try {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/audit-logs/cleanup?days=${retentionDays}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        logInfo('Manual audit log cleanup completed', 'AuditRetention', { result });
      } else {
        throw new Error(`Manual cleanup failed with status: ${response.status}`);
      }

    } catch (error) {
      logError('Failed to perform manual audit log cleanup', 'AuditRetention', { error });
      throw error;
    }
  }
}