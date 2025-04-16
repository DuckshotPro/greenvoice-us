import { apiRequest } from "./queryClient";

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string | null;
  patternUrl?: string | null;
  customHeader?: string;
  customFooter?: string;
  showLogo?: boolean;
  showPattern?: boolean;
  customTemplateId?: string;
}

const defaultBrandingSettings: BrandingSettings = {
  primaryColor: '#3366FF',
  secondaryColor: '#00CCFF',
  accentColor: '#FF6B6B',
  fontFamily: 'Inter',
  logoUrl: null,
  patternUrl: null,
  showLogo: true,
  showPattern: false,
  customTemplateId: 'default'
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
    const data = await response.json();
    return data.settings || defaultBrandingSettings;
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
  return data.settings || settings;
}

/**
 * Generate a logo based on description
 * @param prompt Text description of the desired logo
 * @param options Additional options for generation
 * @returns Promise with the generated logo URL
 */
export async function generateLogo(
  prompt: string, 
  options: { model?: string, size?: string, style?: string } = {}
): Promise<string> {
  const response = await apiRequest('POST', '/api/branding/generate-logo', { 
    prompt,
    ...options
  });
  
  if (!response.ok) {
    // Check if it's a premium feature error
    const errorData = await response.json().catch(() => ({}));
    if (errorData.premiumRequired) {
      throw new Error('Premium feature: Logo generation requires a premium subscription or premium days');
    }
    throw new Error('Failed to generate logo');
  }
  
  const data = await response.json();
  return data.result.imageData;
}

/**
 * Generate a pattern based on description
 * @param prompt Text description of the desired pattern
 * @param options Additional options for generation
 * @returns Promise with the generated pattern URL
 */
export async function generatePattern(
  prompt: string,
  options: { model?: string, size?: string, style?: string, seamless?: boolean } = {}
): Promise<string> {
  const response = await apiRequest('POST', '/api/branding/generate-pattern', { 
    prompt,
    ...options
  });
  
  if (!response.ok) {
    // Check if it's a premium feature error
    const errorData = await response.json().catch(() => ({}));
    if (errorData.premiumRequired) {
      throw new Error('Premium feature: Pattern generation requires a premium subscription or premium days');
    }
    throw new Error('Failed to generate pattern');
  }
  
  const data = await response.json();
  return data.result.imageData;
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