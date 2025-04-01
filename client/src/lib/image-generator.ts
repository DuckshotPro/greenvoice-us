import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import type { Invoice } from '../types/invoice';

// Function to generate image from the invoice preview DOM element
export const generateImage = async (
  element: HTMLElement, 
  type: 'png' | 'jpeg' = 'png'
): Promise<string> => {
  if (!element) {
    throw new Error("No element found to generate image");
  }
  
  // Configure html2canvas
  const canvas = await html2canvas(element, {
    scale: 2, // Higher scale for better quality
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: true,
  });
  
  // Convert to data URL
  const mimeType = type === 'png' ? 'image/png' : 'image/jpeg';
  const quality = type === 'png' ? 1 : 0.95;
  const dataUrl = canvas.toDataURL(mimeType, quality);
  
  return dataUrl;
};

// Function to download the image
export const downloadImage = async (
  element: HTMLElement,
  invoice: Invoice,
  type: 'png' | 'jpeg' = 'png'
): Promise<void> => {
  try {
    const dataUrl = await generateImage(element, type);
    
    // Create a downloadable file
    const fileName = `Invoice-${invoice.invoiceNumber}-${invoice.clientName.replace(/\s+/g, '-')}.${type}`;
    
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
  } catch (error) {
    console.error('Error generating or downloading image:', error);
    throw error;
  }
};
