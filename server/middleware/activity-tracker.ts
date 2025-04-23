
import { Request, Response, NextFunction } from "express";
import { logInfo } from "../utils/logger";
import { UserJourneyTracker } from "../utils/user-journey-tracker";
import { BusinessMetricsLogger } from "../utils/business-metrics-logger";

/**
 * Middleware to track significant user activities
 * This helps build a comprehensive user journey for analysis
 */
export const trackUserActivity = (activityType: string, journeyInfo?: { 
  journey: string, 
  step: string 
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only track activity if user is authenticated
    if (req.isAuthenticated && req.user) {
      const userId = req.user.id;
      
      const activityData = {
        userId,
        username: req.user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        // Include safe parts of the request
        params: req.params,
        query: req.query,
        // Avoid logging entire body which might contain sensitive data
        bodyKeys: Object.keys(req.body || {})
      };

      // Log the activity
      logInfo(
        `User activity: ${activityType}`,
        'ActivityTracker',
        activityData
      );
      
      // If this activity is part of a journey, track it
      if (journeyInfo) {
        UserJourneyTracker.recordStep(
          userId, 
          journeyInfo.journey, 
          journeyInfo.step
        );
      }
      
      // Log as a feature usage for business metrics
      BusinessMetricsLogger.logFeatureUsage(activityType, {
        userId,
        successful: true
      });
      
      // Add response listener to capture performance timing
      const startTime = Date.now();
      
      // Listen for the response to finish
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // Log performance data for this activity
        if (duration > 1000) {
          // Only log slow operations
          logInfo(
            `Slow operation: ${activityType} (${duration}ms)`,
            'PerformanceTracker',
            {
              ...activityData,
              duration,
              statusCode: res.statusCode
            }
          );
        }
      });
    }
    
    next();
  };
};

/**
 * Pre-configured activity trackers for common actions
 */
export const activityTrackers = {
  viewInvoice: trackUserActivity('view_invoice', { 
    journey: 'invoice_interaction', 
    step: 'view' 
  }),
  
  createInvoice: trackUserActivity('create_invoice', { 
    journey: 'invoice_creation', 
    step: 'create' 
  }),
  
  updateInvoice: trackUserActivity('update_invoice', { 
    journey: 'invoice_management', 
    step: 'update' 
  }),
  
  deleteInvoice: trackUserActivity('delete_invoice', { 
    journey: 'invoice_management', 
    step: 'delete' 
  }),
  
  shareInvoice: trackUserActivity('share_invoice', { 
    journey: 'invoice_sharing', 
    step: 'share' 
  }),
  
  downloadInvoice: trackUserActivity('download_invoice', { 
    journey: 'invoice_usage', 
    step: 'download' 
  }),
  
  printInvoice: trackUserActivity('print_invoice', { 
    journey: 'invoice_usage', 
    step: 'print' 
  }),
  
  login: trackUserActivity('login', { 
    journey: 'user_session', 
    step: 'login' 
  }),
  
  logout: trackUserActivity('logout', { 
    journey: 'user_session', 
    step: 'logout' 
  }),
  
  viewAnalytics: trackUserActivity('view_analytics', { 
    journey: 'data_analysis', 
    step: 'view_analytics' 
  }),
  
  changeSetting: trackUserActivity('change_setting', { 
    journey: 'account_management', 
    step: 'update_settings' 
  }),
  
  processPayment: trackUserActivity('process_payment', { 
    journey: 'checkout', 
    step: 'payment' 
  }),
  
  viewClientList: trackUserActivity('view_client_list', { 
    journey: 'client_management', 
    step: 'view_list' 
  }),
  
  addClient: trackUserActivity('add_client', { 
    journey: 'client_management', 
    step: 'add_client' 
  })
};
