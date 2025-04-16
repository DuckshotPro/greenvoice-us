import { Router, Request, Response } from "express";
import { db } from "../db";
import { and, eq, desc, sql, gte, count } from "drizzle-orm";
import { shareAnalytics, utmTracking } from "@shared/schema";
import { z } from "zod";
import { validateBody, validateQuery } from "../middleware/validation";
import { requireAuth } from "../middleware/auth";
import { logger } from "../utils/logger";

// Create router for analytics endpoints
const router = Router();

// Schema for recording a view
const recordViewSchema = z.object({
  invoiceId: z.number(),
  shareMethod: z.string(),
  metadata: z.record(z.any()).optional(),
});

// Schema for tracking UTM parameters
const trackUtmSchema = z.object({
  invoiceId: z.number(),
  utmSource: z.string().nullable(),
  utmMedium: z.string().nullable(),
  utmCampaign: z.string().nullable(),
  utmContent: z.string().nullable().optional(),
  utmTerm: z.string().nullable().optional(),
});

// Schema for tracking shares
const trackShareSchema = z.object({
  invoiceId: z.number(),
  shareMethod: z.string(),
  recipientEmail: z.string().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

// Schema for analytics query parameters
const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(["method", "day", "week", "month"]).optional().default("method"),
});

/**
 * Record a view of a shared invoice
 * POST /api/analytics/record-view
 */
