
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../models/storage';
import { logInfo, logError } from '../utils/logger';
import { Attachment } from '../../shared/schema';
import { BusinessMetricsLogger } from '../utils/business-metrics-logger';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class FileAttachmentService {
  private static readonly SOURCE = 'FileAttachmentService';

  /**
   * Save an uploaded file as an attachment for an invoice
   */
  static async saveAttachment(
    invoiceId: string,
    userId: string,
    file: Express.Multer.File
  ): Promise<Attachment> {
    try {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      // Generate a unique file name to prevent collisions
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      // Move the uploaded file to the permanent location
      fs.copyFileSync(file.path, filePath);
      
      // Generate thumbnail if it's an image
      let thumbnailUrl: string | undefined;
      if (file.mimetype.startsWith('image/')) {
        // In a production app, you would generate a thumbnail here
        // For simplicity, we'll just use the same URL
        thumbnailUrl = `/api/attachments/${fileName}/thumbnail`;
      }

      // Create the attachment record
      const attachment: Attachment = {
        id: uuidv4(),
        invoiceId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        url: `/api/attachments/${fileName}`,
        thumbnailUrl,
        createdAt: new Date().toISOString()
      };

      // Save attachment record in database
      await storage.storeAttachment(attachment);

      // Log the attachment creation
      logInfo(`Attachment created: ${attachment.id}`, this.SOURCE, {
        invoiceId,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize
      });

      // Track business metrics
      BusinessMetricsLogger.logFeatureUsage('add_attachment', {
        userId,
        successful: true
      });

      return attachment;
    } catch (error) {
      logError(`Failed to save attachment`, this.SOURCE, { invoiceId, error });
      throw error;
    }
  }

  /**
   * Get all attachments for an invoice
   */
  static async getAttachments(invoiceId: string): Promise<Attachment[]> {
    try {
      return await storage.getAttachmentsByInvoiceId(invoiceId);
    } catch (error) {
      logError(`Failed to get attachments`, this.SOURCE, { invoiceId, error });
      throw error;
    }
  }

  /**
   * Delete an attachment
   */
  static async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    try {
      const attachment = await storage.getAttachmentById(attachmentId);
      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Extract filename from URL
      const fileName = path.basename(attachment.url);
      const filePath = path.join(UPLOAD_DIR, fileName);

      // Delete the file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete the attachment record
      await storage.deleteAttachment(attachmentId);

      // Log the deletion
      logInfo(`Attachment deleted: ${attachmentId}`, this.SOURCE, {
        invoiceId: attachment.invoiceId
      });

      // Track business metrics
      BusinessMetricsLogger.logFeatureUsage('delete_attachment', {
        userId,
        successful: true
      });
    } catch (error) {
      logError(`Failed to delete attachment`, this.SOURCE, { attachmentId, error });
      throw error;
    }
  }
}
