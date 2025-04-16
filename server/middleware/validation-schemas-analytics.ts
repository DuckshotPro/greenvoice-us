import { z } from "zod";

/**
 * Schema for validating share tracking request
 */
export const trackShareSchema = z.object({
  invoiceId: z.number(),
  shareMethod: z.string(),
  recipientEmail: z.string().email().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable()
});

/**
 * Schema for validating share view recording
 */
export const recordViewSchema = z.object({
  invoiceId: z.number(),
  shareMethod: z.string()
});

/**
 * Schema for validating UTM parameter tracking
 */
export const trackUtmSchema = z.object({
  invoiceId: z.number(),
  shareMethod: z.string(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional()
});

/**
 * Schema for validating analytics query parameters
 */
export const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['none', 'day', 'week', 'month', 'method']).optional().default('none')
});