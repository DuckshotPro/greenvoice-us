import { HfInference } from '@huggingface/inference';

// Initialize the Hugging Face inference client
// Access through environment variables for security
// Note: For client-side, we need to use import.meta.env rather than process.env
const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY as string);

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  guidanceScale?: number;
}

/**
 * Generate an image using Stable Diffusion on Hugging Face
 * @param options - Image generation options
 * @returns Promise containing the generated image as a Blob
 */
export async function generateImage(options: ImageGenerationOptions): Promise<Blob> {
  const defaultOptions = {
    // Using stable-diffusion-2 as a default model - can be changed based on preference
    negativePrompt: "low quality, blurry, distorted, poor resolution",
    width: 512,
    height: 512,
    steps: 25,
    seed: Math.floor(Math.random() * 1000000),
    guidanceScale: 7.5,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    // Call the text-to-image model
    const response = await hf.textToImage({
      model: "stabilityai/stable-diffusion-2",
      inputs: mergedOptions.prompt,
      parameters: {
        negative_prompt: mergedOptions.negativePrompt,
        width: mergedOptions.width,
        height: mergedOptions.height,
        num_inference_steps: mergedOptions.steps,
        guidance_scale: mergedOptions.guidanceScale,
        seed: mergedOptions.seed,
      }
    });

    return response;
  } catch (error) {
    console.error("Error generating image with Hugging Face:", error);
    throw error;
  }
}

/**
 * Generate a logo suggestion based on brand description
 * @param description - Description of the brand and desired logo aesthetic
 * @returns Promise containing the generated logo as a Blob
 */
export async function generateLogoSuggestion(description: string): Promise<Blob> {
  // Enhanced prompt engineering for better logo generation
  const enhancedPrompt = `professional logo design, ${description}, minimalist, vector art, high quality, clean lines, business logo`;
  
  return generateImage({
    prompt: enhancedPrompt,
    width: 512,
    height: 512,
    steps: 30, // More steps for higher quality
    guidanceScale: 8.0, // Higher guidance for more prompt adherence
  });
}

/**
 * Generate a brand-themed background or pattern
 * @param brandColors - Description of brand colors and style
 * @param style - Pattern style (abstract, geometric, etc.)
 * @returns Promise containing the generated pattern as a Blob
 */
export async function generateBrandPattern(brandColors: string, style: string): Promise<Blob> {
  const prompt = `${style} pattern in ${brandColors}, professional, subtle, high quality, seamless texture, for invoice background`;
  
  return generateImage({
    prompt,
    width: 768, // Wider for backgrounds
    height: 512,
    steps: 25,
  });
}

/**
 * Convert an image blob to a base64 data URL
 * @param blob - Image blob to convert
 * @returns Promise containing the base64 data URL
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Export the HF instance for direct use if needed
export default hf;