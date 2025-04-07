import type { Invoice } from '../types/invoice';
import { generateImage, QUALITY_PRESETS } from './image-generator';
import { apiRequest } from './queryClient';

// Expanded social platforms
export interface SocialShareUrls {
  twitter: string;
  facebook: string;
  linkedin: string;
  whatsapp: string;
  telegram: string;   // Added Telegram
  email: string;      // Direct email sharing
}

export interface ShareData {
  title: string;
  text: string;
  url: string;
  files?: File[];     // For sharing files (like PDFs or images)
}

export interface EmailOptions {
  recipient: string;
  subject: string;
  message: string;
  attachPdf?: boolean;  // Whether to attach the PDF
  attachImage?: boolean; // Whether to attach the image
}

// Generate optimized sharing content
const generateShareContent = (invoice: Invoice): { title: string; text: string } => {
  // Create a descriptive share title
  const title = `Invoice ${invoice.invoiceNumber || 'N/A'} from ${invoice.senderName || 'Sender'}`;
  
  // Create a descriptive share text with more context
  let text = `Invoice ${invoice.invoiceNumber || 'N/A'} `;
  text += `for ${invoice.total.toFixed(2)} ${invoice.currency} `;
  text += `from ${invoice.senderName || 'Sender'} to ${invoice.clientName || 'Client'}. `;
  
  // Include due date if available
  if (invoice.dueDate) {
    // Format date in human-readable form
    const dueDate = new Date(invoice.dueDate);
    const formattedDate = dueDate.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    text += `Due date: ${formattedDate}.`;
  }
  
  return { title, text };
};

// Generate URLs for various sharing platforms
export const generateShareUrls = (invoice: Invoice, shareUrl: string): SocialShareUrls => {
  const { title, text } = generateShareContent(invoice);
  
  // Encode URL components
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(text);
  const encodedTitle = encodeURIComponent(title);
  
  // Build email body with more context
  const emailSubject = encodeURIComponent(`Invoice ${invoice.invoiceNumber || 'N/A'} from ${invoice.senderName || 'Sender'}`);
  const emailBody = encodeURIComponent(`Hello,

I'm sharing Invoice ${invoice.invoiceNumber || 'N/A'} with you.

Amount: ${invoice.total.toFixed(2)} ${invoice.currency}
Due date: ${invoice.dueDate || 'N/A'}

You can view the invoice here: ${shareUrl}

Regards,
${invoice.senderName || 'Sender'}
`);
  
  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}&title=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    email: `mailto:?subject=${emailSubject}&body=${emailBody}`
  };
};

