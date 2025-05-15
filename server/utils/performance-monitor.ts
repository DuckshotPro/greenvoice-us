/**
 * Performance Monitoring System
 * Tracks application metrics and performance data for backend optimization
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../models/db';
import { sql } from 'drizzle-orm';
import { logInfo, logError, logWarning } from './error-logger';

interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userId?: number | null;
}

interface QueryPerformanceMetric {
  query: string;
  params?: any;
  executionTime: number;
  timestamp: Date;
  source: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private queryMetrics: QueryPerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly MAX_METRICS = 1000; // Maximum metrics to store before flushing
  private readonly FLUSH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly SLOW_QUERY_THRESHOLD = 500; // 500ms
  private readonly SLOW_ENDPOINT_THRESHOLD = 1000; // 1000ms

  constructor() {
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Start the performance monitoring system
   */
  start(): void {
    logInfo('Starting performance monitoring system', 'PerformanceMonitor');
  }

  /**
   * Stop the performance monitoring system
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    logInfo('Performance monitoring system stopped', 'PerformanceMonitor');
  }

  /**
   * Record a performance metric for an API endpoint
   */
  recordEndpointMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Log slow endpoints for immediate attention
    if (metric.responseTime > this.SLOW_ENDPOINT_THRESHOLD) {
      logWarning(
        `Slow endpoint detected: ${metric.method} ${metric.endpoint} took ${metric.responseTime}ms`, 
        'PerformanceMonitor'
      );
    }
    
    // Flush metrics if we've reached the maximum
    if (this.metrics.length >= this.MAX_METRICS) {
      this.flushMetrics();
    }
  }

  /**
   * Record a performance metric for a database query
   */
  recordQueryMetric(metric: QueryPerformanceMetric): void {
    this.queryMetrics.push(metric);
    
    // Log slow queries for immediate attention
    if (metric.executionTime > this.SLOW_QUERY_THRESHOLD) {
      logWarning(
        `Slow query detected: ${metric.query} took ${metric.executionTime}ms`, 
        'PerformanceMonitor'
      );
    }
    
    // Flush metrics if we've reached the maximum
    if (this.queryMetrics.length >= this.MAX_METRICS) {
      this.flushQueryMetrics();
    }
  }

  /**
   * Express middleware to track endpoint performance
   */
  trackEndpoint() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Capture response time after request is complete
      res.on('finish', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        this.recordEndpointMetric({
          endpoint: req.originalUrl || req.url,
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
          timestamp: new Date(),
          userId: req.user?.id
        });
      });
      
      next();
    };
  }

  /**
   * Get the most recent performance metrics for analysis
   */
  async getRecentMetrics(limit: number = 100): Promise<{ endpoints: PerformanceMetric[], queries: QueryPerformanceMetric[] }> {
    try {
      // This is a simplified version - in production, we would query from a database
      return {
        endpoints: this.metrics.slice(-limit),
        queries: this.queryMetrics.slice(-limit)
      };
    } catch (error) {
      logError('Failed to get recent performance metrics', 'PerformanceMonitor', { error: String(error) });
      return { endpoints: [], queries: [] };
    }
  }

  /**
   * Get performance summary with aggregated metrics
   */
  async getPerformanceSummary(): Promise<any> {
    try {
      // Calculate average response times by endpoint
      const endpointStats = this.calculateEndpointStats();
      
      // Calculate average query execution times
      const queryStats = this.calculateQueryStats();
      
      return {
        endpointStats,
        queryStats,
        totalEndpoints: this.metrics.length,
        totalQueries: this.queryMetrics.length,
        averageResponseTime: this.calculateAverageResponseTime(),
        averageQueryTime: this.calculateAverageQueryTime(),
        timestamp: new Date()
      };
    } catch (error) {
      logError('Failed to generate performance summary', 'PerformanceMonitor', { error: String(error) });
      return {};
    }
  }

  /**
   * Calculate average response time across all endpoints
   */
  private calculateAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const sum = this.metrics.reduce((acc, metric) => acc + metric.responseTime, 0);
    return sum / this.metrics.length;
  }

  /**
   * Calculate average query execution time
   */
  private calculateAverageQueryTime(): number {
    if (this.queryMetrics.length === 0) return 0;
    
    const sum = this.queryMetrics.reduce((acc, metric) => acc + metric.executionTime, 0);
    return sum / this.queryMetrics.length;
  }

  /**
   * Calculate stats for each endpoint
   */
  private calculateEndpointStats(): any {
    const stats: Record<string, { count: number, totalTime: number, avgTime: number }> = {};
    
    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      
      if (!stats[key]) {
        stats[key] = { count: 0, totalTime: 0, avgTime: 0 };
      }
      
      stats[key].count++;
      stats[key].totalTime += metric.responseTime;
    });
    
    // Calculate average times
    Object.keys(stats).forEach(key => {
      stats[key].avgTime = stats[key].totalTime / stats[key].count;
    });
    
    return stats;
  }

  /**
   * Calculate stats for each type of query
   */
  private calculateQueryStats(): any {
    const stats: Record<string, { count: number, totalTime: number, avgTime: number }> = {};
    
    this.queryMetrics.forEach(metric => {
      const key = metric.query.substring(0, 100); // Use first 100 chars as a key
      
      if (!stats[key]) {
        stats[key] = { count: 0, totalTime: 0, avgTime: 0 };
      }
      
      stats[key].count++;
      stats[key].totalTime += metric.executionTime;
    });
    
    // Calculate average times
    Object.keys(stats).forEach(key => {
      stats[key].avgTime = stats[key].totalTime / stats[key].count;
    });
    
    return stats;
  }

  /**
   * Flush endpoint metrics to storage/database
   * In a production system, this would store to a database
   */
  private async flushMetrics(): Promise<void> {
    try {
      logInfo(`Flushing ${this.metrics.length} endpoint performance metrics`, 'PerformanceMonitor');
      
      // Here we would store the metrics in a database
      // For now, we'll just log them and clear the array
      
      // Clear metrics after flushing
      this.metrics = [];
      
      logInfo('Successfully flushed endpoint performance metrics', 'PerformanceMonitor');
    } catch (error) {
      logError('Failed to flush endpoint performance metrics', 'PerformanceMonitor', { error: String(error) });
    }
  }

  /**
   * Flush query metrics to storage/database
   */
  private async flushQueryMetrics(): Promise<void> {
    try {
      logInfo(`Flushing ${this.queryMetrics.length} query performance metrics`, 'PerformanceMonitor');
      
      // Here we would store the metrics in a database
      // For now, we'll just log them and clear the array
      
      // Clear metrics after flushing
      this.queryMetrics = [];
      
      logInfo('Successfully flushed query performance metrics', 'PerformanceMonitor');
    } catch (error) {
      logError('Failed to flush query performance metrics', 'PerformanceMonitor', { error: String(error) });
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Database query interceptor for query performance monitoring
 * Would be integrated with your database access methods
 */
export async function monitorQuery<T>(
  queryFn: () => Promise<T>,
  queryInfo: { query: string; params?: any; source: string }
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const endTime = Date.now();
    
    performanceMonitor.recordQueryMetric({
      query: queryInfo.query,
      params: queryInfo.params,
      executionTime: endTime - startTime,
      timestamp: new Date(),
      source: queryInfo.source
    });
    
    return result;
  } catch (error) {
    const endTime = Date.now();
    
    performanceMonitor.recordQueryMetric({
      query: queryInfo.query,
      params: queryInfo.params,
      executionTime: endTime - startTime,
      timestamp: new Date(),
      source: queryInfo.source
    });
    
    throw error;
  }
}