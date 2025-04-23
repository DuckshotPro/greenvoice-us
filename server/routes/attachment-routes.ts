
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { FileAttachmentService } from '../services/file-attachment-service';
import { activityTrackers } from '../middleware/activity-tracker';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  dest: UPLOAD_DIR,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Add attachment to invoice
router.post(
  '/invoices/:invoiceId/attachments',
  isAuthenticated,
  activityTrackers.createAttachment,
  upload.single('file'),
  async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const attachment = await FileAttachmentService.saveAttachment(
        invoiceId,
        userId,
        req.file
      );
      
      res.status(201).json(attachment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all attachments for an invoice
router.get(
  '/invoices/:invoiceId/attachments',
  isAuthenticated,
  async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const attachments = await FileAttachmentService.getAttachments(invoiceId);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete an attachment
router.delete(
  '/attachments/:attachmentId',
  isAuthenticated,
  activityTrackers.deleteAttachment,
  async (req, res) => {
    try {
      const { attachmentId } = req.params;
      const userId = req.user.id;
      
      await FileAttachmentService.deleteAttachment(attachmentId, userId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Serve attachment file
router.get('/attachments/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve attachment thumbnail
router.get('/attachments/:fileName/thumbnail', async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // In a production app, you would generate and serve a thumbnail
    // For simplicity, we'll just serve the original file
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
