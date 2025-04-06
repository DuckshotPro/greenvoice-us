import { storage } from "./storage";
import { Invoice, ScheduledInvoice, RecurringTemplate } from "@shared/schema";

/**
 * InvoiceProcessor handles operations related to scheduled invoices and recurring templates
 * It processes invoices that are scheduled to be sent and generates new invoices from templates
 */
export class InvoiceProcessor {
  /**
   * Process all scheduled invoices that need to be sent
   * @returns Statistics about the processing
   */
  static async processScheduledInvoices(): Promise<{ success: number, failed: number }> {
    const scheduledInvoices = await storage.getScheduledInvoicesToProcess();
    let success = 0;
    let failed = 0;

    for (const scheduledInvoice of scheduledInvoices) {
      try {
        // Get the invoice referenced by this scheduled item
        const invoice = await storage.getInvoice(scheduledInvoice.invoiceId);
        
        if (!invoice) {
          // Invoice doesn't exist anymore, mark as failed
          await storage.updateScheduledInvoiceStatus(
            scheduledInvoice.id,
            'failed',
            'Invoice not found'
          );
          failed++;
          continue;
        }
        
        // Simulate sending the invoice
        // In a real system, this would connect to an email service
        console.log(`Sending scheduled invoice ${invoice.invoiceNumber} to ${invoice.clientEmail}`);
        
        // Update the invoice status
        await storage.updateInvoiceStatus(invoice.id, 'sent');
        
        // Update the invoice in database
        // (Implementation note: we can't update sentAt directly in memory storage 
        // since it's not part of InsertInvoice schema, but the database will handle it)
        
        // Mark the scheduled record as sent
        await storage.updateScheduledInvoiceStatus(scheduledInvoice.id, 'sent');
        
        success++;
      } catch (error) {
        console.error(`Error processing scheduled invoice ${scheduledInvoice.id}:`, error);
        
        // Mark as failed and increment retry count
        const retryCount = scheduledInvoice.retryCount || 0;
        await storage.updateScheduledInvoiceStatus(
          scheduledInvoice.id,
          retryCount >= 3 ? 'failed' : 'pending',
          error instanceof Error ? error.message : 'Unknown error'
        );
        
        failed++;
      }
    }
    
    return { success, failed };
  }
  
  /**
   * Process recurring templates to generate new invoices
   * @returns Statistics about the processing
   */
  static async processRecurringTemplates(): Promise<{ success: number, failed: number }> {
    const templates = await storage.getRecurringTemplatesToProcess();
    let success = 0;
    let failed = 0;
    
    for (const template of templates) {
      try {
        // Generate a new invoice from this template
        const invoice = await storage.generateInvoiceFromTemplate(template.id);
        
        if (!invoice) {
          failed++;
          console.error(`Failed to generate invoice from template ${template.id}`);
          continue;
        }
        
        // Calculate the next invoice date based on the frequency
        const nextDate = InvoiceProcessor.calculateNextInvoiceDate(template.frequency, new Date());
        
        // Update the template with the new next invoice date
        await storage.updateRecurringTemplateNextDate(template.id, nextDate);
        
        console.log(`Generated invoice ${invoice.invoiceNumber} from template "${template.name}"`);
        
        success++;
      } catch (error) {
        console.error(`Error processing recurring template ${template.id}:`, error);
        failed++;
      }
    }
    
    return { success, failed };
  }
  
  /**
   * Calculate the next invoice date based on the frequency
   * @param frequency The frequency string ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')
   * @param currentDate The current date to calculate from
   * @returns The next date for invoice generation
   */
  private static calculateNextInvoiceDate(frequency: string, currentDate: Date): Date {
    const nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        // Default to monthly if frequency is unknown
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate;
  }
}