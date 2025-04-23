
import { logInfo } from './logger';
import { BusinessMetricsLogger } from './business-metrics-logger';

/**
 * UserJourneyTracker monitors and logs the complete path a user takes
 * through the application, helping identify common paths and bottlenecks
 */
export class UserJourneyTracker {
  private static readonly SOURCE = 'UserJourney';
  private static journeys: Record<string, UserJourney> = {};

  /**
   * Start tracking a user journey
   */
  static startJourney(userId: string, journeyName: string): void {
    const journeyId = `${userId}:${journeyName}:${Date.now()}`;
    
    this.journeys[journeyId] = {
      userId,
      journeyName,
      startTime: Date.now(),
      steps: [],
      currentStepStartTime: Date.now()
    };

    logInfo(`User journey started: ${journeyName}`, this.SOURCE, { userId, journeyId });
  }

  /**
   * Record a step in the user's journey
   */
  static recordStep(userId: string, journeyName: string, stepName: string): void {
    // Find the active journey
    const journeyId = Object.keys(this.journeys).find(id => 
      this.journeys[id].userId === userId && 
      this.journeys[id].journeyName === journeyName &&
      !this.journeys[id].completed
    );

    if (!journeyId) {
      // Journey not found, create a new one
      this.startJourney(userId, journeyName);
      this.recordStep(userId, journeyName, stepName);
      return;
    }

    const journey = this.journeys[journeyId];
    const now = Date.now();
    const timeSpent = now - journey.currentStepStartTime;

    // Add the step
    journey.steps.push({
      name: stepName,
      timestamp: now,
      timeSpentMs: timeSpent
    });

    // Update current step time
    journey.currentStepStartTime = now;

    logInfo(`User journey step: ${journeyName} -> ${stepName}`, this.SOURCE, { 
      userId, 
      journeyId,
      timeSpentMs: timeSpent 
    });

    // Also log to business metrics
    BusinessMetricsLogger.logUserJourneyStep(userId, {
      journeyName,
      stepName,
      isComplete: false,
      timeSpentMs: timeSpent
    });
  }

  /**
   * Complete a user journey
   */
  static completeJourney(userId: string, journeyName: string): void {
    // Find the active journey
    const journeyId = Object.keys(this.journeys).find(id => 
      this.journeys[id].userId === userId && 
      this.journeys[id].journeyName === journeyName &&
      !this.journeys[id].completed
    );

    if (!journeyId) {
      return;
    }

    const journey = this.journeys[journeyId];
    const now = Date.now();
    const totalTime = now - journey.startTime;

    // Mark as completed
    journey.completed = true;
    journey.endTime = now;
    journey.totalTimeMs = totalTime;

    logInfo(`User journey completed: ${journeyName}`, this.SOURCE, { 
      userId, 
      journeyId,
      steps: journey.steps.length,
      totalTimeMs: totalTime 
    });

    // Also log to business metrics
    BusinessMetricsLogger.logUserJourneyStep(userId, {
      journeyName,
      stepName: 'journey_completed',
      isComplete: true,
      timeSpentMs: totalTime
    });

    // Clean up after some time
    setTimeout(() => {
      delete this.journeys[journeyId];
    }, 3600000); // Remove after 1 hour
  }

  /**
   * Get journey data for analysis
   */
  static getJourneyData(userId?: string): UserJourney[] {
    if (userId) {
      return Object.values(this.journeys).filter(journey => journey.userId === userId);
    }
    return Object.values(this.journeys);
  }
}

// Types for user journeys
interface UserJourney {
  userId: string;
  journeyName: string;
  startTime: number;
  endTime?: number;
  totalTimeMs?: number;
  completed?: boolean;
  steps: {
    name: string;
    timestamp: number;
    timeSpentMs: number;
  }[];
  currentStepStartTime: number;
}

/**
 * Pre-configured journey trackers for common paths
 */
export const journeyTrackers = {
  invoiceCreation: {
    start: (userId: string) => UserJourneyTracker.startJourney(userId, 'invoice_creation'),
    enterDetails: (userId: string) => UserJourneyTracker.recordStep(userId, 'invoice_creation', 'enter_details'),
    previewInvoice: (userId: string) => UserJourneyTracker.recordStep(userId, 'invoice_creation', 'preview'),
    saveInvoice: (userId: string) => UserJourneyTracker.recordStep(userId, 'invoice_creation', 'save'),
    shareInvoice: (userId: string) => UserJourneyTracker.recordStep(userId, 'invoice_creation', 'share'),
    complete: (userId: string) => UserJourneyTracker.completeJourney(userId, 'invoice_creation')
  },
  userOnboarding: {
    start: (userId: string) => UserJourneyTracker.startJourney(userId, 'user_onboarding'),
    viewDashboard: (userId: string) => UserJourneyTracker.recordStep(userId, 'user_onboarding', 'view_dashboard'),
    createFirstInvoice: (userId: string) => UserJourneyTracker.recordStep(userId, 'user_onboarding', 'create_first_invoice'),
    setupBranding: (userId: string) => UserJourneyTracker.recordStep(userId, 'user_onboarding', 'setup_branding'),
    complete: (userId: string) => UserJourneyTracker.completeJourney(userId, 'user_onboarding')
  },
  checkoutProcess: {
    start: (userId: string) => UserJourneyTracker.startJourney(userId, 'checkout'),
    viewInvoice: (userId: string) => UserJourneyTracker.recordStep(userId, 'checkout', 'view_invoice'),
    selectPaymentMethod: (userId: string) => UserJourneyTracker.recordStep(userId, 'checkout', 'select_payment'),
    enterPaymentDetails: (userId: string) => UserJourneyTracker.recordStep(userId, 'checkout', 'enter_payment_details'),
    completePayment: (userId: string) => UserJourneyTracker.recordStep(userId, 'checkout', 'complete_payment'),
    complete: (userId: string) => UserJourneyTracker.completeJourney(userId, 'checkout')
  }
};
