import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./models/storage";
import { pool } from "./models/db";
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';

// Define rate limit settings
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later"
});
import { z } from "zod";
import { 
  invoiceWithItemsSchema, 
  insertInvoiceSchema, 
  recurringTemplateWithItemsSchema, 
  insertRecurringTemplateSchema 
} from "@shared/schema";
import { createWriteStream, promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { ZodError } from "zod";
import nodemailer from "nodemailer";
import { InvoiceProcessor } from "./services/invoice-processor";
import { ErrorLogger, LogLevel, logError, logInfo, logWarning } from "./lib/error-logger";
import { log } from "./utils/vite";
import { setupAuth, requireAuth, requireAdmin } from "./middleware/auth";
import { validateBody, validateQuery, validateParams } from "./middleware/validation";
import { validateIdParam } from "./middleware/validation-schemas";
import { 
  idParamSchema, 
  emailRequestSchema, 
  scheduleRequestSchema, 
  paginationSchema, 
  toggleActiveSchema,
  extendedInvoiceSchema,
  extendedTemplateSchema,
  adViewSchema,
  statusParamSchema
} from "./middleware/validation-schemas";
import { analyticsRoutes } from "./routes/analytics-routes";
import brandingRoutes from "./routes/branding-routes";
import {
  trackShareSchema,
  analyticsQuerySchema,
  recordViewSchema,
  trackUtmSchema
} from "./middleware/validation-schemas-analytics";

// Admin and Auth middleware are now imported from './middleware/auth'

// Mock transporter for email functionality
/**
 * Mock transporter for email functionality
 * @type {Object}
 * @property {Function} sendMail - Sends a mock email
 */
const transporter = {
  sendMail: async (options: any) => {
    console.log("Email sent with options:", options);
    return { messageId: `mock-${nanoid(8)}` };
  }
};

/**
 * Registers API routes for the application
 * @param {Express} app - An instance of the Express application
 * @returns {Promise<Server>} The HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Set up server
  const httpServer = createServer(app);

  // Apply the rate limiting middleware to all /api/ routes
  app.use("/api/", apiLimiter);

  // Set up authentication routes
  setupAuth(app);
  
  // Register analytics routes
  app.use("/api/analytics", analyticsRoutes);
  
  // Register branding routes
  app.use("/api/branding", brandingRoutes);
  
  // Initialize Stripe with secret key
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
  });
  
  // Create a payment intent for Stripe with Google Pay support
  app.post("/api/create-payment-intent", requireAuth, async (req: Request, res: Response) => {
    try {
      const { amount, currency = 'usd' } = req.body;
      
      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }
      
      // Amount should be in cents (e.g., $12.00 = 1200)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        payment_method_types: ['card', 'google_pay'],
        metadata: {
          userId: req.user?.id.toString() || '',
          userEmail: req.user?.email || '',
          plan: 'premium'
        },
      });
      
      logInfo(`Payment intent created for user`, "PaymentController", {
        userId: req.user?.id,
        amount,
        currency
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      logError("Payment intent creation failed", "PaymentController", { 
        error, 
        userId: req.user?.id 
      });
      res.status(500).json({ 
        message: "Failed to create payment intent",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Auth middleware is now imported from './middleware/auth'

  // Get all invoices
  app.get("/api/invoices", requireAuth, validateQuery(paginationSchema), async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const invoices = await storage.getAllInvoices(userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get invoices by status - this must come before the general :id route
  app.get("/api/invoices/status/:status", requireAuth, validateParams(statusParamSchema), async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

      // Status is already validated by the middleware

      const invoices = await storage.getInvoicesByStatus(status, userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices by status:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get a specific invoice
  app.get("/api/invoices/:id", requireAuth, validateIdParam, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Get line items for this invoice
      const lineItems = await storage.getLineItems(id);

      res.json({ ...invoice, items: lineItems });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Get a specific invoice by shareable link
  app.get("/api/share/:shareableLink", async (req: Request, res: Response) => {
    try {
      const { shareableLink } = req.params;
      const invoices = await storage.getAllInvoices();
      const invoice = invoices.find(inv => inv.shareableLink === shareableLink);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Get line items for this invoice
      const lineItems = await storage.getLineItems(invoice.id);

      // Track the view for analytics (using 'link' as the share method)
      try {
        // Extract user agent, IP and referrer for analytics
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || req.socket.remoteAddress || '';
        const referrer = req.headers.referer || req.headers.referrer || '';

        // Record the view
        await storage.recordShareView(
          invoice.id,
          'link',
          referrer as string,
          userAgent as string,
          ipAddress as string
        );
      } catch (analyticsError) {
        // Don't let analytics tracking failure affect the response
        console.error('Error tracking share view:', analyticsError);
      }

      res.json({ ...invoice, items: lineItems });
    } catch (error) {
      console.error("Error fetching shared invoice:", error);
      res.status(500).json({ message: "Failed to fetch shared invoice" });
    }
  });

  // Create a new invoice with line items
  app.post("/api/invoices", requireAuth, validateBody(invoiceWithItemsSchema), async (req: Request, res: Response) => {
    try {
      // Request body is already validated by middleware
      const invoiceData = req.body;

      // Create invoice with items
      const newInvoice = await storage.createInvoiceWithItems(invoiceData);

      // Get line items for the response
      const lineItems = await storage.getLineItems(newInvoice.id);

      res.status(201).json({ ...newInvoice, items: lineItems });
    } catch (error) {
      console.error("Error creating invoice:", error);
      logError("Failed to create invoice", "InvoiceController", { error });
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Update an existing invoice
  app.patch("/api/invoices/:id", requireAuth, validateIdParam, validateBody(extendedInvoiceSchema.partial()), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;

      const updatedInvoice = await storage.updateInvoice(id, updateData);

      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Get line items for the response
      const lineItems = await storage.getLineItems(id);

      res.json({ ...updatedInvoice, items: lineItems });
    } catch (error) {
      console.error("Error updating invoice:", error);
      logError("Failed to update invoice", "InvoiceController", { error, invoiceId: req.params.id });
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Delete an invoice
  app.delete("/api/invoices/:id", requireAuth, validateIdParam, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verify invoice exists
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Verify invoice belongs to user
      if (req.user && invoice.userId !== req.user.id) {
        logWarning(`Unauthorized delete attempt for invoice ${id}`, "InvoiceController", {
          invoiceId: id,
          requestUserId: req.user.id,
          invoiceUserId: invoice.userId
        });
        return res.status(403).json({ message: "Not authorized to delete this invoice" });
      }
      
      const deleted = await storage.deleteInvoice(id);

      logInfo(`Invoice ${id} deleted successfully`, "InvoiceController", { 
        invoiceId: id,
        userId: req.user?.id
      });

      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      logError("Failed to delete invoice", "InvoiceController", { error, invoiceId: req.params.id });
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Send invoice via email
  app.post("/api/invoices/:id/email", requireAuth, validateIdParam, validateBody(emailRequestSchema), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { recipient, subject, message } = req.body;

      const invoice = await storage.getInvoice(id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Get line items
      const lineItems = await storage.getLineItems(id);

      // Generate shareable link
      const shareableUrl = `${req.protocol}://${req.get('host')}/share/${invoice.shareableLink}`;

      // Send email
      await transporter.sendMail({
        from: `"InvoiceFlow" <noreply@invoiceflow.app>`,
        to: recipient,
        subject: subject || `Invoice ${invoice.invoiceNumber} from ${invoice.senderName}`,
        html: `
          <div>
            <h2>Invoice ${invoice.invoiceNumber}</h2>
            <p>${message || `Please find your invoice from ${invoice.senderName} attached.`}</p>
            <p>You can view your invoice <a href="${shareableUrl}">here</a>.</p>
            <hr />
            <p>Total amount due: ${invoice.currency} ${invoice.total.toFixed(2)}</p>
            <p>Due date: ${invoice.dueDate}</p>
          </div>
        `,
      });

      // Track this share for analytics
      if (req.user && req.user.id) {
        try {
          await storage.trackShareAnalytics({
            invoiceId: id,
            userId: req.user.id,
            shareMethod: 'email',
            recipientEmail: recipient,
            referrer: null,
            userAgent: null,
            ipAddress: null,
            metadata: { subject, recipientEmail: recipient }
          });
        } catch (analyticsError) {
          // Don't let analytics tracking failure affect the response
          console.error('Error tracking email share:', analyticsError);
        }
      }

      res.json({ message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid email data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Schedule an invoice for future sending
  app.post("/api/invoices/:id/schedule", requireAuth, validateIdParam, validateBody(scheduleRequestSchema), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { scheduleDate } = req.body;

      const invoice = await storage.getInvoice(id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Schedule the invoice
      const scheduledInvoice = await storage.scheduleInvoice(id, new Date(scheduleDate));

      // Update status to scheduled
      const updatedInvoice = await storage.updateInvoiceStatus(id, 'scheduled');

      res.json({ 
        message: "Invoice scheduled successfully", 
        scheduledDate: scheduleDate,
        invoice: updatedInvoice
      });
    } catch (error) {
      console.error("Error scheduling invoice:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to schedule invoice" });
    }
  });


  // RECURRING INVOICE TEMPLATES ROUTES

  // Get all recurring templates
  app.get("/api/recurring-templates", requireAuth, validateQuery(paginationSchema), async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1; // Default to user 1 for demo
      const templates = await storage.getAllRecurringTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching recurring templates:", error);
      res.status(500).json({ message: "Failed to fetch recurring templates" });
    }
  });

  // Get a specific recurring template
  app.get("/api/recurring-templates/:id", requireAuth, validateIdParam, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getRecurringTemplate(id);

      if (!template) {
        return res.status(404).json({ message: "Recurring template not found" });
      }

      // Get line items for this template
      const lineItems = await storage.getTemplateLineItems(id);

      res.json({ ...template, items: lineItems });
    } catch (error) {
      console.error("Error fetching recurring template:", error);
      res.status(500).json({ message: "Failed to fetch recurring template" });
    }
  });

  // Create a new recurring template with line items
  app.post("/api/recurring-templates", requireAuth, validateBody(recurringTemplateWithItemsSchema), async (req: Request, res: Response) => {
    try {
      // Request body is already validated by middleware
      const templateData = req.body;

      // Create template with items
      const newTemplate = await storage.createRecurringTemplateWithItems(templateData);

      // Get line items for the response
      const lineItems = await storage.getTemplateLineItems(newTemplate.id);

      logInfo(`New recurring template created`, "TemplateController", { 
        templateId: newTemplate.id,
        userId: req.user?.id 
      });

      res.status(201).json({ ...newTemplate, items: lineItems });
    } catch (error) {
      console.error("Error creating recurring template:", error);
      logError("Failed to create recurring template", "TemplateController", { error });
      res.status(500).json({ message: "Failed to create recurring template" });
    }
  });

  // Update an existing recurring template
  app.patch("/api/recurring-templates/:id", requireAuth, validateIdParam, validateBody(extendedTemplateSchema.partial()), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;

      // Verify template exists
      const template = await storage.getRecurringTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Recurring template not found" });
      }
      
      // Verify template belongs to user
      if (req.user && template.userId !== req.user.id) {
        logWarning(`Unauthorized update attempt for template ${id}`, "TemplateController", {
          templateId: id,
          requestUserId: req.user.id,
          templateUserId: template.userId
        });
        return res.status(403).json({ message: "Not authorized to update this template" });
      }

      const updatedTemplate = await storage.updateRecurringTemplate(id, updateData);

      // Get line items for the response
      const lineItems = await storage.getTemplateLineItems(id);

      logInfo(`Template ${id} updated successfully`, "TemplateController", { 
        templateId: id,
        userId: req.user?.id 
      });

      res.json({ ...updatedTemplate, items: lineItems });
    } catch (error) {
      console.error("Error updating recurring template:", error);
      logError("Failed to update recurring template", "TemplateController", { error, templateId: req.params.id });
      res.status(500).json({ message: "Failed to update recurring template" });
    }
  });

  // Delete a recurring template
  app.delete("/api/recurring-templates/:id", requireAuth, validateIdParam, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verify template exists
      const template = await storage.getRecurringTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Recurring template not found" });
      }
      
      // Verify template belongs to user
      if (req.user && template.userId !== req.user.id) {
        logWarning(`Unauthorized delete attempt for template ${id}`, "TemplateController", {
          templateId: id,
          requestUserId: req.user.id,
          templateUserId: template.userId
        });
        return res.status(403).json({ message: "Not authorized to delete this template" });
      }
      
      const deleted = await storage.deleteRecurringTemplate(id);

      logInfo(`Template ${id} deleted successfully`, "TemplateController", { 
        templateId: id,
        userId: req.user?.id 
      });

      res.json({ message: "Recurring template deleted successfully" });
    } catch (error) {
      console.error("Error deleting recurring template:", error);
      logError("Failed to delete recurring template", "TemplateController", { error, templateId: req.params.id });
      res.status(500).json({ message: "Failed to delete recurring template" });
    }
  });

  // Toggle active state of a recurring template
  app.post("/api/recurring-templates/:id/toggle", requireAuth, validateIdParam, validateBody(toggleActiveSchema), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;

      const template = await storage.getRecurringTemplate(id);

      if (!template) {
        return res.status(404).json({ message: "Recurring template not found" });
      }

      const updatedTemplate = await storage.toggleRecurringTemplate(id, isActive);

      res.json({ 
        message: `Recurring template ${isActive ? 'activated' : 'deactivated'} successfully`, 
        template: updatedTemplate
      });
    } catch (error) {
      console.error("Error toggling recurring template:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid toggle data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to toggle recurring template" });
    }
  });

  // Generate an invoice from a recurring template
  app.post("/api/recurring-templates/:id/generate", requireAuth, validateIdParam, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      const template = await storage.getRecurringTemplate(id);

      if (!template) {
        return res.status(404).json({ message: "Recurring template not found" });
      }

      // Generate the invoice
      const generatedInvoice = await storage.generateInvoiceFromTemplate(id);

      if (!generatedInvoice) {
        return res.status(500).json({ message: "Failed to generate invoice from template" });
      }

      // Get line items for the response
      const lineItems = await storage.getLineItems(generatedInvoice.id);

      // Calculate next invoice date based on frequency
      const nextDate = calculateNextInvoiceDate(template.frequency, new Date());

      // Update the next invoice date for the template
      await storage.updateRecurringTemplateNextDate(id, nextDate);

      res.json({ 
        message: "Invoice generated successfully", 
        invoice: { ...generatedInvoice, items: lineItems },
        nextInvoiceDate: nextDate
      });
    } catch (error) {
      console.error("Error generating invoice from template:", error);
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  // Helper function to calculate the next invoice date based on frequency
  /**
 * Helper function to calculate the next invoice date based on frequency
 * @param {string} frequency - Frequency of the recurring invoice (e.g., 'daily', 'weekly')
 * @param {Date} currentDate - The current date
 * @returns {Date} The next date for invoice generation
 */
function calculateNextInvoiceDate(frequency: string, currentDate: Date): Date {
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
        nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
    }

    return nextDate;
  }


  // Process scheduled invoices
  app.post("/api/process/scheduled-invoices", requireAdmin, async (req: Request, res: Response) => {
    try {

      // Process scheduled invoices
      const result = await InvoiceProcessor.processScheduledInvoices();

      res.json({
        message: "Scheduled invoices processed",
        success: result.success,
        failed: result.failed
      });
    } catch (error) {
      console.error("Error processing scheduled invoices:", error);
      res.status(500).json({ message: "Failed to process scheduled invoices" });
    }
  });

  // Process recurring templates
  app.post("/api/process/recurring-templates", requireAdmin, async (req: Request, res: Response) => {
    try {

      // Process recurring templates
      const result = await InvoiceProcessor.processRecurringTemplates();

      res.json({
        message: "Recurring templates processed",
        success: result.success,
        failed: result.failed
      });
    } catch (error) {
      console.error("Error processing recurring templates:", error);
      res.status(500).json({ message: "Failed to process recurring templates" });
    }
  });

  // Process both scheduled invoices and recurring templates
  app.post("/api/process/all", requireAdmin, async (req: Request, res: Response) => {
    try {

      // Process scheduled invoices
      const scheduledResult = await InvoiceProcessor.processScheduledInvoices();

      // Process recurring templates
      const recurringResult = await InvoiceProcessor.processRecurringTemplates();

      res.json({
        message: "All processing complete",
        scheduled: {
          success: scheduledResult.success,
          failed: scheduledResult.failed
        },
        recurring: {
          success: recurringResult.success,
          failed: recurringResult.failed
        }
      });
    } catch (error) {
      console.error("Error processing invoices:", error);
      res.status(500).json({ message: "Failed to process invoices" });
    }
  });

  // ADMIN & MONITORING ENDPOINTS
  // These endpoints are protected with the requireAdmin middleware

  // Get application error logs
  app.get("/api/admin/logs", requireAdmin, (req: Request, res: Response) => {
    try {
      const count = req.query.count ? parseInt(req.query.count as string) : 20;
      const level = req.query.level as LogLevel | undefined;

      const logs = ErrorLogger.getRecentLogs(count, level);

      logInfo(`Admin retrieved ${logs.length} error logs`, 'AdminApi', {
        count: logs.length,
        level: level || 'all'
      });

      res.json({
        count: logs.length,
        logs
      });
    } catch (error) {
      logError(`Error fetching error logs`, 'AdminApi', { error });
      res.status(500).json({ message: "Failed to retrieve error logs" });
    }
  });

  // Database health check
  app.get("/api/admin/db-health", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Start time for measuring response time
      const startTime = Date.now();

      // Test database access with a simple query
      const testUser = await storage.getUserByUsername('admin');
      const testInvoice = await storage.getAllInvoices(undefined);

      const responseTime = Date.now() - startTime;

      // Check tables and counts
      const stats = {
        users: testUser ? 'OK' : 'N/A',
        invoices: testInvoice.length,
        responseTimeMs: responseTime,
        status: 'healthy'
      };

      logInfo(`Database health check success`, 'AdminApi', {
        responseTime,
        invoiceCount: testInvoice.length
      });

      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        dbHealth: stats
      });
    } catch (error) {
      logError(`Database health check failed`, 'AdminApi', { error });

      res.status(500).json({
        status: "ERROR",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown database error',
        details: error
      });
    }
  });

  // System information endpoint
  app.get("/api/admin/system", requireAdmin, (req: Request, res: Response) => {
    try {
      // Collect system information
      const systemInfo = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        },
        uptime: process.uptime()
      };

      logInfo(`System information retrieved`, 'AdminApi', {
        memory: systemInfo.memory,
        uptime: systemInfo.uptime
      });

      res.json(systemInfo);
    } catch (error) {
      logError(`Error fetching system information`, 'AdminApi', { error });

      res.status(500).json({
        status: "ERROR",
        error: error instanceof Error ? error.message : 'Unknown system error'
      });
    }
  });


  // PREMIUM FEATURES ENDPOINTS

  // Watch an ad to get premium access
  app.post("/api/premium/watch-ad", requireAuth, validateBody(adViewSchema), async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Capture ad view details from the request
      const { watchedSeconds, adId, campaign, platform, completionRate } = req.body;
      
      // Default is 1 day of premium access, could be adjusted based on completion rate
      const daysAwarded = completionRate && completionRate >= 90 ? 2 : 1;

      // Record the ad view and update user's premium days
      const updatedUser = await storage.recordAdView(userId, daysAwarded);

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to record ad view" });
      }

      // Log successful ad view
      logInfo(`User ${userId} received ${daysAwarded} premium days for watching an ad`, 'PremiumAPI', {
        userId,
        daysAwarded,
        premiumDaysRemaining: updatedUser.premiumDaysRemaining
      });

      res.json({
        success: true,
        premiumDaysRemaining: updatedUser.premiumDaysRemaining,
        message: `You've earned ${daysAwarded} day${daysAwarded !== 1 ? 's' : ''} of premium access!`
      });
    } catch (error) {
      logError(`Error processing ad view for premium access`, 'PremiumAPI', { error });
      res.status(500).json({ message: "Failed to process ad view" });
    }
  });


  // ANALYTICS ENDPOINTS

  // Get share analytics for a specific invoice
  app.get("/api/analytics/shares/:invoiceId", requireAuth, validateIdParam, validateQuery(analyticsQuerySchema), async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);

      // Verify the invoice exists and belongs to the user
      const invoice = await storage.getInvoice(invoiceId);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Check if the user has permission to view this invoice's analytics
      if (req.user && req.user.id !== invoice.userId) {
        logWarning(`Unauthorized analytics access attempt for invoice ${invoiceId}`, "AnalyticsController", {
          invoiceId,
          requestUserId: req.user.id,
          invoiceUserId: invoice.userId
        });
        return res.status(403).json({ message: "Not authorized to view this invoice's analytics" });
      }

      // Get share analytics data
      const analytics = await storage.getShareAnalytics(invoiceId);
      
      logInfo(`Share analytics retrieved for invoice ${invoiceId}`, "AnalyticsController", { 
        invoiceId, 
        userId: req.user?.id,
        shareCount: analytics.length
      });

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching share analytics:", error);
      logError("Failed to fetch share analytics", "AnalyticsController", { error, invoiceId: req.params.invoiceId });
      res.status(500).json({ message: "Failed to fetch share analytics" });
    }
  });

  // Get share analytics summary by method for the current user
  app.get("/api/analytics/by-method", requireAuth, (req, res, next) => {
    // Apply the analytics query schema validation
    validateQuery(analyticsQuerySchema)(req, res, next);
  }, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Pass query parameters as options object
      const { startDate, endDate, groupBy } = req.query;
      
      // Create options object for analytics query
      const options = {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
        ...(groupBy && { groupBy: groupBy as string })
      };
      
      const analytics = await storage.getShareAnalyticsByMethod(req.user.id, options);

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching share analytics by method:", error);
      res.status(500).json({ message: "Failed to fetch share analytics" });
    }
  });

  // Get invoice view count analytics for the current user
  app.get("/api/analytics/views", requireAuth, (req, res, next) => {
    // Apply the analytics query schema validation
    validateQuery(analyticsQuerySchema)(req, res, next);
  }, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Pass query parameters as options object
      const { startDate, endDate, groupBy } = req.query;
      
      // Create options object for analytics query
      const options = {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
        ...(groupBy && { groupBy: groupBy as string })
      };
      
      const analytics = await storage.getShareViewAnalytics(req.user.id, options);

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching view analytics:", error);
      res.status(500).json({ message: "Failed to fetch view analytics" });
    }
  });

  // Track a share event (called from the client)
  // Analytics routes moved to dedicated file (./routes/analytics-routes.ts)
  
  // Analytics routes moved to dedicated file (./routes/analytics-routes.ts)

  // Test public endpoint for database and analytics tables
  app.get("/api/test/database-status", async (req: Request, res: Response) => {
    try {
      // Test database connection
      const dbStatus = {
        connected: true,
        tables: {
          users: false,
          invoices: false,
          share_analytics: false,
          subscription_plans: false,
          subscription_transactions: false,
          ad_rewards: false,
          coupons: false
        },
        counts: {},
        schemas: []
      };

      try {
        // Check if the database connection works by querying for tables
        const tableQuery = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `;
        
        const result = await pool.query(tableQuery);
        const tables = result.rows.map(row => row.table_name);
        dbStatus.schemas = tables;
        
        // Mark tables as found
        if (tables.includes('users')) {
          dbStatus.tables.users = true;
          const countResult = await pool.query('SELECT COUNT(*) as count FROM users');
          dbStatus.counts['users'] = parseInt(countResult.rows[0].count);
        }
        
        if (tables.includes('invoices')) {
          dbStatus.tables.invoices = true;
          const countResult = await pool.query('SELECT COUNT(*) as count FROM invoices');
          dbStatus.counts['invoices'] = parseInt(countResult.rows[0].count);
        }
        
        if (tables.includes('share_analytics')) {
          dbStatus.tables.share_analytics = true;
          const countResult = await pool.query('SELECT COUNT(*) as count FROM share_analytics');
          dbStatus.counts['share_analytics'] = parseInt(countResult.rows[0].count);
        }
        
        if (tables.includes('subscription_plans')) {
          dbStatus.tables.subscription_plans = true;
          const countResult = await pool.query('SELECT COUNT(*) as count FROM subscription_plans');
          dbStatus.counts['subscription_plans'] = parseInt(countResult.rows[0].count);
        }
        
        if (tables.includes('subscription_transactions')) {
          dbStatus.tables.subscription_transactions = true;
          const countResult = await pool.query('SELECT COUNT(*) as count FROM subscription_transactions');
          dbStatus.counts['subscription_transactions'] = parseInt(countResult.rows[0].count);
        }
        
        if (tables.includes('ad_rewards')) {
          dbStatus.tables.ad_rewards = true;
          const countResult = await pool.query('SELECT COUNT(*) as count FROM ad_rewards');
          dbStatus.counts['ad_rewards'] = parseInt(countResult.rows[0].count);
        }
        
        if (tables.includes('coupons')) {
          dbStatus.tables.coupons = true;
          const countResult = await pool.query('SELECT COUNT(*) as count FROM coupons');
          dbStatus.counts['coupons'] = parseInt(countResult.rows[0].count);
        }
      } catch (error) {
        console.error("Error checking database tables:", error);
      }

      res.json({
        success: true,
        message: 'Database status check',
        time: new Date().toISOString(),
        status: dbStatus
      });
    } catch (error) {
      console.error("Error checking database status:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error checking database status",
        error: error.message instanceof Error ? error.message : String(error)
      });
    }
  });

  return httpServer;
}