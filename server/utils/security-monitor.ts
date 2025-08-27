
/**
 * Advanced Security Monitoring System
 * Monitors authentication attempts, suspicious activities, and security threats
 */

import { Request, Response, NextFunction } from 'express';
import { logError, logWarning, logInfo, ErrorLogger, LogLevel, LogCategory } from './error-logger';

interface SecurityEvent {
  type: 'auth_failure' | 'suspicious_ip' | 'rate_limit' | 'sql_injection' | 'xss_attempt' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  userId?: number;
  path: string;
  timestamp: Date;
  details: any;
}

interface ThreatPattern {
  pattern: RegExp;
  type: SecurityEvent['type'];
  severity: SecurityEvent['severity'];
  description: string;
}

class SecurityMonitor {
  private securityEvents: SecurityEvent[] = [];
  private suspiciousIPs: Map<string, number> = new Map();
  private rateLimitTracking: Map<string, { count: number; lastRequest: Date }> = new Map();
  private readonly MAX_EVENTS = 10000;
  private readonly SUSPICIOUS_IP_THRESHOLD = 10;
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly RATE_LIMIT_MAX_REQUESTS = 100;

  private readonly threatPatterns: ThreatPattern[] = [
    {
      pattern: /(\b(union|select|insert|update|delete|drop|create|alter)\s+(from|into|table|database|where|set)\b)/i,
      type: 'sql_injection',
      severity: 'high',
      description: 'Potential SQL injection attempt detected'
    },
    {
      pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/i,
      type: 'xss_attempt',
      severity: 'medium',
      description: 'Potential XSS attack detected'
    },
    {
      pattern: /(\.\.\/)|(\.\.\\)/,
      type: 'unauthorized_access',
      severity: 'medium',
      description: 'Directory traversal attempt detected'
    }
  ];

  /**
   * Middleware to monitor all incoming requests for security threats
   */
  monitorRequests() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      const path = req.path;

      // Rate limiting check
      this.checkRateLimit(ip, req);

      // Analyze request for threat patterns
      this.analyzeRequest(req, ip, userAgent, path);

