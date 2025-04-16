import { z } from 'zod';

/**
 * Schema for validating share tracking request
 */
export const trackShareSchema = z.object({
  invoiceId: z.number().positive({ message: 'Invoice ID must be a positive number' }),
  shareMethod: z.string().min(1, { message: 'Share method is required' }),
  recipientEmail: z.string().email({ message: 'Valid email is required' }).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable()
});

/**
 * Schema for validating analytics query parameters
 */
export const analyticsQuerySchema = z.object({
  startDate: z.string()
    .optional()
    .refine(val => !val || !isNaN(Date.parse(val)), {
      message: 'startDate must be a valid date'
    }),
  endDate: z.string()
    .optional()
    .refine(val => !val || !isNaN(Date.parse(val)), {
      message: 'endDate must be a valid date'
    }),
  groupBy: z.enum(['day', 'week', 'month', 'method', 'none']).optional()
});