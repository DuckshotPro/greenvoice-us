
import { Request, Response, NextFunction } from "express";
import { logInfo } from "../utils/logger";

/**
 * Middleware to track significant user activities
 * This helps build a comprehensive user journey for analysis
 */
export const trackUserActivity = (activityType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only track activity if user is authenticated
    if (req.isAuthenticated() && req.user) {
      const activityData = {
        userId: req.user.id,
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

      logInfo(
        `User activity: ${activityType}`,
        'ActivityTracker',
        activityData
      );
    }
    
    next();
  };
};

/**
 * Pre-configured activity trackers for common actions
 */
export const activityTrackers = {
  viewInvoice: trackUserActivity('view_invoice'),
  createInvoice: trackUserActivity('create_invoice'),
  updateInvoice: trackUserActivity('update_invoice'),
  deleteInvoice: trackUserActivity('delete_invoice'),
  shareInvoice: trackUserActivity('share_invoice'),
  login: trackUserActivity('login'),
  logout: trackUserActivity('logout'),
  viewAnalytics: trackUserActivity('view_analytics'),
  changeSetting: trackUserActivity('change_setting')
};
