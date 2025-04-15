import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "../models/storage";
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
import { InvoiceProcessor } from "../services/invoice-processor";
import { ErrorLogger, LogLevel, logError, logInfo, logWarning } from "../utils/error-logger";
import { log } from "../utils/vite";
import { setupAuth } from "../middleware/auth";

// Security middleware to verify admin access
/**
 * Security middleware to verify admin access
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // In a production app, this would check if the authenticated user has admin role
  // For this prototype, we'll use a simple API key approach
  const apiKey = req.headers['x-admin-api-key'];
  
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    logWarning(`Unauthorized access attempt to admin endpoint: ${req.path}`, 'SecurityMiddleware', {
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return res.status(403).json({ message: "Unauthorized access to admin endpoint" });
  }
  
  logInfo(`Admin access granted to endpoint: ${req.path}`, 'SecurityMiddleware', {
    path: req.path
  });
  
  next();
};

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
  
  // Set up authentication routes
  setupAuth(app);
  
  // Middleware to ensure user is authenticated
  /**
 * Middleware to ensure user is authenticated
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Get all invoices
  app.get("/api/invoices", requireAuth, async (req: Request, res: Response) => {
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
  app.get("/api/invoices/status/:status", requireAuth, async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Validate status
      if (!['draft', 'scheduled', 'sent', 'paid', 'void', 'overdue'].includes(status)) {
        return res.status(400).json({ message: "Invalid status parameter" });
      }
      
      const invoices = await storage.getInvoicesByStatus(status, userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices by status:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get a specific invoice
  app.get("/api/invoices/:id", requireAuth, async (req: Request, res: Response) => {
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
  app.post("/api/invoices", requireAuth, async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const invoiceData = invoiceWithItemsSchema.parse(req.body);
      
      // Create invoice with items
      const newInvoice = await storage.createInvoiceWithItems(invoiceData);
      
      // Get line items for the response
      const lineItems = await storage.getLineItems(newInvoice.id);
      
      res.status(201).json({ ...newInvoice, items: lineItems });
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Update an existing invoice
  app.patch("/api/invoices/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertInvoiceSchema.partial().parse(req.body);
      
      const updatedInvoice = await storage.updateInvoice(id, updateData);
      
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get line items for the response
      const lineItems = await storage.getLineItems(id);
      
      res.json({ ...updatedInvoice, items: lineItems });
    } catch (error) {
      console.error("Error updating invoice:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Delete an invoice
  app.delete("/api/invoices/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteInvoice(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Send invoice via email
  app.post("/api/invoices/:id/email", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { recipient, subject, message } = z.object({
        recipient: z.string().email(),
        subject: z.string(),
        message: z.string(),
      }).parse(req.body);
      
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
  app.post("/api/invoices/:id/schedule", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { scheduleDate } = z.object({
        scheduleDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format"
        })
      }).parse(req.body);
      
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
  app.get("/api/recurring-templates", requireAuth, async (req: Request, res: Response) => {
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
  app.get("/api/recurring-templates/:id", requireAuth, async (req: Request, res: Response) => {
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
  app.post("/api/recurring-templates", requireAuth, async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const templateData = recurringTemplateWithItemsSchema.parse(req.body);
      
      // Create template with items
      const newTemplate = await storage.createRecurringTemplateWithItems(templateData);
      
      // Get line items for the response
      const lineItems = await storage.getTemplateLineItems(newTemplate.id);
      
      res.status(201).json({ ...newTemplate, items: lineItems });
    } catch (error) {
      console.error("Error creating recurring template:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create recurring template" });
    }
  });
  
  // Update an existing recurring template
  app.patch("/api/recurring-templates/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertRecurringTemplateSchema.partial().parse(req.body);
      
      const updatedTemplate = await storage.updateRecurringTemplate(id, updateData);
      
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Recurring template not found" });
      }
      
      // Get line items for the response
      const lineItems = await storage.getTemplateLineItems(id);
      
      res.json({ ...updatedTemplate, items: lineItems });
    } catch (error) {
      console.error("Error updating recurring template:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update recurring template" });
    }
  });
  
  // Delete a recurring template
  app.delete("/api/recurring-templates/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRecurringTemplate(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Recurring template not found" });
      }
      
      res.json({ message: "Recurring template deleted successfully" });
    } catch (error) {
      console.error("Error deleting recurring template:", error);
      res.status(500).json({ message: "Failed to delete recurring template" });
    }
  });
  
  // Toggle active state of a recurring template
  app.post("/api/recurring-templates/:id/toggle", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = z.object({
        isActive: z.boolean()
      }).parse(req.body);
      
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
  app.post("/api/recurring-templates/:id/generate", requireAuth, async (req: Request, res: Response) => {
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
  app.post("/api/premium/watch-ad", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Default is 1 day of premium access
      const daysAwarded = 1;
      
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
  app.get("/api/analytics/shares/:invoiceId", requireAuth, async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      
      // Verify the invoice exists and belongs to the user
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Check if the user has permission to view this invoice's analytics
      if (req.user && req.user.id !== invoice.userId) {
        return res.status(403).json({ message: "Not authorized to view this invoice's analytics" });
      }
      
      // Get share analytics data
      const analytics = await storage.getShareAnalytics(invoiceId);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching share analytics:", error);
      res.status(500).json({ message: "Failed to fetch share analytics" });
    }
  });
  
  // Get share analytics summary by method for the current user
  app.get("/api/analytics/by-method", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const analytics = await storage.getShareAnalyticsByMethod(req.user.id);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching share analytics by method:", error);
      res.status(500).json({ message: "Failed to fetch share analytics" });
    }
  });
  
  // Get invoice view count analytics for the current user
  app.get("/api/analytics/views", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const analytics = await storage.getShareViewAnalytics(req.user.id);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching view analytics:", error);
      res.status(500).json({ message: "Failed to fetch view analytics" });
    }
  });
  
  // Track a share event (called from the client)
  app.post("/api/analytics/track-share", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { invoiceId, shareMethod, recipientEmail, metadata } = req.body;
      
      if (!invoiceId || !shareMethod) {
        return res.status(400).json({ message: "invoiceId and shareMethod are required" });
      }
      
      // Verify invoice belongs to user
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice || invoice.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to track shares for this invoice" });
      }
      
      // Track the share event
      const analytics = await storage.trackShareAnalytics({
        invoiceId,
        userId: req.user.id,
        shareMethod,
        recipientEmail: recipientEmail || null,
        referrer: req.headers.referer as string || null,
        userAgent: req.headers['user-agent'] as string || null,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        metadata: metadata || null
      });
      
      res.status(201).json({ message: "Share tracked successfully", shareId: analytics.id });
    } catch (error) {
      console.error("Error tracking share:", error);
      res.status(500).json({ message: "Failed to track share" });
    }
  });

  return httpServer;
}