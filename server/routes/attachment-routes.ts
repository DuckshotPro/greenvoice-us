
import { Router } from 'express';
import multer from 'multer';
import { AttachmentStorage } from '../models/attachment-storage';
import { isAuthenticated } from '../middleware/auth';
import { trackUserActivity } from '../middleware/activity-tracker';
import { BusinessMetricsLogger } from '../utils/business-metrics-logger';
import path from 'path';
import fs from 'fs';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and PDF are allowed.') as any);
    }
  }
});

const router = Router();

// Upload attachment for an invoice
router.post(
  '/invoices/:invoiceId/attachments',
  isAuthenticated,
  upload.single('file'),
  trackUserActivity('upload_attachment', { journey: 'invoice_management', step: 'add_attachment' }),
  async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      const userId = req.user!.id;
      const description = req.body.description;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const metadata = await AttachmentStorage.saveAttachment(
        invoiceId,
        userId,
        req.file,
        description
      );
      
      // Log business metric
      BusinessMetricsLogger.logFeatureUsage('attachment_upload', {
        userId: userId.toString(),
        successful: true,
        duration: req.requestTime ? Date.now() - req.requestTime : undefined
      });
      
      return res.status(201).json(metadata);
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      return res.status(500).json({ error: 'Failed to upload attachment' });
    }
  }
);

// Get all attachments for an invoice
router.get(
  '/invoices/:invoiceId/attachments',
  isAuthenticated,
  trackUserActivity('view_attachments'),
  async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      const attachments = await AttachmentStorage.getInvoiceAttachments(invoiceId);
      
      return res.json(attachments);
    } catch (error) {
      console.error('Failed to get attachments:', error);
      return res.status(500).json({ error: 'Failed to get attachments' });
    }
  }
);

// Download an attachment
router.get(
  '/attachments/:id/download',
  trackUserActivity('download_attachment'),
  async (req, res) => {
    try {
      const id = req.params.id;
      const metadata = await AttachmentStorage.getAttachment(id);
      
      if (!metadata) {
        return res.status(404).json({ error: 'Attachment not found' });
      }
      
      const filePath = metadata.storagePath;
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Attachment file not found' });
      }
      
      // Track download for analytics
      if (req.user) {
        BusinessMetricsLogger.logFeatureUsage('attachment_download', {
          userId: req.user.id.toString(),
          successful: true
        });
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${metadata.originalFilename}"`);
      res.setHeader('Content-Type', metadata.mimeType);
      
      return res.sendFile(filePath);
    } catch (error) {
      console.error('Failed to download attachment:', error);
      return res.status(500).json({ error: 'Failed to download attachment' });
    }
  }
);

// Delete an attachment
router.delete(
  '/attachments/:id',
  isAuthenticated,
  trackUserActivity('delete_attachment'),
  async (req, res) => {
    try {
      const id = req.params.id;
      const userId = req.user!.id;
      
      const result = await AttachmentStorage.deleteAttachment(id, userId);
      
      if (!result) {
        return res.status(404).json({ error: 'Attachment not found or unauthorized' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      return res.status(500).json({ error: 'Failed to delete attachment' });
    }
  }
);

export default router;
