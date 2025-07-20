import { Router } from 'express';
import { aiUsageService } from '../services/ai-usage-service';
import { z } from 'zod';

const router = Router();

// Schema for tracking usage
const trackUsageSchema = z.object({
  usageType: z.enum(['chat', 'image_generation', 'content_generation', 'business_insights']),
  tokensUsed: z.number().min(0),
  metadata: z.record(z.any()).optional()
});

/**
 * Check if user can make an AI request
 */
router.get('/check-usage', async (req: any, res) => {
  try {
    const usageType = req.query.type || 'chat';
    const userId = req.user?.id;
    const sessionId = req.session?.id || req.sessionID;

    const result = await aiUsageService.checkUsageLimit(userId, sessionId, usageType);
    res.json(result);
  } catch (error) {
    console.error('Error checking usage limit:', error);
    res.status(500).json({ error: 'Failed to check usage limits' });
  }
});

/**
 * Get user's AI usage statistics
 */
router.get('/usage-stats', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.session?.id || req.sessionID;

    const stats = await aiUsageService.getUserUsageStats(userId, sessionId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

/**
 * Track AI usage after a successful request
 */
router.post('/track-usage', async (req: any, res) => {
  try {
    const data = trackUsageSchema.parse(req.body);
    const userId = req.user?.id;
    const sessionId = req.session?.id || req.sessionID;

    await aiUsageService.trackUsage({
      userId,
      sessionId,
      usageType: data.usageType,
      tokensUsed: data.tokensUsed,
      metadata: data.metadata
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking usage:', error);
    res.status(500).json({ error: 'Failed to track usage' });
  }
});

/**
 * Generate a session ID for guest users
 */
router.post('/generate-session', (req, res) => {
  try {
    const sessionId = aiUsageService.generateSessionId();
    res.json({ sessionId });
  } catch (error) {
    console.error('Error generating session ID:', error);
    res.status(500).json({ error: 'Failed to generate session ID' });
  }
});

export default router;