
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Invoice, InvoiceItem } from '../../shared/schema';
import { logInfo, logError } from '../utils/logger';
import { FileAttachmentService } from './file-attachment-service';
import { PaymentService } from './payment-service';
import { BusinessMetricsLogger } from '../utils/business-metrics-logger';

export class PDFService {
  private static readonly SOURCE = 'PDFService';

  /**
   * Generate a PDF for an invoice
   */
  static async generateInvoicePDF(
    invoice: Invoice,
    userId: string,
    options: {
      includeAttachments?: boolean;
      includePaymentHistory?: boolean;
    } = {}
  ): Promise<Buffer> {
    const startTime = Date.now();
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Buffer to store PDF data
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      
      // Add invoice header
      this.addHeader(doc, invoice);
      
      // Add invoice details
      this.addInvoiceDetails(doc, invoice);
      
      // Add invoice items
      this.addInvoiceItems(doc, invoice);
      
      // Add invoice summary
      await this.addInvoiceSummary(doc, invoice);
      
      // Add payment history if requested
      if (options.includePaymentHistory) {
        await this.addPaymentHistory(doc, invoice);
      }
      
      // Add notes and terms
      this.addNotesAndTerms(doc, invoice);
      
      // Add attachments if requested
      if (options.includeAttachments) {
        await this.addAttachments(doc, invoice);
      }
      
      // Finalize the PDF
      doc.end();
      
      // Return the PDF as a buffer
      return new Promise((resolve) => {
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          
          // Log PDF generation
          const duration = Date.now() - startTime;
          logInfo(`Generated PDF for invoice ${invoice.id}`, this.SOURCE, {
            invoiceId: invoice.id,
            duration,
            size: pdfData.length
          });
          
          // Track business metrics
          BusinessMetricsLogger.logFeatureUsage('generate_pdf', {
            userId,
            successful: true,
            duration
          });
          
          resolve(pdfData);
        });
      });
    } catch (error) {
      logError(`Failed to generate PDF for invoice ${invoice.id}`, this.SOURCE, { error });
      throw error;
    }
  }

  /**
   * Add invoice header to PDF
   */
  private static addHeader(doc: PDFKit.PDFDocument, invoice: Invoice): void {
    // Add logo if available
    if (invoice.logo) {
      try {
        doc.image(invoice.logo, 50, 45, { width: 150 });
      } catch (error) {
        // If logo loading fails, continue without it
        logError(`Failed to load logo for invoice ${invoice.id}`, this.SOURCE, { error });
      }
    }

    // Add company details
    doc.fontSize(20).text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`, 400, 80, { align: 'right' });
    doc.text(`Date: ${invoice.date}`, 400, 95, { align: 'right' });
    doc.text(`Due Date: ${invoice.dueDate}`, 400, 110, { align: 'right' });
  }

  /**
   * Add invoice details to PDF
   */
  private static addInvoiceDetails(doc: PDFKit.PDFDocument, invoice: Invoice): void {
    // Add client details
    doc.fontSize(14).text('Bill To:', 50, 150);
    doc.fontSize(12).text(invoice.clientName, 50, 170);
    doc.text(invoice.clientEmail, 50, 185);
    
    if (invoice.clientAddress) {
      doc.text(invoice.clientAddress, 50, 200);
    }

    // Add a line to separate header from items
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 240).lineTo(550, 240).stroke();
  }

  /**
   * Add invoice items to PDF
   */
  private static addInvoiceItems(doc: PDFKit.PDFDocument, invoice: Invoice): void {
    // Table header
    doc.fontSize(12).text('Item', 50, 260);
    doc.text('Description', 150, 260);
    doc.text('Quantity', 300, 260, { width: 70, align: 'right' });
    doc.text('Price', 370, 260, { width: 80, align: 'right' });
    doc.text('Amount', 450, 260, { width: 80, align: 'right' });
    
    // Add a line under the header
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 280).lineTo(550, 280).stroke();
    
    // Table items
    let y = 300;
    invoice.items.forEach((item: InvoiceItem) => {
      doc.fontSize(12).text(item.name, 50, y, { width: 90 });
      doc.text(item.description || '', 150, y, { width: 140 });
      doc.text(item.quantity.toString(), 300, y, { width: 70, align: 'right' });
      doc.text(`$${item.price.toFixed(2)}`, 370, y, { width: 80, align: 'right' });
      doc.text(`$${(item.quantity * item.price).toFixed(2)}`, 450, y, { width: 80, align: 'right' });
      
      // Move to next item position
      y += 30;
      
      // Add new page if we run out of space
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
    
    // Line under items
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
  }

  /**
   * Add invoice summary to PDF
   */
  private static async addInvoiceSummary(doc: PDFKit.PDFDocument, invoice: Invoice): Promise<void> {
    let y = doc.y + 20;
    
    // Calculate subtotal
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    doc.fontSize(12).text('Subtotal:', 370, y, { width: 80, align: 'right' });
    doc.text(`$${subtotal.toFixed(2)}`, 450, y, { width: 80, align: 'right' });
    
    // Add discount if applicable
    y += 20;
    if (invoice.discount && invoice.discount > 0) {
      const discountAmount = (subtotal * invoice.discount) / 100;
      doc.text(`Discount (${invoice.discount}%):`, 370, y, { width: 80, align: 'right' });
      doc.text(`-$${discountAmount.toFixed(2)}`, 450, y, { width: 80, align: 'right' });
      y += 20;
    }
    
    // Add tax if applicable
    if (invoice.taxRate && invoice.taxRate > 0) {
      let taxableAmount = subtotal;
      if (invoice.discount && invoice.discount > 0) {
        taxableAmount -= (subtotal * invoice.discount) / 100;
      }
      
      const taxAmount = (taxableAmount * invoice.taxRate) / 100;
      doc.text(`Tax (${invoice.taxRate}%):`, 370, y, { width: 80, align: 'right' });
      doc.text(`$${taxAmount.toFixed(2)}`, 450, y, { width: 80, align: 'right' });
      y += 20;
    }
    
    // Get payments total
    const totalPaid = await PaymentService.getTotalPaid(invoice.id);
    
    // Calculate total
    let total = subtotal;
    if (invoice.discount && invoice.discount > 0) {
      total -= (subtotal * invoice.discount) / 100;
    }
    if (invoice.taxRate && invoice.taxRate > 0) {
      total += (total * invoice.taxRate) / 100;
    }
    
    // Add total
    doc.fontSize(14).text('Total:', 370, y, { width: 80, align: 'right' });
    doc.text(`$${total.toFixed(2)}`, 450, y, { width: 80, align: 'right' });
    
    // Add amount paid
    y += 25;
    doc.fontSize(12).text('Amount Paid:', 370, y, { width: 80, align: 'right' });
    doc.text(`$${totalPaid.toFixed(2)}`, 450, y, { width: 80, align: 'right' });
    
    // Add balance due
    y += 20;
    const balanceDue = Math.max(0, total - totalPaid);
    doc.fontSize(14).text('Balance Due:', 370, y, { width: 80, align: 'right' });
    doc.text(`$${balanceDue.toFixed(2)}`, 450, y, { width: 80, align: 'right' });
  }

  /**
   * Add payment history to PDF
   */
  private static async addPaymentHistory(doc: PDFKit.PDFDocument, invoice: Invoice): Promise<void> {
    // Get all payments for this invoice
    const payments = await PaymentService.getPayments(invoice.id);
    
    if (payments.length === 0) {
      return;
    }
    
    // Add a new page if we're near the bottom
    if (doc.y > 650) {
      doc.addPage();
    }
    
    // Add payment history section
    doc.moveDown(2);
    doc.fontSize(14).text('Payment History', 50, doc.y);
    doc.moveDown();
    
    // Payment table header
    doc.fontSize(12).text('Date', 50, doc.y);
    doc.text('Method', 150, doc.y);
    doc.text('Amount', 250, doc.y, { width: 80, align: 'right' });
    doc.text('Status', 350, doc.y);
    
    // Add a line under the header
    const headerY = doc.y + 15;
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, headerY).lineTo(550, headerY).stroke();
    
    doc.moveDown();
    
    // Payment table items
    payments.forEach((payment) => {
      const paymentDate = new Date(payment.paymentDate).toLocaleDateString();
      doc.fontSize(12).text(paymentDate, 50, doc.y);
      doc.text(payment.paymentMethod, 150, doc.y);
      doc.text(`$${payment.amount.toFixed(2)}`, 250, doc.y, { width: 80, align: 'right' });
      doc.text(payment.status, 350, doc.y);
      
      // If there's a tip, add it
      if (payment.tipAmount && payment.tipAmount > 0) {
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Tip: $${payment.tipAmount.toFixed(2)}`, 150, doc.y);
      }
      
      doc.moveDown();
    });
  }

  /**
   * Add notes and terms to PDF
   */
  private static addNotesAndTerms(doc: PDFKit.PDFDocument, invoice: Invoice): void {
    // Add a new page if we're near the bottom
    if (doc.y > 650) {
      doc.addPage();
    }
    
    // Add notes if available
    if (invoice.notes) {
      doc.moveDown(2);
      doc.fontSize(14).text('Notes', 50, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(12).text(invoice.notes, 50, doc.y);
    }
    
    // Add terms if available
    if (invoice.terms) {
      doc.moveDown(2);
      doc.fontSize(14).text('Terms & Conditions', 50, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(12).text(invoice.terms, 50, doc.y);
    }
  }

  /**
   * Add attachments to PDF
   */
  private static async addAttachments(doc: PDFKit.PDFDocument, invoice: Invoice): Promise<void> {
    // Get all attachments for this invoice
    const attachments = await FileAttachmentService.getAttachments(invoice.id);
    
    if (attachments.length === 0) {
      return;
    }
    
    // Add a new page for attachments
    doc.addPage();
    
    // Add attachments section
    doc.fontSize(16).text('Attachments', 50, 50, { underline: true });
    doc.moveDown();
    
    // List all attachments
    let y = doc.y;
    attachments.forEach((attachment, index) => {
      // Add attachment number and filename
      doc.fontSize(12).text(`${index + 1}. ${attachment.fileName}`, 50, y);
      doc.fontSize(10).text(`Type: ${attachment.fileType} | Size: ${this.formatFileSize(attachment.fileSize)}`, 70, y + 15);
      
      // Add thumbnail for images if available
      if (attachment.thumbnailUrl && attachment.fileType.startsWith('image/')) {
        try {
          // In a real implementation, you would retrieve the actual file here
          // For simplicity, we're skipping actual file embedding
          doc.text('(Image preview not embedded)', 70, y + 30, { italic: true });
        } catch (error) {
          // Continue without thumbnail if it fails
        }
        y += 50;
      } else {
        y += 30;
      }
      
      // Check if we need a new page
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} bytes`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }
}
