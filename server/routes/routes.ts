// attachment-routes.js
import { Router } from 'express';
const router = Router();

// Add routes for file attachments here (e.g., upload, download, delete)
router.post('/upload', (req, res) => {
  // Handle file upload logic
  res.send('File uploaded');
});

router.get('/download/:id', (req, res) => {
  // Handle file download logic
  res.send('File downloaded');
});

router.delete('/delete/:id', (req, res) => {
  // Handle file deletion logic
  res.send('File deleted');
});


export default router;


// payment-routes.js
import { Router } from 'express';
const router = Router();

// Add routes for payment processing here (e.g., initiate payment, process payment, handle refunds)

router.post('/process', (req, res) => {
  // Handle payment processing logic.
  res.send('Payment processed');
});

export default router;



// main-routes.js
import { Router } from 'express';
import analyticsRoutes from './analytics-routes';
import brandingRoutes from './branding-routes';
import attachmentRoutes from './attachment-routes';
import paymentRoutes from './payment-routes';

const router = Router();

// Register all route groups
router.use('/analytics', analyticsRoutes);
router.use('/branding', brandingRoutes);
router.use('/attachments', attachmentRoutes); //Updated route for attachments
router.use('/payments', paymentRoutes);      //Updated route for payments

export default router;