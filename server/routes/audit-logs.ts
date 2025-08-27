import { Router, Request, Response } from 'express';
import { db } from '../models/db';
import { auditLogs } from '@shared/schema';
import { logError, logInfo } from '../utils/error-logger';

const router = Router();

/**
 * Ingest endpoint for audit logs
 * Accepts POST requests with log data and stores in Neon database
 */
router.post('/ingest', async (req: Request, res: Response) => {
  try {
    const { timestamp, level, source, message, details, userId, requestId, ipAddress, userAgent } = req.body;

    // Validate required fields
    if (!level || !source || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: level, source, message' 
      });
    }

    // Insert into audit_logs table
    const [logEntry] = await db.insert(auditLogs).values({
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      level,
      source,
      message,
      details: details || null,
      userId: userId || null,
      requestId: requestId || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    }).returning();

    logInfo(`Audit log ingested: ${message}`, 'AuditIngest', { 
      logId: logEntry.id, 
      level, 
      source 
    });

    res.status(201).json({ 
      success: true, 
      logId: logEntry.id 
    });

  } catch (error) {
    logError('Failed to ingest audit log', 'AuditIngest', { 
      error, 
      body: req.body 
    });
    
    res.status(500).json({ 
      error: 'Failed to store audit log' 
    });
  }
});

/**
 * Get recent audit logs (for admin/debugging)
 * Optional query params: limit, level, source, userId
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const { limit = 100, level, source, userId } = req.query;
    
    let query = db.select().from(auditLogs).orderBy(auditLogs.timestamp.desc());
    
    if (level) {
      query = query.where(auditLogs.level.eq(level as string));
    }
    if (source) {
      query = query.where(auditLogs.source.eq(source as string));
    }
    if (userId) {
      query = query.where(auditLogs.userId.eq(parseInt(userId as string)));
    }
    
    const logs = await query.limit(parseInt(limit as string));
    
    res.json({ 
      success: true, 
      logs,
      count: logs.length 
    });

  } catch (error) {
    logError('Failed to fetch audit logs', 'AuditIngest', { error });
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * Cleanup old audit logs (retention job)
 * Deletes logs older than specified days
 */
router.delete('/cleanup', async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days as string));

    const result = await db.delete(auditLogs)
      .where(auditLogs.timestamp.lt(cutoffDate));

    logInfo(`Audit log cleanup completed`, 'AuditCleanup', { 
      days: parseInt(days as string),
      cutoffDate: cutoffDate.toISOString()
    });

    res.json({ 
      success: true, 
      message: `Cleaned up logs older than ${days} days`,
      cutoffDate: cutoffDate.toISOString()
    });

  } catch (error) {
    logError('Failed to cleanup audit logs', 'AuditCleanup', { error });
    res.status(500).json({ error: 'Failed to cleanup audit logs' });
  }
});

export default router;