
/**
 * Advanced Logging Pipeline System
 * Provides structured logging, log aggregation, and analysis capabilities
 */

import fs from 'fs/promises';
import path from 'path';
import { ErrorLogger, LogLevel, LogCategory, LogEntry } from './error-logger';

interface LogMetrics {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsBySource: Record<string, number>;
  errorRate: number;
  averageResponseTime: number;
  topErrors: Array<{ message: string; count: number }>;
  timeRange: { start: Date; end: Date };
}

interface LogFilter {
  level?: LogLevel;
  source?: string;
  startTime?: Date;
  endTime?: Date;
  searchText?: string;
}

class AdvancedLogger {
  private logBuffer: LogEntry[] = [];
  private readonly LOG_BUFFER_SIZE = 5000;
  private readonly LOG_FILE_PATH = 'logs';
  private logAnalytics: Map<string, any> = new Map();

  constructor() {
    this.ensureLogDirectory();
    this.startPeriodicFlush();
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.LOG_FILE_PATH, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Start periodic log flushing to files
   */
  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushLogsToFile();
    }, 5 * 60 * 1000); // Flush every 5 minutes
  }

  /**
   * Add log entry to buffer
   */
  addLogEntry(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Update analytics
    this.updateAnalytics(entry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.LOG_BUFFER_SIZE) {
      this.flushLogsToFile();
    }
  }

  /**
   * Update log analytics
   */
  private updateAnalytics(entry: LogEntry): void {
    const today = new Date().toISOString().split('T')[0];
    const analytics = this.logAnalytics.get(today) || {
      totalLogs: 0,
      logsByLevel: {},
      logsBySource: {},
      errors: []
    };

    analytics.totalLogs++;
    analytics.logsByLevel[entry.level] = (analytics.logsByLevel[entry.level] || 0) + 1;
    analytics.logsBySource[entry.source] = (analytics.logsBySource[entry.source] || 0) + 1;

    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL) {
      analytics.errors.push({
        message: entry.message,
        timestamp: entry.timestamp,
        details: entry.details
      });
    }

    this.logAnalytics.set(today, analytics);
  }

  /**
   * Flush logs to file
   */
  private async flushLogsToFile(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const logFileName = path.join(this.LOG_FILE_PATH, `app-${today}.log`);
      
      const logLines = this.logBuffer.map(entry => 
        JSON.stringify({
          timestamp: entry.timestamp.toISOString(),
          level: entry.level,
          source: entry.source,
          message: entry.message,
          details: entry.details
        })
      ).join('\n') + '\n';

      await fs.appendFile(logFileName, logLines);
      
      console.log(`Flushed ${this.logBuffer.length} log entries to ${logFileName}`);
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to flush logs to file:', error);
    }
  }

  /**
   * Get logs with filtering
   */
  async getFilteredLogs(filter: LogFilter, limit: number = 1000): Promise<LogEntry[]> {
    try {
      // Get recent logs from ErrorLogger
      const recentLogs = ErrorLogger.getRecentLogs(limit, filter.level);
      
      let filteredLogs = recentLogs;

      // Apply additional filters
      if (filter.source) {
        filteredLogs = filteredLogs.filter(log => 
          log.source.toLowerCase().includes(filter.source!.toLowerCase())
        );
      }

      if (filter.searchText) {
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(filter.searchText!.toLowerCase())
        );
      }

      if (filter.startTime) {
        filteredLogs = filteredLogs.filter(log => 
          log.timestamp >= filter.startTime!
        );
      }

      if (filter.endTime) {
        filteredLogs = filteredLogs.filter(log => 
          log.timestamp <= filter.endTime!
        );
      }

      return filteredLogs;
    } catch (error) {
      console.error('Failed to get filtered logs:', error);
      return [];
    }
  }

  /**
   * Generate log metrics and analytics
   */
  generateLogMetrics(timeRange?: { start: Date; end: Date }): LogMetrics {
    const now = new Date();
    const start = timeRange?.start || new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const end = timeRange?.end || now;

    const recentLogs = ErrorLogger.getRecentLogs(10000).filter(log => 
      log.timestamp >= start && log.timestamp <= end
    );

    const logsByLevel = recentLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<LogLevel, number>);

    const logsBySource = recentLogs.reduce((acc, log) => {
      acc[log.source] = (acc[log.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorLogs = recentLogs.filter(log => 
      log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL
    );

    const errorCounts = errorLogs.reduce((acc, log) => {
      const key = log.message.substring(0, 100); // First 100 chars as key
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const errorRate = recentLogs.length > 0 ? (errorLogs.length / recentLogs.length) * 100 : 0;

    // Calculate average response time from performance logs
    const performanceLogs = recentLogs.filter(log => 
      log.level === LogLevel.PERFORMANCE && 
      log.details?.durationMs
    );
    
    const averageResponseTime = performanceLogs.length > 0 
      ? performanceLogs.reduce((sum, log) => sum + log.details.durationMs, 0) / performanceLogs.length
      : 0;

    return {
      totalLogs: recentLogs.length,
      logsByLevel,
      logsBySource,
      errorRate,
      averageResponseTime,
      topErrors,
      timeRange: { start, end }
    };
  }

  /**
   * Export logs to various formats
   */
  async exportLogs(
    format: 'json' | 'csv' | 'txt',
    filter?: LogFilter,
    limit: number = 1000
  ): Promise<string> {
    const logs = await this.getFilteredLogs(filter || {}, limit);

    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);

      case 'csv':
        const headers = 'Timestamp,Level,Source,Message,Details\n';
        const rows = logs.map(log => 
          `"${log.timestamp.toISOString()}","${log.level}","${log.source}","${log.message}","${JSON.stringify(log.details || {})}"`
        ).join('\n');
        return headers + rows;

      case 'txt':
        return logs.map(log => 
          `[${log.timestamp.toISOString()}] [${log.level}] [${log.source}] ${log.message}${log.details ? '\n  Details: ' + JSON.stringify(log.details, null, 2) : ''}`
        ).join('\n\n');

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get log analytics for dashboard
   */
  getLogAnalytics(days: number = 7): any {
    const analytics = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const dayAnalytics = this.logAnalytics.get(dateKey);

      if (dayAnalytics) {
        analytics.push({
          date: dateKey,
          ...dayAnalytics
        });
      }
    }

    return analytics.reverse();
  }

  /**
   * Clean up old log files
   */
  async cleanupOldLogs(retentionDays: number = 30): Promise<void> {
    try {
      const files = await fs.readdir(this.LOG_FILE_PATH);
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      for (const file of files) {
        if (file.startsWith('app-') && file.endsWith('.log')) {
          const filePath = path.join(this.LOG_FILE_PATH, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            console.log(`Deleted old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  /**
   * Force flush logs to file
   */
  async forceFlush(): Promise<void> {
    await this.flushLogsToFile();
  }
}

// Export singleton instance
export const advancedLogger = new AdvancedLogger();

/**
 * Enhanced logging functions with structured data
 */
export const structuredLog = {
  info: (message: string, source: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.INFO,
      source,
      message,
      details: data
    };
    advancedLogger.addLogEntry(entry);
    ErrorLogger.logActivity(LogLevel.INFO, LogCategory.SYSTEM, message, source, data);
  },

  warning: (message: string, source: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.WARNING,
      source,
      message,
      details: data
    };
    advancedLogger.addLogEntry(entry);
    ErrorLogger.logActivity(LogLevel.WARNING, LogCategory.SYSTEM, message, source, data);
  },

  error: (message: string, source: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.ERROR,
      source,
      message,
      details: data
    };
    advancedLogger.addLogEntry(entry);
    ErrorLogger.logActivity(LogLevel.ERROR, LogCategory.SYSTEM, message, source, data);
  },

  critical: (message: string, source: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.CRITICAL,
      source,
      message,
      details: data
    };
    advancedLogger.addLogEntry(entry);
    ErrorLogger.logActivity(LogLevel.CRITICAL, LogCategory.SYSTEM, message, source, data);
  }
};
