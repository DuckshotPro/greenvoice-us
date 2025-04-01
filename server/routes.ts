import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { invoiceWithItemsSchema, insertInvoiceSchema } from "@shared/schema";
import { createWriteStream, promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { ZodError } from "zod";
import nodemailer from "nodemailer";

// Mock transporter for email functionality
const transporter = {
  sendMail: async (options: any) => {
    console.log("Email sent with options:", options);
    return { messageId: `mock-${nanoid(8)}` };
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up server
  const httpServer = createServer(app);

  // Get all invoices
  app.get("/api/invoices", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const invoices = await storage.getAllInvoices(userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get a specific invoice
  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
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
      
      res.json({ ...invoice, items: lineItems });
    } catch (error) {
      console.error("Error fetching shared invoice:", error);
      res.status(500).json({ message: "Failed to fetch shared invoice" });
    }
  });

  // Create a new invoice with line items
  app.post("/api/invoices", async (req: Request, res: Response) => {
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
  app.patch("/api/invoices/:id", async (req: Request, res: Response) => {
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
  app.delete("/api/invoices/:id", async (req: Request, res: Response) => {
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
  app.post("/api/invoices/:id/email", async (req: Request, res: Response) => {
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
      
      res.json({ message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid email data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  return httpServer;
}
