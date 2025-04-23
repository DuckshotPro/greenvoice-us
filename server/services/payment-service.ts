import { v4 as uuidv4 } from 'uuid';
import { storage } from '../models/storage';
import { logInfo, logError } from '../utils/logger';
import { type Payment } from '@shared/schema';

export interface PaymentOptions {
  invoiceId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  tipAmount?: number;
  note?: string;
  receiptUrl?: string;
  transactionId?: string;
}

export class PaymentService {
  /**
   * Process a new payment for an invoice
   */
  static async processPayment(options: PaymentOptions): Promise<Payment> {
    try {
      const {
        invoiceId,
        amount,
        currency,
        paymentMethod,
        tipAmount,
        note,
        receiptUrl,
        transactionId
      } = options;

      // Get the invoice to verify it exists
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }

      // Create payment record
      const paymentData = {
        id: uuidv4(),
        invoiceId,
        amount,
        currency: currency || 'USD',
        paymentMethod,
        paymentDate: new Date(),
        tipAmount,
        note,
        receiptUrl,
        transactionId,
        status: 'completed',
        createdAt: new Date()
      };

      // Store the payment
      const payment = await storage.storePayment(paymentData);

      // Calculate total paid amount
      const payments = await storage.getPaymentsByInvoiceId(invoiceId);
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

      // Update invoice status based on payment
      let newStatus: string;

      if (totalPaid >= parseFloat(invoice.total.toString())) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partially_paid';
      } else {
        newStatus = invoice.status;
      }

      // Update invoice status if needed
      if (newStatus !== invoice.status) {
        await storage.updateInvoiceStatus(invoiceId, newStatus);
      }

      logInfo('Payment processed successfully', 'PaymentService', {
        invoiceId,
        amount,
        paymentMethod,
        tipAmount,
        totalPaid
      });

      return payment;
    } catch (error) {
      logError(`Error processing payment: ${error.message}`, 'PaymentService', {
        invoiceId: options.invoiceId,
        amount: options.amount
      });
      throw error;
    }
  }

  /**
   * Calculate payment summary for an invoice
   */
  static async getPaymentSummary(invoiceId: number): Promise<{
    totalPaid: number;
    remaining: number;
    isFullyPaid: boolean;
    payments: Payment[];
  }> {
    try {
      // Get the invoice
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }

      // Get all payments for this invoice
      const payments = await storage.getPaymentsByInvoiceId(invoiceId);

      // Calculate total paid amount
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

      // Calculate remaining amount
      const remaining = parseFloat(invoice.total.toString()) - totalPaid;

      // Determine if fully paid
      const isFullyPaid = remaining <= 0;

      return {
        totalPaid,
        remaining,
        isFullyPaid,
        payments
      };
    } catch (error) {
      logError(`Error getting payment summary: ${error.message}`, 'PaymentService', {
        invoiceId
      });
      throw error;
    }
  }
}