// Share to social media platforms
export const shareToSocial = async (
  platform: keyof SocialShareUrls,
  invoice: Invoice,
  shareUrl: string
): Promise<void> => {
  try {
    const urls = generateShareUrls(invoice, shareUrl);
    
    // Log share analytics event
    try {
      await apiRequest('POST', '/api/analytics/track-share', {
        invoiceId: invoice.id,
        shareMethod: platform,
        metadata: { platform, url: shareUrl }
      });
    } catch (analyticsError) {
      // Don't let analytics errors stop the sharing
      console.warn('Failed to track share analytics:', analyticsError);
    }
    
    // For email sharing, just open the mail client
    if (platform === 'email') {
      window.location.href = urls.email;
      return;
    }
    
    // For other platforms, open in popup
    const shareWindow = window.open(
      urls[platform],
      `Share to ${platform}`,
      'width=600,height=600,resizable=yes,scrollbars=yes,toolbar=no,menubar=no'
    );
    
    if (!shareWindow) {
      throw new Error('Popup blocked. Please allow popups and try again.');
    }
  } catch (error) {
    console.error(`Error sharing to ${platform}:`, error);
    throw new Error(`Failed to share to ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Enhanced Web Share API with fallbacks
export const shareViaWebShareAPI = async (data: ShareData, invoiceId?: number): Promise<boolean> => {
  // Track the share attempt if invoiceId is provided
  if (invoiceId) {
    try {
      await apiRequest('POST', '/api/analytics/track-share', {
        invoiceId,
        shareMethod: 'web-share-api',
        metadata: { url: data.url }
      });
    } catch (analyticsError) {
      // Don't let analytics errors stop the sharing
      console.warn('Failed to track share analytics:', analyticsError);
    }
  }
  
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      // If user cancels, that's okay - just return false
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('User cancelled sharing');
        return false;
      }
      
      // For other errors, log and continue to fallbacks
      console.warn('Web Share API error:', error);
    }
  }
  
  // If Web Share API is not available or failed, try to copy link as fallback
  if (data.url) {
    try {
      const success = await copyShareableLink(data.url, invoiceId);
      if (success) {
        return true;
      }
    } catch (error) {
      console.warn('Clipboard fallback failed:', error);
    }
  }
  
  return false;
};

// Copy the shareable link to clipboard with better error handling
export const copyShareableLink = async (link: string, invoiceId?: number): Promise<boolean> => {
  // Track the copy to clipboard if invoiceId is provided
  if (invoiceId) {
    try {
      await apiRequest('POST', '/api/analytics/track-share', {
        invoiceId,
        shareMethod: 'clipboard',
        metadata: { url: link }
      });
    } catch (analyticsError) {
      // Don't let analytics errors stop the copying
      console.warn('Failed to track clipboard analytics:', analyticsError);
    }
  }
  
  // Modern clipboard API
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch (error) {
      console.warn('Clipboard API failed:', error);
      // Fall through to legacy approach
    }
  }
  
  // Legacy approach for older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = link;
    
    // Make the textarea invisible
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Legacy clipboard copy failed:', err);
    return false;
  }
};

// Send invoice via email with enhanced options and error handling
export const sendViaEmail = async (
  invoiceId: number,
  options: EmailOptions
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!options.recipient) {
      throw new Error('Recipient email is required');
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(options.recipient)) {
      throw new Error('Invalid email address format');
    }
    
    // Create request payload
    const payload = {
      recipient: options.recipient,
      subject: options.subject,
      message: options.message,
      attachPdf: options.attachPdf === undefined ? true : options.attachPdf,
      attachImage: options.attachImage
    };
    
    const response = await apiRequest('POST', `/api/invoices/${invoiceId}/email`, payload);
    
    return {
      success: true,
      message: 'Email sent successfully to ' + options.recipient
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
};

// Create a blob object URL from image data with quality options
export const createBlobUrl = async (
  element: HTMLElement, 
  type: 'png' | 'jpeg' = 'png',
  qualityPreset: keyof typeof QUALITY_PRESETS = 'high'
): Promise<string> => {
  try {
    const dataUrl = await generateImage(element, type, qualityPreset);
    
    // Convert data URL to blob URL
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeType = type === 'png' ? 'image/png' : 'image/jpeg';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating blob URL:', error);
    throw new Error('Failed to create image URL: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

// Create a File object from an element for sharing
export const createFileFromElement = async (
  element: HTMLElement,
  invoice: Invoice,
  type: 'png' | 'jpeg' = 'png',
  qualityPreset: keyof typeof QUALITY_PRESETS = 'high'
): Promise<File> => {
  try {
    const dataUrl = await generateImage(element, type, qualityPreset);
    
    // Convert data URL to blob
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeType = type === 'png' ? 'image/png' : 'image/jpeg';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeType });
    
    // Create a safe filename
    const safeInvoiceNumber = (invoice.invoiceNumber || 'unknown').replace(/[^a-z0-9\-_]/gi, '-');
    const safeClientName = (invoice.clientName || 'Client').replace(/[^a-z0-9\-_]/gi, '-');
    const fileName = `Invoice-${safeInvoiceNumber}-${safeClientName}.${type}`;
    
    return new File([blob], fileName, { type: mimeType });
  } catch (error) {
    console.error('Error creating file from element:', error);
    throw new Error('Failed to create file: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};
