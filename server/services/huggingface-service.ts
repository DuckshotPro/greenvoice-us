import { HfInference } from '@huggingface/inference';

// Initialize the Hugging Face inference client with API key from environment
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

interface TextToImageParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  guidanceScale?: number;
}

/**
 * Server-side image generation service using Hugging Face
 */
export class HuggingFaceService {
  /**
   * Generate an image from text prompt
   * @param params - Text to image parameters
   * @returns Promise with the generated image as a blob
   */
  async generateImage(params: TextToImageParams): Promise<Blob> {
    try {
      // Set default parameters
      const defaultParams = {
        negativePrompt: "low quality, blurry, distorted, poor resolution",
        width: 512,
        height: 512,
        steps: 25,
        seed: Math.floor(Math.random() * 1000000),
        guidanceScale: 7.5,
      };

      const mergedParams = { ...defaultParams, ...params };

      const response = await hf.textToImage({
        model: "stabilityai/stable-diffusion-2",
        inputs: mergedParams.prompt,
        parameters: {
          negative_prompt: mergedParams.negativePrompt,
          width: mergedParams.width,
          height: mergedParams.height,
          num_inference_steps: mergedParams.steps,
          guidance_scale: mergedParams.guidanceScale,
          seed: mergedParams.seed,
        }
      });

      return response;
    } catch (error) {
      console.error('Error generating image with Hugging Face:', error);
      throw error;
    }
  }

  /**
   * Generate a logo based on company description
   * @param description - Company/brand description
   * @returns Promise with the generated logo as a blob
   */
  async generateLogo(description: string): Promise<Blob> {
    const enhancedPrompt = `professional logo design, ${description}, minimalist, vector art, business logo, clean lines, high quality, transparent background`;
    
    return this.generateImage({
      prompt: enhancedPrompt,
      width: 512,
      height: 512,
      steps: 30,
      guidanceScale: 8.0,
    });
  }

  /**
   * Generate a branded pattern or background
   * @param brandColors - Description of brand colors
   * @param style - Pattern style (abstract, geometric, etc.)
   * @returns Promise with the generated pattern as a blob
   */
  async generatePattern(brandColors: string, style: string): Promise<Blob> {
    const prompt = `${style} pattern in ${brandColors}, subtle, professional, high quality, seamless texture, for invoice background`;
    
    return this.generateImage({
      prompt,
      width: 768,
      height: 512,
      steps: 25,
    });
  }
}

// Export a singleton instance of the service
export const huggingFaceService = new HuggingFaceService();