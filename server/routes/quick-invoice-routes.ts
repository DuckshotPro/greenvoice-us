import { Router, Request, Response } from "express";
import { z } from "zod";
import { invoices, lineItems } from "@shared/schema";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { format } from "date-fns";
import { storage } from "../models/storage";

// Validation schema for quick invoices
const quickInvoiceSchema = z.object({
  clientEmail: z.string().email(),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().positive(),
      rate: z.number().min(0),
      amount: z.number().min(0),
    })
  ),
  currency: z.string().default("USD"),
  total: z.number().min(0),
  status: z.string().default("sent"),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
});

export const quickInvoiceRoutes = Router();

// Create and send a quick invoice
quickInvoiceRoutes.post(
  "/quick",
  validateBody(quickInvoiceSchema),
  async (req: Request, res: Response) => {
    try {
      const invoiceData = req.body;
      const isAuthenticated = req.isAuthenticated();
      const userId = isAuthenticated ? req.user?.id : null;

      // Generate the invoice number (simple implementation)
      const invoiceNumber = `INV-${format(new Date(), "yyyyMMdd")}-${uuidv4().slice(0, 4)}`;

      // Create invoice in database if the user is authenticated
      let createdInvoice = null;
      if (userId) {
        // Create an invoice object for the storage service
        const invoiceWithItems = {
          userId,
          clientName: "Quick Invoice Client", // Placeholder
          clientEmail: invoiceData.clientEmail,
          invoiceNumber,
          issueDate: new Date(invoiceData.issueDate),
          dueDate: new Date(invoiceData.dueDate),
          status: invoiceData.status,
          currency: invoiceData.currency,
          total: invoiceData.total,
          subtotal: invoiceData.total, // Same as total for quick invoices
          notes: "Created via Quick Invoice",
          items: invoiceData.items.map((item: { description: string; quantity: number; rate: number; amount: number }) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          })),
          senderName: "GreenVoice",
          senderEmail: "noreply@greenvoice.us",
          senderAddress: "123 Invoice St",
          senderPhone: "555-123-4567",
          clientAddress: "",
          clientPhone: "",
          discount: 0,
          tax: 0,
          taxRate: 0,
          shareableLink: uuidv4().substring(0, 8)
        };

        // Use the storage service to create the invoice with items
        createdInvoice = await storage.createInvoiceWithItems(invoiceWithItems);
      }

      // Send the invoice email
      // This is a simplified example - in production, use a structured template
      try {
        // Create a test account only in development
        let transporter;
        let emailConfig;

        if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          // Use configured SMTP server
          transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
              user: process.env.EMAIL_USER, 
              pass: process.env.EMAIL_PASS,
            },
          });
          emailConfig = {
            from: process.env.EMAIL_USER,
          };
        } else {
          // Use Ethereal for testing
          const testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          emailConfig = {
            from: testAccount.user,
          };
        }

        // Format the items into HTML
        const itemsHtml = invoiceData.items
          .map(
            (item: { description: string; quantity: number; rate: number; amount: number }) => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${
                item.quantity
              }</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${
                invoiceData.currency
              } ${item.rate.toFixed(2)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${
                invoiceData.currency
              } ${item.amount.toFixed(2)}</td>
            </tr>
          `
          )
          .join("");

        // Send mail with defined transport object
        const info = await transporter.sendMail({
          ...emailConfig,
          to: invoiceData.clientEmail,
          subject: `Invoice #${invoiceNumber} from GreenVoice`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #009888; margin: 0;">GreenVoice</h1>
                <p style="color: #666; margin: 5px 0 0;">Invoice Simplified</p>
              </div>
              
              <div style="margin-bottom: 20px;">
                <h2 style="color: #333; border-bottom: 2px solid #009888; padding-bottom: 10px;">INVOICE #${invoiceNumber}</h2>
                <p><strong>Date:</strong> ${format(new Date(invoiceData.issueDate), "MMMM d, yyyy")}</p>
                <p><strong>Due Date:</strong> ${format(new Date(invoiceData.dueDate), "MMMM d, yyyy")}</p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f9f9f9;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Rate</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold;">${
                      invoiceData.currency
                    } ${invoiceData.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                <p>Thank you for your business!</p>
                <p>This invoice was created with GreenVoice - Invoice Simplified</p>
                <p style="margin-top: 20px;"><a href="https://greenvoice.us" style="color: #009888; text-decoration: none;">GreenVoice.us</a></p>
              </div>
            </div>
          `,
        });

        console.log("Message sent: %s", info.messageId);
        
        // Preview URL for Ethereal emails
        if (!process.env.EMAIL_SERVICE) {
          console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Continue with the response even if email sending fails
      }

      res.status(200).json({
        success: true,
        message: "Invoice created and sent successfully",
        invoice: createdInvoice,
      });
    } catch (error) {
      console.error("Error creating quick invoice:", error);
      res.status(500).json({
        error: "Failed to create and send invoice",
      });
    }
  }
);

// Get quick invoice history for a user
quickInvoiceRoutes.get(
  "/quick",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      // Get all quick invoices for the user
      // Using the storage service to handle this properly
      const userInvoices = await storage.getAllInvoices(userId);
      const userQuickInvoices = userInvoices
        .filter((inv): boolean => {
          return inv.notes === "Created via Quick Invoice";
        })
        .slice(0, 10); // Limit to most recent 10
      
      res.status(200).json(userQuickInvoices);
    } catch (error) {
      console.error("Error fetching quick invoices:", error);
      res.status(500).json({
        error: "Failed to fetch quick invoices",
      });
    }
  }
);