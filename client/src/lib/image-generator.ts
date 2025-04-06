import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import type { Invoice } from '../types/invoice';

// Image quality settings
export interface ImageQualitySettings {
  scale: number;        // Scale of the image (1 = normal, 2 = double resolution)
  quality: number;      // JPEG quality (0.0 to 1.0)
}

// Predefined quality presets
export const QUALITY_PRESETS = {
  low: { scale: 1, quality: 0.7 } as ImageQualitySettings,
  medium: { scale: 2, quality: 0.85 } as ImageQualitySettings,
  high: { scale: 3, quality: 0.95 } as ImageQualitySettings,
  print: { scale: 4, quality: 1 } as ImageQualitySettings
};

// Function to generate image from the invoice preview DOM element
export const generateImage = async (
  element: HTMLElement, 
  type: 'png' | 'jpeg' = 'png',
  qualityPreset: keyof typeof QUALITY_PRESETS = 'high'
): Promise<string> => {
  if (!element) {
    throw new Error("No element found to generate image");
  }
  
  try {
    // Get quality settings from preset
    const settings = QUALITY_PRESETS[qualityPreset];
    
    // Configure html2canvas with improved settings
    const canvas = await html2canvas(element, {
      scale: settings.scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      removeContainer: true,  // Helps with memory management
      onclone: (doc) => {
        // Apply print-friendly styles to cloned document
        // The doc parameter is the cloned document
        if (doc && doc.documentElement) {
          const style = doc.createElement('style');
          style.innerHTML = `
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            @media print { body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; } }
          `;
          doc.head.appendChild(style);
        }
      }
    });
    
    // Convert to data URL with quality settings
    const mimeType = type === 'png' ? 'image/png' : 'image/jpeg';
    const quality = type === 'png' ? 1 : settings.quality;
    const dataUrl = canvas.toDataURL(mimeType, quality);
    
    return dataUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

// Function to download the image
export const downloadImage = async (
  element: HTMLElement,
  invoice: Invoice,
  type: 'png' | 'jpeg' = 'png',
  qualityPreset: keyof typeof QUALITY_PRESETS = 'high'
): Promise<void> => {
  try {
    const dataUrl = await generateImage(element, type, qualityPreset);
    
    // Create a clean filename (remove invalid characters)
    const safeClientName = (invoice.clientName || 'Client')
      .replace(/[^a-z0-9\-_]/gi, '-')
      .replace(/-+/g, '-');
    
    const fileName = `Invoice-${invoice.invoiceNumber || 'unknown'}-${safeClientName}.${type}`;
    
    try {
      // Convert data URL to blob
      const byteString = atob(dataUrl.split(',')[1]);
      const mimeType = type === 'png' ? 'image/png' : 'image/jpeg';
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeType });
      
      // Download using FileSaver
      saveAs(blob, fileName);
    } catch (blobError) {
      console.error('Error creating blob for download:', blobError);
      
      // Fallback: Create a download link manually if the blob approach fails
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error generating or downloading image:', error);
    throw new Error('Failed to download image: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};
