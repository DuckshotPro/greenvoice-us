
import { storage } from './storage';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError } from '../utils/logger';

// Define base directory for storing attachments
const ATTACHMENTS_DIR = path.join(process.cwd(), 'uploads/attachments');

// Ensure attachments directory exists
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

export interface AttachmentMetadata {
  id: string;
  invoiceId: number;
  userId: number;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  createdAt: string;
  description?: string;
}

/**
 * Service for handling file attachments for invoices
 */
export class AttachmentStorage {
  /**
   * Save a file attachment for an invoice
   */
  static async saveAttachment(
    invoiceId: number,
    userId: number,
    file: Express.Multer.File,
    description?: string
  ): Promise<AttachmentMetadata> {
    try {
      const id = uuidv4();
      const extension = path.extname(file.originalname);
      const filename = `${id}${extension}`;
      const storagePath = path.join(ATTACHMENTS_DIR, filename);
      
      // Save file to disk
      fs.writeFileSync(storagePath, file.buffer);
      
      // Create metadata
      const metadata: AttachmentMetadata = {
        id,
        invoiceId,
        userId,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storagePath,
        createdAt: new Date().toISOString(),
        description
      };
      
      // Save metadata to database
      await storage.storeAttachmentMetadata(metadata);
      
      logInfo('Attachment saved', 'AttachmentStorage', { invoiceId, userId, fileId: id });
      
      return metadata;
    } catch (error) {
      logError('Failed to save attachment', 'AttachmentStorage', { 
        invoiceId, userId, error: (error as Error).message 
      });
      throw error;
    }
  }
  
  /**
   * Get attachment metadata by ID
   */
  static async getAttachment(id: string): Promise<AttachmentMetadata | null> {
    try {
      return await storage.getAttachmentMetadata(id);
    } catch (error) {
      logError('Failed to get attachment', 'AttachmentStorage', { 
        id, error: (error as Error).message 
      });
      return null;
    }
  }
  
  /**
   * Get all attachments for an invoice
   */
  static async getInvoiceAttachments(invoiceId: number): Promise<AttachmentMetadata[]> {
    try {
      return await storage.getInvoiceAttachmentMetadata(invoiceId);
    } catch (error) {
      logError('Failed to get invoice attachments', 'AttachmentStorage', { 
        invoiceId, error: (error as Error).message 
      });
      return [];
    }
  }
  
  /**
   * Delete an attachment by ID
   */
  static async deleteAttachment(id: string, userId: number): Promise<boolean> {
    try {
      const metadata = await this.getAttachment(id);
      if (!metadata) {
        return false;
      }
      
      // Check ownership
      if (metadata.userId !== userId) {
        logError('Unauthorized attachment deletion attempt', 'AttachmentStorage', { 
          id, userId, ownerId: metadata.userId 
        });
        return false;
      }
      
      // Delete file
      if (fs.existsSync(metadata.storagePath)) {
        fs.unlinkSync(metadata.storagePath);
      }
      
      // Delete metadata
      await storage.deleteAttachmentMetadata(id);
      
      logInfo('Attachment deleted', 'AttachmentStorage', { id, userId });
      
      return true;
    } catch (error) {
      logError('Failed to delete attachment', 'AttachmentStorage', { 
        id, userId, error: (error as Error).message 
      });
      return false;
    }
  }
  
  /**
   * Get the file path for an attachment
   */
  static async getAttachmentPath(id: string): Promise<string | null> {
    const metadata = await this.getAttachment(id);
    if (!metadata) {
      return null;
    }
    return metadata.storagePath;
  }
}