      // Track response for security events
      res.on('finish', () => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          this.recordSecurityEvent({
            type: 'auth_failure',
            severity: 'medium',
            ip,
            userAgent,
            userId: req.user?.id,
            path,
            timestamp: new Date(),
            details: {
              statusCode: res.statusCode,
              method: req.method,
              query: req.query
            }
          });
        }
      });

      next();
    };
  }

  /**
   * Check for rate limiting violations
   */
  private checkRateLimit(ip: string, req: Request): void {
    const now = new Date();
    const tracking = this.rateLimitTracking.get(ip);

    if (!tracking) {
      this.rateLimitTracking.set(ip, { count: 1, lastRequest: now });
      return;
    }

    const timeDiff = now.getTime() - tracking.lastRequest.getTime();
    
    if (timeDiff > this.RATE_LIMIT_WINDOW) {
      // Reset counter for new window
      this.rateLimitTracking.set(ip, { count: 1, lastRequest: now });
    } else {
      tracking.count++;
      tracking.lastRequest = now;

      if (tracking.count > this.RATE_LIMIT_MAX_REQUESTS) {
        this.recordSecurityEvent({
          type: 'rate_limit',
          severity: 'high',
          ip,
          userAgent: req.get('User-Agent') || 'unknown',
          path: req.path,
          timestamp: now,
          details: {
            requestCount: tracking.count,
            timeWindow: this.RATE_LIMIT_WINDOW
          }
        });
      }
    }
  }

  /**
   * Analyze request for security threats
   */
  private analyzeRequest(req: Request, ip: string, userAgent: string, path: string): void {
    const requestData = JSON.stringify({
      path: req.path,
      query: req.query,
      params: req.params,
      headers: req.headers
    });

    for (const threat of this.threatPatterns) {
      if (threat.pattern.test(requestData)) {
        this.recordSecurityEvent({
          type: threat.type,
          severity: threat.severity,
          ip,
          userAgent,
          userId: req.user?.id,
          path,
          timestamp: new Date(),
          details: {
            pattern: threat.description,
            matchedData: requestData.match(threat.pattern)?.[0]
          }
        });
      }
    }
  }

  /**
   * Record a security event
   */
  recordSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);

    // Track suspicious IPs
    const ipCount = this.suspiciousIPs.get(event.ip) || 0;
    this.suspiciousIPs.set(event.ip, ipCount + 1);

    // Log based on severity
    const logMessage = `Security event: ${event.type} from ${event.ip}`;
    
    switch (event.severity) {
      case 'critical':
        ErrorLogger.logActivity(LogLevel.CRITICAL, LogCategory.AUTH, logMessage, 'SecurityMonitor', event);
        break;
      case 'high':
        logError(logMessage, 'SecurityMonitor', event);
        break;
      case 'medium':
        logWarning(logMessage, 'SecurityMonitor', event);
        break;
      case 'low':
        logInfo(logMessage, 'SecurityMonitor', event);
        break;
    }

    // Check if IP should be flagged as suspicious
    if (this.suspiciousIPs.get(event.ip)! >= this.SUSPICIOUS_IP_THRESHOLD) {
      logError(`IP ${event.ip} flagged as suspicious (${this.suspiciousIPs.get(event.ip)} security events)`, 'SecurityMonitor');
    }

    // Maintain event limit
    if (this.securityEvents.length > this.MAX_EVENTS) {
      this.securityEvents = this.securityEvents.slice(-this.MAX_EVENTS);
    }
  }

  /**
   * Get recent security events
   */
  getSecurityEvents(limit: number = 100, severity?: SecurityEvent['severity']): SecurityEvent[] {
    let events = this.securityEvents;
    
    if (severity) {
      events = events.filter(event => event.severity === severity);
    }

    return events.slice(-limit).reverse();
  }

  /**
   * Get security summary
   */
  getSecuritySummary(): any {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentEvents = this.securityEvents.filter(event => event.timestamp >= last24Hours);
    
    const eventsBySeverity = {
      critical: recentEvents.filter(e => e.severity === 'critical').length,
      high: recentEvents.filter(e => e.severity === 'high').length,
      medium: recentEvents.filter(e => e.severity === 'medium').length,
      low: recentEvents.filter(e => e.severity === 'low').length
    };

    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: recentEvents.length,
      eventsBySeverity,
      eventsByType,
      suspiciousIPs: Array.from(this.suspiciousIPs.entries())
        .filter(([_, count]) => count >= this.SUSPICIOUS_IP_THRESHOLD)
        .map(([ip, count]) => ({ ip, eventCount: count })),
      timestamp: now
    };
  }

  /**
   * Check if an IP is suspicious
   */
  isSuspiciousIP(ip: string): boolean {
    return (this.suspiciousIPs.get(ip) || 0) >= this.SUSPICIOUS_IP_THRESHOLD;
  }

  /**
   * Clear old events and reset counters
   */
  cleanup(): void {
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    this.securityEvents = this.securityEvents.filter(event => event.timestamp >= cutoffTime);
    
    // Reset rate limiting tracking older than window
    const rateLimitCutoff = new Date(Date.now() - this.RATE_LIMIT_WINDOW);
    for (const [ip, tracking] of this.rateLimitTracking.entries()) {
      if (tracking.lastRequest < rateLimitCutoff) {
        this.rateLimitTracking.delete(ip);
      }
    }

    logInfo('Security monitor cleanup completed', 'SecurityMonitor');
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

/**
 * Middleware for protecting sensitive routes
 */
export const protectSensitiveRoute = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (securityMonitor.isSuspiciousIP(ip)) {
    securityMonitor.recordSecurityEvent({
      type: 'unauthorized_access',
      severity: 'high',
      ip,
      userAgent: req.get('User-Agent') || 'unknown',
      userId: req.user?.id,
      path: req.path,
      timestamp: new Date(),
      details: {
        reason: 'Suspicious IP attempting to access sensitive route',
        blocked: true
      }
    });

    return res.status(403).json({ 
      message: 'Access denied',
      code: 'SUSPICIOUS_IP'
    });
  }

  next();
};

/**
 * Enhanced authentication event logging
 */
export const logAuthEvent = (
  type: 'login_success' | 'login_failure' | 'logout' | 'registration',
  req: Request,
  userId?: number,
  details?: any
) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  securityMonitor.recordSecurityEvent({
    type: type.includes('failure') ? 'auth_failure' : 'unauthorized_access',
    severity: type.includes('failure') ? 'medium' : 'low',
    ip,
    userAgent: req.get('User-Agent') || 'unknown',
    userId,
    path: req.path,
    timestamp: new Date(),
    details: {
      authEventType: type,
      ...details
    }
  });
};
