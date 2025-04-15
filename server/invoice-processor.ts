import { storage } from "./storage";
import { Invoice, ScheduledInvoice, RecurringTemplate } from "@shared/schema";
import { logInfo, logError, logDbError } from "./lib/error-logger";

/**
 * InvoiceProcessor handles operations related to scheduled invoices and recurring templates
 * It processes invoices that are scheduled to be sent and generates new invoices from templates
 */
export class InvoiceProcessor {
  private static readonly SOURCE = 'InvoiceProcessor';
  
  /**
   * Process all scheduled invoices that need to be sent
   * @returns Statistics about the processing
   */
  /**
 * Processes all scheduled invoices that are due to be sent.
 * @returns {Promise<{ success: number, failed: number }>} Processing statistics.
 */
static async processScheduledInvoices(): Promise<{ success: number, failed: number }> {
    try {
      const scheduledInvoices = await storage.getScheduledInvoicesToProcess();
      let success = 0;
      let failed = 0;
      
      logInfo(`Processing ${scheduledInvoices.length} scheduled invoices`, this.SOURCE);

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
            
            logError(
              `Invoice not found for scheduled invoice ${scheduledInvoice.id}`, 
              this.SOURCE, 
              { invoiceId: scheduledInvoice.invoiceId }
            );
            
            failed++;
            continue;
          }
          
          // Simulate sending the invoice
          // In a real system, this would connect to an email service
          logInfo(
            `Sending scheduled invoice ${invoice.invoiceNumber} to ${invoice.clientEmail}`, 
            this.SOURCE,
            { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber }
          );
          
          // Update the invoice status
          await storage.updateInvoiceStatus(invoice.id, 'sent');
          
          // Update the invoice in database
          // (Implementation note: we can't update sentAt directly in memory storage 
          // since it's not part of InsertInvoice schema, but the database will handle it)
          
          // Mark the scheduled record as sent
          await storage.updateScheduledInvoiceStatus(scheduledInvoice.id, 'sent');
          
          success++;
        } catch (error) {
          logDbError(
            `processing scheduled invoice ${scheduledInvoice.id}`,
            error,
            scheduledInvoice.id
          );
          
          // Mark as failed and increment retry count
          const retryCount = scheduledInvoice.retryCount || 0;
          try {
            await storage.updateScheduledInvoiceStatus(
              scheduledInvoice.id,
              retryCount >= 3 ? 'failed' : 'pending',
              error instanceof Error ? error.message : 'Unknown error'
            );
          } catch (updateError) {
            // If we can't even update the status, log this as a critical issue
            logError(
              `Failed to update status for scheduled invoice ${scheduledInvoice.id}`, 
              this.SOURCE, 
              { originalError: error, updateError }
            );
          }
          
          failed++;
        }
      }
      
      logInfo(`Processed scheduled invoices - Success: ${success}, Failed: ${failed}`, this.SOURCE);
      return { success, failed };
    } catch (error) {
      logError('Failed to process scheduled invoices', this.SOURCE, error);
      return { success: 0, failed: 0 };
    }
  }
  
  /**
   * Process recurring templates to generate new invoices
   * @returns Statistics about the processing
   */
  /**
 * Processes recurring templates to generate new invoices.
 * @returns {Promise<{ success: number, failed: number }>} Processing statistics.
 */
static async processRecurringTemplates(): Promise<{ success: number, failed: number }> {
    try {
      const templates = await storage.getRecurringTemplatesToProcess();
      let success = 0;
      let failed = 0;
      
      logInfo(`Processing ${templates.length} recurring templates`, this.SOURCE);
      
      for (const template of templates) {
        try {
          // Generate a new invoice from this template
          const invoice = await storage.generateInvoiceFromTemplate(template.id);
          
          if (!invoice) {
            failed++;
            logError(
              `Failed to generate invoice from template ${template.id}`, 
              this.SOURCE,
              { templateId: template.id, templateName: template.name }
            );
            continue;
          }
          
          // Calculate the next invoice date based on the frequency
          const nextDate = InvoiceProcessor.calculateNextInvoiceDate(template.frequency, new Date());
          
          // Update the template with the new next invoice date
          await storage.updateRecurringTemplateNextDate(template.id, nextDate);
          
          logInfo(
            `Generated invoice ${invoice.invoiceNumber} from template "${template.name}"`, 
            this.SOURCE,
            { 
              templateId: template.id, 
              invoiceId: invoice.id, 
              invoiceNumber: invoice.invoiceNumber,
              nextDate: nextDate.toISOString()
            }
          );
          
          success++;
        } catch (error) {
          logDbError(
            `processing recurring template ${template.id}`,
            error,
            template.id
          );
          failed++;
        }
      }
      
      logInfo(`Processed recurring templates - Success: ${success}, Failed: ${failed}`, this.SOURCE);
      return { success, failed };
    } catch (error) {
      logError('Failed to process recurring templates', this.SOURCE, error);
      return { success: 0, failed: 0 };
    }
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