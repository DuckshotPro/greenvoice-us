import { Router } from 'express';
import { z } from 'zod';
import { huggingFaceService } from '../services/huggingface-service';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { storage } from '../models/storage';
import { ErrorLogger } from '../lib/error-logger';

const router = Router();

// Schema for logo generation request
const logoGenerationSchema = z.object({
  description: z.string().min(5).max(500),
});

// Schema for pattern generation request
const patternGenerationSchema = z.object({
  brandColors: z.string().min(3).max(200),
  style: z.string().min(3).max(100),
});

// Schema for branding settings
const brandingSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  fontFamily: z.string().min(3).max(50),
  logoUrl: z.string().url().optional().nullable(),
  customTemplate: z.string().optional(),
});

/**
 * Generate logo based on description
 * POST /api/branding/generate-logo
 * Authorization: Required
 */
router.post('/generate-logo', requireAuth, validateBody(logoGenerationSchema), async (req, res) => {
  try {
    const { description } = req.body;
    
    // Ensure the user has premium permissions
    const user = req.user;
    if (!user?.isPremium && !user?.premiumUntil) {
      return res.status(403).json({ message: 'Premium feature: Logo generation requires premium access' });
    }
    
    // Generate the logo
    const logo = await huggingFaceService.generateLogo(description);
    
    // Convert the response to a Buffer for transmission
    const arrayBuffer = await logo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Send the image data with proper content type
    res.set('Content-Type', 'image/png');
    res.send(buffer);
  } catch (error) {
    ErrorLogger.logError('Error generating logo', 'BrandingRoutes', { error });
    res.status(500).json({ message: 'Failed to generate logo', error: error.message });
  }
});

/**
 * Generate pattern based on brand colors and style
 * POST /api/branding/generate-pattern
 * Authorization: Required
 */
router.post('/generate-pattern', requireAuth, validateBody(patternGenerationSchema), async (req, res) => {
  try {
    const { brandColors, style } = req.body;
    
    // Ensure the user has premium permissions
    const user = req.user;
    if (!user?.isPremium && !user?.premiumUntil) {
      return res.status(403).json({ message: 'Premium feature: Pattern generation requires premium access' });
    }
    
    // Generate the pattern
    const pattern = await huggingFaceService.generatePattern(brandColors, style);
    
    // Convert the response to a Buffer for transmission
    const arrayBuffer = await pattern.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Send the image data with proper content type
    res.set('Content-Type', 'image/png');
    res.send(buffer);
  } catch (error) {
    ErrorLogger.logError('Error generating pattern', 'BrandingRoutes', { error });
    res.status(500).json({ message: 'Failed to generate pattern', error: error.message });
  }
});

/**
 * Save user's branding settings
 * POST /api/branding/settings
 * Authorization: Required
 */
router.post('/settings', requireAuth, validateBody(brandingSettingsSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const brandingSettings = req.body;
    
    // Update the user's branding settings in the database
    // For now, we'll store it in the user object, but in a real implementation
    // this would likely be in a separate table with proper relations
    const updatedUser = await storage.updateUser(userId, {
      brandingSettings: JSON.stringify(brandingSettings)
    });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ 
      message: 'Branding settings saved successfully',
      brandingSettings
    });
  } catch (error) {
    ErrorLogger.logError('Error saving branding settings', 'BrandingRoutes', { error });
    res.status(500).json({ message: 'Failed to save branding settings', error: error.message });
  }
});

/**
 * Get user's branding settings
 * GET /api/branding/settings
 * Authorization: Required
 */
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get the user with their branding settings
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Parse the branding settings if they exist
    let brandingSettings = null;
    if (user.brandingSettings) {
      try {
        brandingSettings = JSON.parse(user.brandingSettings);
      } catch (e) {
        ErrorLogger.logError('Error parsing branding settings', 'BrandingRoutes', { error: e });
      }
    }
    
    // Return default settings if none exist
    if (!brandingSettings) {
      brandingSettings = {
        primaryColor: '#3366FF',
        secondaryColor: '#00CCFF',
        accentColor: '#FF6B6B',
        fontFamily: 'Inter',
        logoUrl: null,
        customTemplate: 'default'
      };
    }
    
    res.status(200).json(brandingSettings);
  } catch (error) {
    ErrorLogger.logError('Error getting branding settings', 'BrandingRoutes', { error });
    res.status(500).json({ message: 'Failed to get branding settings', error: error.message });
  }
});

export default router;