router.post("/record-view", validateBody(recordViewSchema), async (req: Request, res: Response) => {
  try {
    const { invoiceId, shareMethod, metadata } = req.body;

    // Get the user ID if authenticated, otherwise null for public views
    const userId = req.isAuthenticated() ? req.user.id : null;

    // Record the view
    const [result] = await db
      .insert(shareAnalytics)
      .values({
        invoiceId,
        userId,
        shareMethod,
        eventType: "view",
        metadata: metadata || {},
        timestamp: new Date(),
      })
      .returning();

    logger.info("Analytics: Invoice view recorded", {
      invoiceId,
      shareMethod,
      userId,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error("Error recording view", { error });
    return res.status(500).json({ error: "Failed to record view" });
  }
});

/**
 * Track UTM parameters for marketing campaigns
 * POST /api/analytics/track-utm
 */
router.post("/track-utm", validateBody(trackUtmSchema), async (req: Request, res: Response) => {
  try {
    const { invoiceId, utmSource, utmMedium, utmCampaign, utmContent, utmTerm } = req.body;

    // Record UTM parameters
    const [result] = await db
      .insert(utmTracking)
      .values({
        invoiceId,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        timestamp: new Date(),
      })
      .returning();

    logger.info("Analytics: UTM parameters recorded", {
      invoiceId,
      utmSource,
      utmMedium,
      utmCampaign,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error("Error tracking UTM parameters", { error });
    return res.status(500).json({ error: "Failed to track UTM parameters" });
  }
});

/**
 * Track when an invoice is shared
 * POST /api/analytics/track-share
 */
router.post("/track-share", requireAuth, validateBody(trackShareSchema), async (req: Request, res: Response) => {
  try {
    const { invoiceId, shareMethod, recipientEmail, metadata } = req.body;

    // Record the share event
    const [result] = await db
      .insert(shareAnalytics)
      .values({
        invoiceId,
        userId: req.user.id,
        shareMethod,
        eventType: "share",
        metadata: {
          ...metadata,
          recipientEmail: recipientEmail || null,
        },
        timestamp: new Date(),
      })
      .returning();

    logger.info("Analytics: Invoice share recorded", {
      invoiceId,
      shareMethod,
      userId: req.user.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error("Error tracking share", { error });
    return res.status(500).json({ error: "Failed to track share" });
  }
});

/**
 * Get analytics for share methods
 * GET /api/analytics/share-methods
 */
router.get(
  "/share-methods",
  requireAuth,
  validateQuery(analyticsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, groupBy } = req.query as z.infer<typeof analyticsQuerySchema>;
      
      let query = db
        .select({
          method: shareAnalytics.shareMethod,
          count: count().as("count"),
        })
        .from(shareAnalytics)
        .where(
          and(
            eq(shareAnalytics.eventType, "share"),
            req.user.isAdmin ? undefined : eq(shareAnalytics.userId, req.user.id),
            startDate ? gte(shareAnalytics.timestamp, new Date(startDate)) : undefined,
            endDate ? sql`${shareAnalytics.timestamp} <= ${new Date(endDate)}` : undefined
          )
        );

      // Handle different grouping options
      if (groupBy === "method") {
        query = query.groupBy(shareAnalytics.shareMethod);
      } else if (groupBy === "day") {
        query = query
          .groupBy(sql`DATE(${shareAnalytics.timestamp})`, shareAnalytics.shareMethod)
          .orderBy(desc(sql`DATE(${shareAnalytics.timestamp})`));
      } else if (groupBy === "week") {
        query = query
          .groupBy(sql`EXTRACT(WEEK FROM ${shareAnalytics.timestamp})`, shareAnalytics.shareMethod)
          .orderBy(desc(sql`EXTRACT(WEEK FROM ${shareAnalytics.timestamp})`));
      } else if (groupBy === "month") {
        query = query
          .groupBy(sql`EXTRACT(MONTH FROM ${shareAnalytics.timestamp})`, shareAnalytics.shareMethod)
          .orderBy(desc(sql`EXTRACT(MONTH FROM ${shareAnalytics.timestamp})`));
      }

      const result = await query;

      return res.status(200).json(result);
    } catch (error) {
      logger.error("Error fetching share methods analytics", { error });
      return res.status(500).json({ error: "Failed to fetch share methods analytics" });
    }
  }
);

/**
 * Get analytics for invoice views
 * GET /api/analytics/share-views
 */
router.get(
  "/share-views",
  requireAuth,
  validateQuery(analyticsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, groupBy } = req.query as z.infer<typeof analyticsQuerySchema>;
      
      let query = db
        .select({
          invoiceId: shareAnalytics.invoiceId,
          views: count().as("views"),
        })
        .from(shareAnalytics)
        .where(
          and(
            eq(shareAnalytics.eventType, "view"),
            req.user.isAdmin ? undefined : eq(shareAnalytics.userId, req.user.id),
            startDate ? gte(shareAnalytics.timestamp, new Date(startDate)) : undefined,
            endDate ? sql`${shareAnalytics.timestamp} <= ${new Date(endDate)}` : undefined
          )
        );

      // Handle different grouping options
      if (groupBy === "method") {
        query = query.groupBy(shareAnalytics.invoiceId);
      } else if (groupBy === "day") {
        query = query
          .groupBy(sql`DATE(${shareAnalytics.timestamp})`, shareAnalytics.invoiceId)
          .orderBy(desc(sql`DATE(${shareAnalytics.timestamp})`));
      } else if (groupBy === "week") {
        query = query
          .groupBy(sql`EXTRACT(WEEK FROM ${shareAnalytics.timestamp})`, shareAnalytics.invoiceId)
          .orderBy(desc(sql`EXTRACT(WEEK FROM ${shareAnalytics.timestamp})`));
      } else if (groupBy === "month") {
        query = query
          .groupBy(sql`EXTRACT(MONTH FROM ${shareAnalytics.timestamp})`, shareAnalytics.invoiceId)
          .orderBy(desc(sql`EXTRACT(MONTH FROM ${shareAnalytics.timestamp})`));
      }

      const result = await query;

      return res.status(200).json(result);
    } catch (error) {
      logger.error("Error fetching share views analytics", { error });
      return res.status(500).json({ error: "Failed to fetch share views analytics" });
    }
  }
);

/**
 * Get analytics for a specific invoice
 * GET /api/analytics/shares/:invoiceId
 */
router.get(
  "/shares/:invoiceId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.params;
      
      // Get shares by method
      const sharesByMethod = await db
        .select({
          method: shareAnalytics.shareMethod,
          count: count().as("count"),
        })
        .from(shareAnalytics)
        .where(
          and(
            eq(shareAnalytics.invoiceId, parseInt(invoiceId)),
            eq(shareAnalytics.eventType, "share"),
            req.user.isAdmin ? undefined : eq(shareAnalytics.userId, req.user.id)
          )
        )
        .groupBy(shareAnalytics.shareMethod);
      
      // Get view count
      const [viewCount] = await db
        .select({
          count: count().as("count"),
        })
        .from(shareAnalytics)
        .where(
          and(
            eq(shareAnalytics.invoiceId, parseInt(invoiceId)),
            eq(shareAnalytics.eventType, "view")
          )
        );
      
      // Get UTM sources
      const utmSources = await db
        .select({
          source: utmTracking.utmSource,
          count: count().as("count"),
        })
        .from(utmTracking)
        .where(eq(utmTracking.invoiceId, parseInt(invoiceId)))
        .groupBy(utmTracking.utmSource);
      
      return res.status(200).json({
        shares: sharesByMethod,
        views: viewCount?.count || 0,
        utmSources,
      });
    } catch (error) {
      logger.error("Error fetching invoice share analytics", { error, invoiceId: req.params.invoiceId });
      return res.status(500).json({ error: "Failed to fetch invoice share analytics" });
    }
  }
);

export const analyticsRoutes = router;