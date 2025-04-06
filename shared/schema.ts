import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums for recurring invoice frequency and status
export const recurringFrequencyEnum = pgEnum('recurring_frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'scheduled', 'sent', 'paid', 'void', 'overdue']);

// Business owner/sender
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Line item in an invoice
export const lineItems = pgTable("line_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  rate: doublePrecision("rate").notNull(),
  amount: doublePrecision("amount").notNull(),
});

export const insertLineItemSchema = createInsertSchema(lineItems).omit({
  id: true,
});

// Invoice
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date").notNull(),
  currency: text("currency").notNull().default("USD"),
  
  // Sender details
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderAddress: text("sender_address").notNull(),
  senderPhone: text("sender_phone").notNull(),
  
  // Client details
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientAddress: text("client_address").notNull(),
  
  // Financial details
  subtotal: doublePrecision("subtotal").notNull(),
  taxRate: doublePrecision("tax_rate").notNull().default(0),
  taxAmount: doublePrecision("tax_amount").notNull().default(0),
  total: doublePrecision("total").notNull(),
  
  // Additional info
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Invoice status
  status: invoiceStatusEnum("status").default("draft"),
  
  // Scheduled sending info
  scheduledSendDate: timestamp("scheduled_send_date"),
  sentAt: timestamp("sent_at"),
  
  // Recurring template reference (if this is an invoice generated from a recurring template)
  recurringTemplateId: integer("recurring_template_id"),

  // Payment info
  paidAt: timestamp("paid_at"),
  paymentMethod: text("payment_method"),
  
  // Sharing info
  shareableLink: text("shareable_link"),
});

// Recurring Invoice Templates
export const recurringTemplates = pgTable("recurring_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  
  // Base invoice data (template)
  invoicePrefix: text("invoice_prefix").notNull(), // For generating invoice numbers
  currency: text("currency").notNull().default("USD"),
  
  // Sender details
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderAddress: text("sender_address").notNull(),
  senderPhone: text("sender_phone").notNull(),
  
  // Client details
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientAddress: text("client_address").notNull(),
  
  // Financial template
  taxRate: doublePrecision("tax_rate").notNull().default(0),
  notes: text("notes"),
  
  // Recurring settings
  frequency: recurringFrequencyEnum("frequency").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"), // Optional end date
  nextInvoiceDate: timestamp("next_invoice_date").notNull(),
  dayOfMonth: integer("day_of_month"), // For monthly/quarterly/yearly
  dayOfWeek: integer("day_of_week"), // For weekly (0 = Sunday, 6 = Saturday)
  
  // Status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastGeneratedAt: timestamp("last_generated_at"),
});

// Template Line Items - reusable items for recurring invoices
export const templateLineItems = pgTable("template_line_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  rate: doublePrecision("rate").notNull(),
  amount: doublePrecision("amount").notNull(),
});

// Scheduled Invoices Queue - for processing scheduled invoices
export const scheduledInvoices = pgTable("scheduled_invoices", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(), // Reference to the actual invoice
  sendDate: timestamp("send_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, sent, failed
  retryCount: integer("retry_count").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  shareableLink: true,
  status: true,
  scheduledSendDate: true,
  sentAt: true,
  recurringTemplateId: true,
  paidAt: true,
  paymentMethod: true,
});

export const insertTemplateLineItemSchema = createInsertSchema(templateLineItems).omit({
  id: true,
});

export const insertRecurringTemplateSchema = createInsertSchema(recurringTemplates).omit({
  id: true,
  createdAt: true,
  lastGeneratedAt: true,
  isActive: true,
});

export const insertScheduledInvoiceSchema = createInsertSchema(scheduledInvoices).omit({
  id: true,
  createdAt: true,
  status: true,
  retryCount: true,
  errorMessage: true,
  processedAt: true,
});

// Basic types based on the schema
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type LineItem = typeof lineItems.$inferSelect;

export type InsertTemplateLineItem = z.infer<typeof insertTemplateLineItemSchema>;
export type TemplateLineItem = typeof templateLineItems.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertRecurringTemplate = z.infer<typeof insertRecurringTemplateSchema>;
export type RecurringTemplate = typeof recurringTemplates.$inferSelect;

export type InsertScheduledInvoice = z.infer<typeof insertScheduledInvoiceSchema>;
export type ScheduledInvoice = typeof scheduledInvoices.$inferSelect;

// Extended types for front-end use
export const invoiceWithItemsSchema = insertInvoiceSchema.extend({
  items: z.array(insertLineItemSchema.omit({ invoiceId: true })),
  // Allow scheduling an invoice when creating it
  scheduledSendDate: z.string().optional(),
});

export const recurringTemplateWithItemsSchema = insertRecurringTemplateSchema.extend({
  items: z.array(insertTemplateLineItemSchema.omit({ templateId: true })),
});

export type InvoiceWithItems = z.infer<typeof invoiceWithItemsSchema>;
export type RecurringTemplateWithItems = z.infer<typeof recurringTemplateWithItemsSchema>;
