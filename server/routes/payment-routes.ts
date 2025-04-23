import express from 'express';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import { PaymentService } from '../services/payment-service';
import { storage } from '../models/storage';
import { logInfo, logError } from '../utils/logger';

const router = express.Router();

// Get all payments for an invoice
router.get(
  '/:invoiceId', 
  requireAuth,
  param('invoiceId').isInt().withMessage('Invoice ID must be an integer'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);

      // Check if the invoice belongs to the authenticated user
      const invoice = await storage.getInvoice(invoiceId);

      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      if (invoice.userId !== req.user?.id) {
        return res.status(403).json({ message: 'You do not have permission to access this invoice' });
      }

      // Get payment summary
      const summary = await PaymentService.getPaymentSummary(invoiceId);

      res.json(summary);
    } catch (error) {
      logError(`Error retrieving payments: ${error.message}`, 'PaymentRoutes', {
        invoiceId: req.params.invoiceId,
        userId: req.user?.id
      });
      res.status(500).json({ message: 'Failed to retrieve payments' });
    }
  }
);

// Process a new payment
router.post(
  '/:invoiceId',
  requireAuth,
  param('invoiceId').isInt().withMessage('Invoice ID must be an integer'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('paymentMethod').isString().withMessage('Payment method is required'),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  body('tipAmount').optional().isNumeric().withMessage('Tip amount must be a number'),
  body('note').optional().isString(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);

      // Check if the invoice belongs to the authenticated user
      const invoice = await storage.getInvoice(invoiceId);

      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      if (invoice.userId !== req.user?.id) {
        return res.status(403).json({ message: 'You do not have permission to access this invoice' });
      }

      // Process the payment
      const payment = await PaymentService.processPayment({
        invoiceId,
        amount: parseFloat(req.body.amount),
        currency: req.body.currency || invoice.currency || 'USD',
        paymentMethod: req.body.paymentMethod,
        tipAmount: req.body.tipAmount ? parseFloat(req.body.tipAmount) : undefined,
        note: req.body.note,
        receiptUrl: req.body.receiptUrl,
        transactionId: req.body.transactionId
      });

      logInfo('Payment created successfully', 'PaymentRoutes', {
        invoiceId,
        amount: req.body.amount,
        userId: req.user?.id
      });

      res.status(201).json(payment);
    } catch (error) {
      logError(`Error creating payment: ${error.message}`, 'PaymentRoutes', {
        invoiceId: req.params.invoiceId,
        userId: req.user?.id
      });
      res.status(500).json({ message: 'Failed to process payment' });
    }
  }
);

export default router;