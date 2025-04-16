import { InvoiceProcessor } from "./invoice-processor";
import { logInfo, logError } from "../lib/error-logger";

// Configuration for scheduled tasks
const SCHEDULED_INVOICES_INTERVAL = 5 * 60 * 1000; // Run every 5 minutes
const RECURRING_TEMPLATES_INTERVAL = 60 * 60 * 1000; // Run every hour

export class Scheduler {
  private scheduledInvoicesTimer: NodeJS.Timeout | null = null;
  private recurringTemplatesTimer: NodeJS.Timeout | null = null;
  
  // Start the scheduler
  /**
 * Starts the invoice processing scheduler.
 */
start(): void {
    logInfo("Starting invoice scheduler...", "Scheduler");
    this.startScheduledInvoicesProcessor();
    this.startRecurringTemplatesProcessor();
  }
  
  // Stop the scheduler
  /**
 * Stops the invoice processing scheduler.
 */
stop(): void {
    logInfo("Stopping invoice scheduler...", "Scheduler");
    
    if (this.scheduledInvoicesTimer) {
      clearInterval(this.scheduledInvoicesTimer);
      this.scheduledInvoicesTimer = null;
    }
    
    if (this.recurringTemplatesTimer) {
      clearInterval(this.recurringTemplatesTimer);
      this.recurringTemplatesTimer = null;
    }
  }
  
  // Start the scheduled invoices processor
  private startScheduledInvoicesProcessor(): void {
    // Run immediately on startup
    this.processScheduledInvoices();
    
    // Then schedule regular runs
    this.scheduledInvoicesTimer = setInterval(() => {
      this.processScheduledInvoices();
    }, SCHEDULED_INVOICES_INTERVAL);
  }
  
  // Start the recurring templates processor
  private startRecurringTemplatesProcessor(): void {
    // Run immediately on startup
    this.processRecurringTemplates();
    
    // Then schedule regular runs
    this.recurringTemplatesTimer = setInterval(() => {
      this.processRecurringTemplates();
    }, RECURRING_TEMPLATES_INTERVAL);
  }
  
  // Process scheduled invoices
  private async processScheduledInvoices(): Promise<void> {
    try {
      logInfo("Processing scheduled invoices...", "Scheduler");
      const result = await InvoiceProcessor.processScheduledInvoices();
      logInfo(`Processed scheduled invoices - Success: ${result.success}, Failed: ${result.failed}`, "Scheduler", { 
        success: result.success, 
        failed: result.failed 
      });
    } catch (error) {
      logError("Error processing scheduled invoices", "Scheduler", error);
    }
  }
  
  // Process recurring templates
  private async processRecurringTemplates(): Promise<void> {
    try {
      logInfo("Processing recurring templates...", "Scheduler");
      const result = await InvoiceProcessor.processRecurringTemplates();
      logInfo(`Processed recurring templates - Success: ${result.success}, Failed: ${result.failed}`, "Scheduler", { 
        success: result.success, 
        failed: result.failed 
      });
    } catch (error) {
      logError("Error processing recurring templates", "Scheduler", error);
    }
  }
}

// Export a singleton instance
export const scheduler = new Scheduler();