import { Router } from 'express';
import { analyticsRoutes } from './analytics-routes';
import brandingRoutes from './branding-routes';
import attachmentRoutes from './attachment-routes';
import paymentRoutes from './payment-routes';

const router = Router();

// Register all route groups
router.use('/analytics', analyticsRoutes);
router.use('/branding', brandingRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/payments', paymentRoutes);

export default router;