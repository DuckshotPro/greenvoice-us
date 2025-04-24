import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { storage } from "../storage";
import { IStorage } from "../storage";
import { adViewSchema } from "../middleware/validation-schemas";
import { validateBody } from "../middleware/validation";
import { v4 as uuidv4 } from "uuid";

export const adRoutes = Router();

// Record an ad view
adRoutes.post(
  "/view",
  validateBody(adViewSchema),
  async (req: Request, res: Response) => {
    try {
      const { adType, userId, sourceAction } = req.body;
      
      // Generate a unique ID for this ad view
      const viewId = uuidv4();
      
      // If userId is provided, it means the user is logged in
      // We'll check if they have premium status
      if (userId) {
        const user = await storage.getUser(userId);
        if (user && user.subscriptionPlan !== "free") {
          // Premium users don't need to view ads
          return res.status(200).json({
            success: true,
            skipAd: true,
            isPremium: true,
            message: "User has premium status, ad view skipped",
            viewId,
          });
        }
      }
      
      // Log the ad view in our database
      const adView = {
        id: viewId,
        userId: userId || null,
        adType,
        sourceAction,
        viewedAt: new Date(),
        completed: false,
      };
      
      // Store the ad view in our database (assuming your storage has this method)
      if (userId && 'recordAdView' in storage) {
        await (storage as IStorage & { recordAdView: Function }).recordAdView(adView);
      }
      
      // Return the view ID so it can be referenced when the view is completed
      res.status(200).json({
        success: true,
        skipAd: false,
        isPremium: false,
        viewId,
        message: "Ad view recorded",
      });
    } catch (error) {
      console.error("Error recording ad view:", error);
      res.status(500).json({
        success: false,
        message: "Failed to record ad view",
      });
    }
  }
);

// Complete an ad view (called when ad finishes or is closed)
adRoutes.post(
  "/complete",
  async (req: Request, res: Response) => {
    try {
      const { viewId, userId, completed } = req.body;
      
      // Mark the ad view as completed
      if (userId && 'completeAdView' in storage) {
        await (storage as IStorage & { completeAdView: Function }).completeAdView(viewId, completed);
      }
      
      // If we have temporary premium features to enable, we would handle that here
      
      res.status(200).json({
        success: true,
        message: "Ad view completed",
      });
    } catch (error) {
      console.error("Error completing ad view:", error);
      res.status(500).json({
        success: false,
        message: "Failed to complete ad view",
      });
    }
  }
);

// Get ad unit settings (for Google Ad implementation)
adRoutes.get(
  "/settings",
  async (req: Request, res: Response) => {
    // This endpoint would provide ad configuration for different contexts
    // The frontend would use this to determine which ad units to show
    res.status(200).json({
      publisherId: process.env.GOOGLE_AD_PUBLISHER_ID || "ca-pub-xxxxxxxxxxxxxxxx",
      adUnits: {
        // These would be your configured Google Ad units
        quickInvoice: {
          adUnitId: "quick-invoice-ad-unit",
          format: "banner",
          responsive: true,
        },
        shareInvoice: {
          adUnitId: "share-invoice-ad-unit",
          format: "interstitial", 
          responsive: true,
        },
        exportInvoice: {
          adUnitId: "export-invoice-ad-unit",
          format: "banner",
          responsive: true,
        }
      },
      testMode: process.env.NODE_ENV !== "production"
    });
  }
);

// Check if user has temporary premium access from ad views
adRoutes.get(
  "/temp-premium-status",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // In a real implementation, we'd check database records
      // to see if the user has earned temporary premium access
      
      // For now, just return a placeholder response
      res.status(200).json({
        hasTempPremium: false,
        expiresAt: null,
        adViewsCount: 0,
        requiredAdViews: 5, // Number of ads needed to watch for temp premium
      });
    } catch (error) {
      console.error("Error checking temp premium status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check temporary premium status",
      });
    }
  }
);