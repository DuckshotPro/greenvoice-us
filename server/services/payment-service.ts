
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../models/storage';
import { logInfo, logError } from '../utils/logger';
import { Payment, Invoice, PaymentStatus } from '../../shared/schema';
import { BusinessMetricsLogger } from '../utils/business-metrics-logger';

export class PaymentService {
  private static readonly SOURCE = 'PaymentService';

  /**
   * Process a payment for an invoice
   */
  static async processPayment(
    invoiceId: string,
    userId: string,
    paymentData: {
      amount: number;
      currency: string;
      paymentMethod: string;
      tipAmount?: number;
      note?: string;
    }
  ): Promise<Payment> {
    try {
      // Get the invoice to check current status and total amount
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Calculate invoice total
      const invoiceTotal = this.calculateInvoiceTotal(invoice);
      
      // Validate payment amount
      if (paymentData.amount <= 0) {
        throw new Error('Payment amount must be positive');
      }
      
      if (paymentData.amount > invoiceTotal) {
        throw new Error('Payment amount exceeds invoice total');
      }

      // Create the payment record
      const payment: Payment = {
        id: uuidv4(),
        invoiceId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: new Date().toISOString(),
        tipAmount: paymentData.tipAmount,
        note: paymentData.note,
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      // Save payment record in database
      await storage.storePayment(payment);

      // Update invoice status based on payment
      await this.updateInvoicePaymentStatus(invoice);

      // Log the payment
      logInfo(`Payment processed: ${payment.id}`, this.SOURCE, {
        invoiceId,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod
      });

      // Track business metrics
      BusinessMetricsLogger.logPaymentReceived(invoiceId, {
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        isPartial: payment.amount < invoiceTotal,
        hasTip: !!payment.tipAmount,
        tipAmount: payment.tipAmount
      });

      return payment;
    } catch (error) {
      logError(`Failed to process payment`, this.SOURCE, { invoiceId, error });
      throw error;
    }
  }

  /**
   * Get all payments for an invoice
   */
  static async getPayments(invoiceId: string): Promise<Payment[]> {
    try {
      return await storage.getPaymentsByInvoiceId(invoiceId);
    } catch (error) {
      logError(`Failed to get payments`, this.SOURCE, { invoiceId, error });
      throw error;
    }
  }

  /**
   * Calculate total amount paid for an invoice
   */
  static async getTotalPaid(invoiceId: string): Promise<number> {
    try {
      const payments = await this.getPayments(invoiceId);
      return payments.reduce((total, payment) => {
        if (payment.status === 'completed') {
          return total + payment.amount;
        }
        return total;
      }, 0);
    } catch (error) {
      logError(`Failed to calculate total paid`, this.SOURCE, { invoiceId, error });
      throw error;
    }
  }

  /**
   * Calculate remaining balance for an invoice
   */
  static async getRemainingBalance(invoice: Invoice): Promise<number> {
    try {
      const totalPaid = await this.getTotalPaid(invoice.id);
      const invoiceTotal = this.calculateInvoiceTotal(invoice);
      return Math.max(0, invoiceTotal - totalPaid);
    } catch (error) {
      logError(`Failed to calculate remaining balance`, this.SOURCE, { invoiceId: invoice.id, error });
      throw error;
    }
  }

  /**
   * Update invoice payment status based on payments
   */
  private static async updateInvoicePaymentStatus(invoice: Invoice): Promise<void> {
    try {
      const totalPaid = await this.getTotalPaid(invoice.id);
      const invoiceTotal = this.calculateInvoiceTotal(invoice);
      
      let newStatus = invoice.status;
      
      // Determine payment status
      if (totalPaid >= invoiceTotal) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partially_paid';
      }
      
      // Only update if status has changed
      if (newStatus !== invoice.status) {
        await storage.updateInvoiceStatus(invoice.id, newStatus);
      }
    } catch (error) {
      logError(`Failed to update invoice payment status`, this.SOURCE, { invoiceId: invoice.id, error });
      throw error;
    }
  }

  /**
   * Calculate total amount for an invoice
   */
  private static calculateInvoiceTotal(invoice: Invoice): number {
    // Calculate subtotal from items
    const subtotal = invoice.items.reduce((total, item) => {
      return total + (item.quantity * item.price);
    }, 0);
    
    // Apply discount if any
    let discountedAmount = subtotal;
    if (invoice.discount && invoice.discount > 0) {
      discountedAmount -= (subtotal * invoice.discount) / 100;
    }
    
    // Apply tax if any
    let total = discountedAmount;
    if (invoice.taxRate && invoice.taxRate > 0) {
      total += (discountedAmount * invoice.taxRate) / 100;
    }
    
    return total;
  }
}
