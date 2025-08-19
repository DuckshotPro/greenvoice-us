
/**
 * Admin Routes for Security and Logging Management
 */

import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { securityMonitor } from '../utils/security-monitor';
import { advancedLogger } from '../utils/advanced-logger';
import { performanceMonitor } from '../utils/performance-monitor';
import { ErrorLogger } from '../utils/error-logger';

const router = Router();

// Security monitoring endpoints
router.get('/security/events', requireAdmin, async (req, res) => {
  try {
    const { limit = 100, severity } = req.query;
    const events = securityMonitor.getSecurityEvents(
      parseInt(limit as string),
      severity as any
    );
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

router.get('/security/summary', requireAdmin, async (req, res) => {
  try {
    const summary = securityMonitor.getSecuritySummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch security summary' });
  }
});

// Logging management endpoints
router.get('/logs/metrics', requireAdmin, async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    const timeRange = startTime && endTime ? {
      start: new Date(startTime as string),
      end: new Date(endTime as string)
    } : undefined;
    
    const metrics = advancedLogger.generateLogMetrics(timeRange);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate log metrics' });
  }
});

router.get('/logs/export', requireAdmin, async (req, res) => {
  try {
    const { format = 'json', limit = 1000, level, source, searchText } = req.query;
    
    const filter = {
      level: level as any,
      source: source as string,
      searchText: searchText as string
    };

    const exportData = await advancedLogger.exportLogs(
      format as 'json' | 'csv' | 'txt',
      filter,
      parseInt(limit as string)
    );

    const contentType = {
      json: 'application/json',
      csv: 'text/csv',
      txt: 'text/plain'
    }[format as string];

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="logs.${format}"`);
    res.send(exportData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

router.get('/logs/analytics', requireAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const analytics = advancedLogger.getLogAnalytics(parseInt(days as string));
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch log analytics' });
  }
});

// Performance monitoring endpoints
router.get('/performance/metrics', requireAdmin, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const metrics = await performanceMonitor.getRecentMetrics(parseInt(limit as string));
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

router.get('/performance/summary', requireAdmin, async (req, res) => {
  try {
    const summary = await performanceMonitor.getPerformanceSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance summary' });
  }
});

// System health endpoints
router.get('/health/database', requireAdmin, async (req, res) => {
  try {
    // Database health check
    const { db } = await import('../models/db');
    const startTime = Date.now();
    await db.execute('SELECT 1');
    const responseTime = Date.now() - startTime;

    res.json({
      status: 'healthy',
      responseTime,
      timestamp: new Date()
    });
  } catch (error) {
    res.json({
      status: 'unhealthy',
      error: String(error),
      timestamp: new Date()
    });
  }
});

router.get('/health/memory', requireAdmin, (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const formatted = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024) // MB
    };

    res.json({
      status: 'healthy',
      memoryUsage: formatted,
      uptime: process.uptime(),
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check memory health' });
  }
});

// Maintenance endpoints
router.post('/logs/cleanup', requireAdmin, async (req, res) => {
  try {
    const { retentionDays = 30 } = req.body;
    await advancedLogger.cleanupOldLogs(retentionDays);
    res.json({ message: 'Log cleanup completed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cleanup logs' });
  }
});

router.post('/logs/flush', requireAdmin, async (req, res) => {
  try {
    await advancedLogger.forceFlush();
    res.json({ message: 'Logs flushed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to flush logs' });
  }
});

router.post('/security/cleanup', requireAdmin, async (req, res) => {
  try {
    securityMonitor.cleanup();
    res.json({ message: 'Security monitor cleanup completed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cleanup security monitor' });
  }
});

// Get recent logs with filtering
router.get('/logs/recent', requireAdmin, async (req, res) => {
  try {
    const { 
      limit = 100, 
      level, 
      source, 
      searchText,
      startTime,
      endTime 
    } = req.query;

    const filter = {
      level: level as any,
      source: source as string,
      searchText: searchText as string,
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined
    };

    const logs = await advancedLogger.getFilteredLogs(filter, parseInt(limit as string));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent logs' });
  }
});

export default router;
