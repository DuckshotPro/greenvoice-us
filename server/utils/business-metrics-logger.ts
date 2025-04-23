
import { logInfo } from './logger';
import { storage } from '../models/storage';

/**
 * BusinessMetricsLogger provides methods for tracking business-related metrics
 * such as conversion rates, feature usage, and financial data
 */
export class BusinessMetricsLogger {
  private static readonly SOURCE = 'BusinessMetrics';

  /**
   * Log a business event with relevant metrics
   * @param eventType The type of business event
   * @param data Additional data about the event
   */
  static async logBusinessEvent(eventType: string, data: Record<string, any>): Promise<void> {
    try {
      // Log the event
      logInfo(`Business event: ${eventType}`, this.SOURCE, data);
      
      // Store in database for analytics
      await storage.storeBusinessMetric({
        eventType,
        timestamp: new Date().toISOString(),
        ...data
      });
    } catch (error) {
      console.error('Failed to log business metric:', error);
    }
  }

  /**
   * Log invoice creation with business context
   */
  static logInvoiceCreation(invoiceId: string, data: {
    userId: string,
    clientId?: string,
    amount: number,
    itemCount: number,
    currency: string,
    creationTime: number // milliseconds it took to create
  }): void {
    this.logBusinessEvent('invoice_created', {
      invoiceId,
      ...data
    });
  }

  /**
   * Log payment received
   */
  static logPaymentReceived(invoiceId: string, data: {
    amount: number,
    currency: string,
    paymentMethod: string,
    isPartial: boolean,
    hasTip: boolean,
    tipAmount?: number
  }): void {
    this.logBusinessEvent('payment_received', {
      invoiceId,
      ...data
    });
  }

  /**
   * Log feature usage to track popular features
   */
  static logFeatureUsage(featureName: string, data: {
    userId: string,
    successful: boolean,
    duration?: number
  }): void {
    this.logBusinessEvent('feature_used', {
      feature: featureName,
      ...data
    });
  }

  /**
   * Log conversion events (e.g., free to paid user)
   */
  static logConversion(conversionType: string, data: {
    userId: string,
    previousPlan?: string,
    newPlan: string,
    source?: string
  }): void {
    this.logBusinessEvent('user_conversion', {
      conversionType,
      ...data
    });
  }

  /**
   * Log user journey progress
   */
  static logUserJourneyStep(userId: string, data: {
    journeyName: string,
    stepName: string,
    isComplete: boolean,
    timeSpentMs?: number
  }): void {
    this.logBusinessEvent('user_journey_progress', {
      userId,
      ...data
    });
  }
}

/**
 * Pre-configured business metrics for common events
 */
export const businessMetrics = {
  invoiceCreated: (invoiceId: string, data: any) => BusinessMetricsLogger.logInvoiceCreation(invoiceId, data),
  paymentReceived: (invoiceId: string, data: any) => BusinessMetricsLogger.logPaymentReceived(invoiceId, data),
  featureUsed: (feature: string, data: any) => BusinessMetricsLogger.logFeatureUsage(feature, data),
  userConverted: (type: string, data: any) => BusinessMetricsLogger.logConversion(type, data),
  journeyStepCompleted: (userId: string, data: any) => BusinessMetricsLogger.logUserJourneyStep(userId, data)
};
