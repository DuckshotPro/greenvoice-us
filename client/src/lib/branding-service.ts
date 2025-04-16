import { apiRequest } from "./queryClient";

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string | null;
  customTemplate?: string;
}

const defaultBrandingSettings: BrandingSettings = {
  primaryColor: '#3366FF',
  secondaryColor: '#00CCFF',
  accentColor: '#FF6B6B',
  fontFamily: 'Inter',
  logoUrl: null,
  customTemplate: 'default'
};

/**
 * Get user's branding settings from the server
 * @returns Promise with branding settings
 */
export async function getBrandingSettings(): Promise<BrandingSettings> {
  try {
    const response = await apiRequest('GET', '/api/branding/settings');
    if (!response.ok) {
      throw new Error('Failed to get branding settings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching branding settings:', error);
    return defaultBrandingSettings;
  }
}

/**
 * Save branding settings to the server
 * @param settings Branding settings to save
 * @returns Promise with saved settings
 */
export async function saveBrandingSettings(settings: BrandingSettings): Promise<BrandingSettings> {
  const response = await apiRequest('POST', '/api/branding/settings', settings);
  if (!response.ok) {
    throw new Error('Failed to save branding settings');
  }
  const data = await response.json();
  return data.brandingSettings;
}

/**
 * Generate a logo based on description
 * @param description Text description of the desired logo
 * @returns Promise with the generated logo URL
 */
export async function generateLogo(description: string): Promise<Blob> {
  const response = await apiRequest('POST', '/api/branding/generate-logo', { description });
  if (!response.ok) {
    throw new Error('Failed to generate logo');
  }
  return await response.blob();
}

/**
 * Generate a pattern based on brand colors and style description
 * @param brandColors Description of color scheme (e.g. "blue and gold")
 * @param style Description of pattern style (e.g. "geometric", "abstract", "minimalist")
 * @returns Promise with the generated pattern URL
 */
export async function generatePattern(brandColors: string, style: string): Promise<Blob> {
  const response = await apiRequest('POST', '/api/branding/generate-pattern', { 
    brandColors, 
    style 
  });
  if (!response.ok) {
    throw new Error('Failed to generate pattern');
  }
  return await response.blob();
}

/**
 * Convert a Blob to a data URL for display
 * @param blob Image blob
 * @returns Promise with data URL
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get a list of available font families
 * @returns Array of font families
 */
export function getAvailableFonts(): string[] {
  return [
    'Inter',
    'Roboto',
    'Open Sans',
    'Poppins',
    'Montserrat',
    'Lato',
    'Raleway',
    'Nunito',
    'Playfair Display',
    'Source Sans Pro'
  ];
}

/**
 * Get a list of available invoice templates
 * @returns Array of template options
 */
export function getAvailableTemplates(): { id: string, name: string, premium: boolean }[] {
  return [
    { id: 'default', name: 'Standard', premium: false },
    { id: 'modern', name: 'Modern', premium: false },
    { id: 'minimal', name: 'Minimal', premium: false },
    { id: 'elegant', name: 'Elegant', premium: true },
    { id: 'professional', name: 'Professional', premium: true },
    { id: 'creative', name: 'Creative', premium: true }
  ];
}