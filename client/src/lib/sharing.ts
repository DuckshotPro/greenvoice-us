import type { Invoice } from '../types/invoice';
import { generateImage } from './image-generator';
import { apiRequest } from './queryClient';

interface SocialShareUrls {
  twitter: string;
  facebook: string;
  linkedin: string;
  whatsapp: string;
}

interface ShareData {
  title: string;
  text: string;
  url: string;
}

// Generate URLs for various sharing platforms
export const generateShareUrls = (invoice: Invoice, shareUrl: string): SocialShareUrls => {
  // Create a descriptive share text
  const shareTitle = `Invoice ${invoice.invoiceNumber} from ${invoice.senderName}`;
  const shareText = `Invoice ${invoice.invoiceNumber} for ${invoice.total.toFixed(2)} ${invoice.currency} from ${invoice.senderName}. Due date: ${invoice.dueDate}`;
  
  // Encode URL components
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(shareTitle);
  
  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
  };
};

// Use the Web Share API if available, otherwise open a new window
export const shareToSocial = async (
  platform: keyof SocialShareUrls,
  invoice: Invoice,
  shareUrl: string
): Promise<void> => {
  const urls = generateShareUrls(invoice, shareUrl);
  
  // Open the sharing URL in a new window
  const shareWindow = window.open(
    urls[platform],
    `Share to ${platform}`,
    'width=600,height=400,resizable=yes,scrollbars=yes'
  );
  
  if (!shareWindow) {
    throw new Error('Popup blocked. Please allow popups and try again.');
  }
};

// Share via Web Share API if available
export const shareViaWebShareAPI = async (data: ShareData): Promise<void> => {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return;
    } catch (error) {
      // If user cancels or there's an error, fall back to other methods
      console.error('Error using Web Share API:', error);
    }
  }
  
  throw new Error('Web Share API not supported');
};

// Copy the shareable link to clipboard
export const copyShareableLink = async (link: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = link;
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (err) {
      console.error('Fallback clipboard copy failed:', err);
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Send invoice via email
export const sendViaEmail = async (
  invoiceId: number,
  recipient: string,
  subject: string,
  message: string
): Promise<{ success: boolean; message: string }> => {
  try {
    await apiRequest('POST', `/api/invoices/${invoiceId}/email`, {
      recipient,
      subject,
      message
    });
    
    return {
      success: true,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
};

// Create a blob object URL from image data
export const createBlobUrl = async (element: HTMLElement, type: 'png' | 'jpeg' = 'png'): Promise<string> => {
  const dataUrl = await generateImage(element, type);
  
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
};
