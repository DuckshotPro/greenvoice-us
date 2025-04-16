import { z } from 'zod';
import { 
  insertInvoiceSchema, 
  insertRecurringTemplateSchema, 
  insertLineItemSchema, 
  insertTemplateLineItemSchema 
} from '@shared/schema';

/**
 * Schema for validating ID parameters
 */
export const idParamSchema = z.object({
  id: z.string().refine((val) => {
    const id = parseInt(val);
    return !isNaN(id) && id > 0;
  }, { message: 'ID must be a positive number' })
});

/**
 * Schema for email request validation
 */
export const emailRequestSchema = z.object({
  recipient: z.string().email({ message: 'Valid email address is required' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  message: z.string().optional()
});

/**
 * Schema for invoice scheduling
 */
export const scheduleRequestSchema = z.object({
  scheduleDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  })
});

/**
 * Schema for validating pagination parameters
 */
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 20))
}).refine(data => !data.page || data.page > 0, {
  message: 'Page must be a positive number',
  path: ['page']
}).refine(data => !data.limit || (data.limit > 0 && data.limit <= 100), {
  message: 'Limit must be between 1 and 100',
  path: ['limit']
});

/**
 * Schema for validating toggle active state
 */
export const toggleActiveSchema = z.object({
  isActive: z.boolean()
});

/**
 * Schema for validating invoice status parameter
 */
export const statusParamSchema = z.object({
  status: z.enum(['draft', 'scheduled', 'sent', 'paid', 'void', 'overdue'], {
    errorMap: () => ({ message: 'Invalid status. Must be one of: draft, scheduled, sent, paid, void, overdue' })
  })
});

/**
 * Schema for discount validation
 */
export const discountSchema = z.object({
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  code: z.string().min(3).optional()
}).refine(data => {
  if (data.type === 'percentage') {
    return data.value <= 100;
  }
  return true;
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['value']
});

/**
 * Schema for validating ad view tracking
 */
export const adViewSchema = z.object({
  watchedSeconds: z.number().min(0).optional(),
  adId: z.string().optional(),
  campaign: z.string().optional(),
  platform: z.string().optional(),
  completionRate: z.number().min(0).max(100).optional()
});

/**
 * Extended schema for creating invoices with additional validation
 */
export const extendedInvoiceSchema = insertInvoiceSchema.extend({
  clientEmail: z.string().email({ message: 'Valid client email is required' }),
  invoiceNumber: z.string().min(3, { message: 'Invoice number must be at least 3 characters' }),
  senderName: z.string().min(1, { message: 'Sender name is required' }),
  total: z.number().nonnegative({ message: 'Total cannot be negative' })
});

/**
 * Extended schema for creating templates with additional validation
 */
export const extendedTemplateSchema = insertRecurringTemplateSchema.extend({
  name: z.string().min(3, { message: 'Template name must be at least 3 characters' }),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], {
    errorMap: () => ({ message: 'Invalid frequency. Must be one of: daily, weekly, monthly, quarterly, yearly' })
  }),
  nextInvoiceDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date format for next invoice date'
  })
});

/**
 * Line item schema with validation
 */
export const lineItemSchema = insertLineItemSchema.extend({
  description: z.string().min(1, { message: 'Description is required' }),
  quantity: z.number().positive({ message: 'Quantity must be positive' }),
  rate: z.number().nonnegative({ message: 'Rate cannot be negative' }),
  amount: z.number().nonnegative({ message: 'Amount cannot be negative' })
});

/**
 * Template line item schema with validation
 */
export const templateLineItemSchema = insertTemplateLineItemSchema.extend({
  description: z.string().min(1, { message: 'Description is required' }),
  quantity: z.number().positive({ message: 'Quantity must be positive' }),
  rate: z.number().nonnegative({ message: 'Rate cannot be negative' }),
  amount: z.number().nonnegative({ message: 'Amount cannot be negative' })
});

/**
 * Schema for invoice with line items
 */
export const invoiceWithItemsSchema = z.object({
  // Basic invoice details
  userId: z.number(),
  invoiceNumber: z.string().min(3, { message: 'Invoice number must be at least 3 characters' }),
  status: z.enum(['draft', 'scheduled', 'sent', 'paid', 'void', 'overdue']).optional(), 
  
  // Date fields
  issueDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid issue date format'
  }),
  dueDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid due date format'
  }),
  
  // Sender info
  senderName: z.string().min(1, { message: 'Sender name is required' }),
  senderEmail: z.string().email({ message: 'Valid sender email is required' }),
  senderAddress: z.string().optional(),
  senderPhone: z.string().optional(),
  
  // Client info
  clientName: z.string().min(1, { message: 'Client name is required' }),
  clientEmail: z.string().email({ message: 'Valid client email is required' }).optional(),
  clientAddress: z.string().optional(),
  
  // Financial details
  subtotal: z.number().nonnegative({ message: 'Subtotal cannot be negative' }),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number().nonnegative({ message: 'Tax amount cannot be negative' }),
  total: z.number().nonnegative({ message: 'Total cannot be negative' }),
  currency: z.string().min(1, { message: 'Currency is required' }),
  
  // Discount details
  discountType: z.enum(['none', 'percentage', 'fixed']).optional(),
  discountValue: z.number().optional(),
  discountCode: z.string().optional(),
  
  // Additional details
  notes: z.string().optional(),
  
  // Line items array
  items: z.array(lineItemSchema),
  
  // Optional scheduled date
  scheduledSendDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: 'scheduledSendDate must be a valid date if provided'
  })
});

/**
 * Schema for recurring template with line items
 */
export const recurringTemplateWithItemsSchema = z.object({
  // Basic template info
  userId: z.number(),
  name: z.string().min(3, { message: 'Template name must be at least 3 characters' }),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], {
    errorMap: () => ({ message: 'Invalid frequency. Must be one of: daily, weekly, monthly, quarterly, yearly' })
  }),
  
  // Date fields
  nextInvoiceDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date format for next invoice date'
  }),
  
  // Sender info
  senderName: z.string().min(1, { message: 'Sender name is required' }),
  senderEmail: z.string().email({ message: 'Valid sender email is required' }),
  senderAddress: z.string().optional(),
  senderPhone: z.string().optional(),
  
  // Client info
  clientName: z.string().min(1, { message: 'Client name is required' }),
  clientEmail: z.string().email({ message: 'Valid client email is required' }).optional(),
  clientAddress: z.string().optional(),
  
  // Financial details
  taxRate: z.number().min(0).max(100),
  currency: z.string().min(1, { message: 'Currency is required' }),
  
  // Additional details
  notes: z.string().optional(),
  invoicePrefix: z.string().min(1, { message: 'Invoice prefix is required' }),
  isActive: z.boolean().optional(),
  
  // Template line items array
  items: z.array(templateLineItemSchema)
});