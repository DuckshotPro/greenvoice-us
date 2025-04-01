import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  
  // Sharing info
  shareableLink: text("shareable_link"),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  shareableLink: true,
});

// Types based on the schema
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type LineItem = typeof lineItems.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Extended types for front-end use
export const invoiceWithItemsSchema = insertInvoiceSchema.extend({
  items: z.array(insertLineItemSchema.omit({ invoiceId: true })),
});

export type InvoiceWithItems = z.infer<typeof invoiceWithItemsSchema>;
