import { InvoiceProcessor } from "./invoice-processor";

// Configuration for scheduled tasks
const SCHEDULED_INVOICES_INTERVAL = 5 * 60 * 1000; // Run every 5 minutes
const RECURRING_TEMPLATES_INTERVAL = 60 * 60 * 1000; // Run every hour

export class Scheduler {
  private scheduledInvoicesTimer: NodeJS.Timeout | null = null;
  private recurringTemplatesTimer: NodeJS.Timeout | null = null;
  
  // Start the scheduler
  start(): void {
    console.log("Starting invoice scheduler...");
    this.startScheduledInvoicesProcessor();
    this.startRecurringTemplatesProcessor();
  }
  
  // Stop the scheduler
  stop(): void {
    console.log("Stopping invoice scheduler...");
    
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
      console.log("Processing scheduled invoices...");
      const result = await InvoiceProcessor.processScheduledInvoices();
      console.log(`Processed scheduled invoices - Success: ${result.success}, Failed: ${result.failed}`);
    } catch (error) {
      console.error("Error processing scheduled invoices:", error);
    }
  }
  
  // Process recurring templates
  private async processRecurringTemplates(): Promise<void> {
    try {
      console.log("Processing recurring templates...");
      const result = await InvoiceProcessor.processRecurringTemplates();
      console.log(`Processed recurring templates - Success: ${result.success}, Failed: ${result.failed}`);
    } catch (error) {
      console.error("Error processing recurring templates:", error);
    }
  }
}

// Export a singleton instance
export const scheduler = new Scheduler();