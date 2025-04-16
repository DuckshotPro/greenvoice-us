import express, { Request, Response } from 'express';
import { z } from 'zod';
import { generateLogo, generatePattern } from '../services/huggingface-service';
import { storage } from '../storage';
import { validateBody } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import { logError, logInfo } from '../utils/logger';

// Add type augmentation for the user object on the request
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      subscriptionPlan: string;
      premiumDaysRemaining?: number;
      brandingSettings?: string;
      logoUrl?: string;
    }
  }
}

const router = express.Router();

// Schema for logo generation request
const logoRequestSchema = z.object({
  prompt: z.string().min(3).max(1000),
  model: z.string().optional(),
  size: z.string().optional(),
  style: z.string().optional(),
});

// Schema for pattern generation request
const patternRequestSchema = z.object({
  prompt: z.string().min(3).max(1000),
  model: z.string().optional(),
  size: z.string().optional(),
  style: z.string().optional(),
  seamless: z.boolean().optional(),
});

// Schema for saving branding settings
const brandingSettingsSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  logoUrl: z.string().optional(),
  patternUrl: z.string().optional(),
  customHeader: z.string().optional(),
  customFooter: z.string().optional(),
  showLogo: z.boolean().optional(),
  showPattern: z.boolean().optional(),
});

// Generate a logo
router.post('/generate-logo', requireAuth, validateBody(logoRequestSchema), async (req: Request, res: Response) => {
  try {
    // Check if user has premium access for logo generation
    const user = req.user!; // We know user exists because of requireAuth middleware
    const hasPremium = 
      user.subscriptionPlan !== 'free' || 
      (user.premiumDaysRemaining && user.premiumDaysRemaining > 0);
    
    if (!hasPremium) {
      return res.status(403).json({ 
        message: 'Premium feature: Logo generation requires a premium subscription or premium days',
        premiumRequired: true
      });
    }

    const { prompt, model, size, style } = req.body;
    const result = await generateLogo(prompt, { model, size, style });
    
    logInfo(`Logo generated successfully for user ${user.id}`, 'BrandingService', {
      userId: user.id,
      model: result.model
    });
    
    res.json({
      success: true,
      result: {
        imageData: `data:image/png;base64,${result.base64}`,
        model: result.model,
        prompt: result.prompt
      }
    });
  } catch (error: any) {
    logError('Error generating logo', 'BrandingService', { error });
    res.status(500).json({ message: 'Failed to generate logo', error: error.message });
  }
});

// Generate a pattern
router.post('/generate-pattern', requireAuth, validateBody(patternRequestSchema), async (req: Request, res: Response) => {
  try {
    // Check if user has premium access for pattern generation
    const user = req.user;
    const hasPremium = 
      user.subscriptionPlan !== 'free' || 
      (user.premiumDaysRemaining && user.premiumDaysRemaining > 0);
    
    if (!hasPremium) {
      return res.status(403).json({ 
        message: 'Premium feature: Pattern generation requires a premium subscription or premium days',
        premiumRequired: true
      });
    }

    const { prompt, model, size, style, seamless } = req.body;
    const result = await generatePattern(prompt, { model, size, style, seamless });
    
    logInfo(`Pattern generated successfully for user ${user.id}`, 'BrandingService', {
      userId: user.id,
      model: result.model
    });
    
    res.json({
      success: true,
      result: {
        imageData: `data:image/png;base64,${result.base64}`,
        model: result.model,
        prompt: result.prompt
      }
    });
  } catch (error) {
    logError('Error generating pattern', 'BrandingService', { error });
    res.status(500).json({ message: 'Failed to generate pattern', error: error.message });
  }
});

// Save branding settings
router.post('/settings', requireAuth, validateBody(brandingSettingsSchema), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const settings = req.body;
    
    // Store settings as JSON string
    const brandingSettings = JSON.stringify(settings);
    
    // Update user with new branding settings
    const updatedUser = await storage.updateUser(user.id, {
      brandingSettings,
      logoUrl: settings.logoUrl || user.logoUrl
    });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    logInfo(`Branding settings updated for user ${user.id}`, 'BrandingService', {
      userId: user.id
    });
    
    res.json({
      success: true,
      message: 'Branding settings saved successfully',
      settings: JSON.parse(updatedUser.brandingSettings || '{}')
    });
  } catch (error) {
    logError('Error saving branding settings', 'BrandingService', { error });
    res.status(500).json({ message: 'Failed to save branding settings', error: error.message });
  }
});

// Get current branding settings
router.get('/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    // Parse the stored JSON string
    const settings = user.brandingSettings ? JSON.parse(user.brandingSettings) : {};
    
    res.json({
      success: true,
      settings: {
        ...settings,
        logoUrl: user.logoUrl || settings.logoUrl
      }
    });
  } catch (error) {
    logError('Error retrieving branding settings', 'BrandingService', { error });
    res.status(500).json({ message: 'Failed to retrieve branding settings', error: error.message });
  }
});

export default router;