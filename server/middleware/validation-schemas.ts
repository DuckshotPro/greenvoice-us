import { z } from "zod";

/**
 * Schema for validating ID parameters
 */
export const idParamSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
});

/**
 * Schema for validating status parameters
 */
export const statusParamSchema = z.object({
  status: z.enum(["draft", "scheduled", "sent", "paid", "void", "overdue"])
});

/**
 * Schema for pagination query parameters
 */
export const paginationSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).optional().default("1"),
  limit: z.string().transform((val) => parseInt(val, 10)).optional().default("10"),
  userId: z.string().transform((val) => parseInt(val, 10)).optional(),
  status: z.enum(["draft", "scheduled", "sent", "paid", "void", "overdue"]).optional(),
  sort: z.enum(["created", "updated", "dueDate", "total"]).optional(),
  order: z.enum(["asc", "desc"]).optional().default("desc")
});

/**
 * Schema for email request
 */
export const emailRequestSchema = z.object({
  recipientEmail: z.string().email(),
  message: z.string().optional(),
  subject: z.string().optional()
});

/**
 * Schema for schedule request
 */
export const scheduleRequestSchema = z.object({
  sendDate: z.string().transform((val) => new Date(val)),
  emailRecipients: z.array(z.string().email()).optional(),
  emailSubject: z.string().optional(),
  emailMessage: z.string().optional()
});

/**
 * Schema for toggling active status of recurring templates
 */
export const toggleActiveSchema = z.object({
  active: z.boolean()
});

/**
 * Schema for extended invoice fields for updates
 */
export const extendedInvoiceSchema = z.object({
  status: z.enum(["draft", "scheduled", "sent", "paid", "void", "overdue"]).nullable(),
  notes: z.string().optional(),
  paid: z.boolean().optional(),
  paymentDate: z.string().transform((val) => new Date(val)).optional().nullable()
});

/**
 * Schema for extended template fields for updates
 */
export const extendedTemplateSchema = z.object({
  active: z.boolean().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).optional(),
  nextGenerationDate: z.string().transform((val) => new Date(val)).optional()
});

/**
 * Schema for ad view request
 */
export const adViewSchema = z.object({
  adId: z.string(),
  duration: z.number().min(15).max(120), // Duration in seconds
  completionRate: z.number().min(0).max(100) // Percentage of ad watched
});

/**
 * Middleware to validate ID parameter
 */
import { validateParams } from "./validation";
export const validateIdParam = validateParams(idParamSchema);