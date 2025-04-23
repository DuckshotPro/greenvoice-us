
import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/payment-service';
import { activityTrackers } from '../middleware/activity-tracker';
import { requireAuth } from '../middleware/auth';
import { storage } from '../models/storage';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// Process a payment for an invoice
router.post(
  '/invoices/:invoiceId/payments',
  requireAuth,
  [
    param('invoiceId').isString().withMessage('Invoice ID must be provided'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('currency').isString().withMessage('Currency is required'),
    body('paymentMethod').isString().withMessage('Payment method is required'),
    body('tipAmount').optional().isNumeric().withMessage('Tip must be a number'),
    body('note').optional().isString().withMessage('Note must be a string')
  ],
  activityTrackers.processPayment,
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Validate request body
      const { amount, currency, paymentMethod, tipAmount, note } = req.body;
      
      if (!amount || !currency || !paymentMethod) {
        return res.status(400).json({ 
          error: 'Missing required fields: amount, currency, paymentMethod' 
        });
      }
      
      // Check if invoice exists and user has access
      const invoice = await storage.getInvoice(Number(invoiceId));
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      if (invoice.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to update this invoice' });
      }
      
      // Process the payment
      const payment = await PaymentService.processPayment(
        invoiceId,
        userId,
        {
          amount: parseFloat(amount),
          currency,
          paymentMethod,
          tipAmount: tipAmount ? parseFloat(tipAmount) : undefined,
          note
        }
      );
      
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'An error occurred while processing payment' });
    }
  }
);

// Get all payments for an invoice
router.get(
  '/invoices/:invoiceId/payments',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Check if invoice exists and user has access
      const invoice = await storage.getInvoice(Number(invoiceId));
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      if (invoice.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to access this invoice' });
      }
      
      const payments = await PaymentService.getPayments(invoiceId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'An error occurred while retrieving payments' });
    }
  }
);

// Get payment summary for an invoice
router.get(
  '/invoices/:invoiceId/payment-summary',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Check if invoice exists and user has access
      const invoice = await storage.getInvoice(Number(invoiceId));
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      if (invoice.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to access this invoice' });
      }
      
      const totalPaid = await PaymentService.getTotalPaid(invoiceId);
      const remainingBalance = await PaymentService.getRemainingBalance(invoice);
      
      res.json({
        invoiceId,
        totalPaid,
        remainingBalance,
        isFullyPaid: remainingBalance === 0
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'An error occurred while retrieving payment summary' });
    }
  }
);

export default router;
