import { Router, Request, Response } from "express";
import { storage } from "../models/storage";
import { logInfo, logError } from "../utils/error-logger";
import { z } from "zod";
import Stripe from "stripe";

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

// Validation schemas
const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  invoiceId: z.number(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const trackPaymentActionSchema = z.object({
  invoiceId: z.number(),
  action: z.enum(["payment_started", "payment_completed", "payment_failed"]),
  paymentIntentId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Create payment intent for client portal
 * POST /api/client-portal/create-payment-intent
 */
router.post("/create-payment-intent", async (req: Request, res: Response) => {
  try {
    const { amount, invoiceId, description, metadata } = createPaymentIntentSchema.parse(req.body);

    // Get invoice to verify it exists and get details
    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      description: description || `Payment for Invoice ${invoice.invoiceNumber}`,
      metadata: {
        invoiceId: String(invoiceId),
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Track payment initiation analytics
    try {
      await storage.trackShareAnalytics({
        invoiceId,
        userId: null, // Client portal users are not authenticated
        shareMethod: "payment_initiation",
        eventType: "payment",
        metadata: {
          paymentIntentId: paymentIntent.id,
          amount,
          currency: "usd",
          timestamp: new Date().toISOString()
        }
      });
    } catch (analyticsError) {
      // Don't fail the payment if analytics tracking fails
      logError("Failed to track payment initiation analytics", "ClientPortal", { 
        error: String(analyticsError),
        invoiceId,
        paymentIntentId: paymentIntent.id
      });
    }

    logInfo("Payment intent created for client portal", "ClientPortal", {
      invoiceId,
      paymentIntentId: paymentIntent.id,
      amount,
      clientName: invoice.clientName
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid request data",
        errors: error.errors 
      });
    }

    logError("Failed to create payment intent", "ClientPortal", { 
      error: String(error),
      body: req.body
    });
    
    res.status(500).json({ 
      message: "Failed to create payment intent" 
    });
  }
});

/**
 * Track payment actions for analytics
 * POST /api/client-portal/track-payment
 */
router.post("/track-payment", async (req: Request, res: Response) => {
  try {
    const { invoiceId, action, paymentIntentId, metadata } = trackPaymentActionSchema.parse(req.body);

    // Track the payment action
    await storage.trackShareAnalytics({
      invoiceId,
      userId: null, // Client portal users are not authenticated
      shareMethod: `payment_${action}`,
      eventType: "payment",
      metadata: {
        paymentIntentId,
        action,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });

    logInfo(`Payment ${action} tracked`, "ClientPortal", {
      invoiceId,
      action,
      paymentIntentId
    });

    res.json({ success: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid request data",
        errors: error.errors 
      });
    }

    logError("Failed to track payment action", "ClientPortal", { 
      error: String(error),
      body: req.body
    });
    
    res.status(500).json({ 
      message: "Failed to track payment action" 
    });
  }
});

/**
 * Handle successful payment webhook from Stripe
 * POST /api/client-portal/webhook
 */
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logError("Webhook signature verification failed", "ClientPortal", { 
      error: String(err)
    });
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      try {
        const invoiceId = parseInt(paymentIntent.metadata.invoiceId);
        
        // Update invoice status to paid
        await storage.updateInvoice(invoiceId, { status: 'paid' });
        
        // Track successful payment
        await storage.trackShareAnalytics({
          invoiceId,
          userId: null,
          shareMethod: "payment_completed",
          eventType: "payment",
          metadata: {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100, // Convert from cents
            currency: paymentIntent.currency,
            timestamp: new Date().toISOString()
          }
        });

        logInfo("Payment completed successfully", "ClientPortal", {
          invoiceId,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100
        });

      } catch (error) {
        logError("Failed to process successful payment", "ClientPortal", { 
          error: String(error),
          paymentIntentId: paymentIntent.id
        });
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      
      try {
        const invoiceId = parseInt(failedPayment.metadata.invoiceId);
        
        // Track failed payment
        await storage.trackShareAnalytics({
          invoiceId,
          userId: null,
          shareMethod: "payment_failed",
          eventType: "payment",
          metadata: {
            paymentIntentId: failedPayment.id,
            amount: failedPayment.amount / 100,
            currency: failedPayment.currency,
            timestamp: new Date().toISOString(),
            lastPaymentError: failedPayment.last_payment_error?.message
          }
        });

        logInfo("Payment failed", "ClientPortal", {
          invoiceId,
          paymentIntentId: failedPayment.id,
          error: failedPayment.last_payment_error?.message
        });

      } catch (error) {
        logError("Failed to process failed payment", "ClientPortal", { 
          error: String(error),
          paymentIntentId: failedPayment.id
        });
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * Get client portal analytics for an invoice
 * GET /api/client-portal/analytics/:invoiceId
 */
router.get("/analytics/:invoiceId", async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.invoiceId);

    // Get payment analytics for this invoice
    const paymentAnalytics = await storage.getShareAnalytics(invoiceId);
    
    // Calculate metrics
    const totalViews = paymentAnalytics.filter(a => a.eventType === "view").length;
    const paymentAttempts = paymentAnalytics.filter(a => a.shareMethod === "payment_initiation").length;
    const successfulPayments = paymentAnalytics.filter(a => a.shareMethod === "payment_completed").length;
    const failedPayments = paymentAnalytics.filter(a => a.shareMethod === "payment_failed").length;
    
    const conversionRate = totalViews > 0 ? (successfulPayments / totalViews) * 100 : 0;

    res.json({
      totalViews,
      paymentAttempts,
      successfulPayments,
      failedPayments,
      conversionRate: Math.round(conversionRate * 100) / 100,
      analytics: paymentAnalytics
    });

  } catch (error) {
    logError("Failed to get client portal analytics", "ClientPortal", { 
      error: String(error),
      invoiceId: req.params.invoiceId
    });
    
    res.status(500).json({ 
      message: "Failed to get analytics" 
    });
  }
});

export default router;