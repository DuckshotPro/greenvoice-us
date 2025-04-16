import { HfInference } from '@huggingface/inference';

// Check if API key is available
if (!process.env.HUGGINGFACE_API_KEY) {
  console.warn('Warning: HUGGINGFACE_API_KEY not set. Image generation features will not work.');
}

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// The default model for image generation
const DEFAULT_MODEL = 'stabilityai/stable-diffusion-2';

/**
 * Generates a logo image using Hugging Face's text-to-image models
 * @param prompt The text prompt describing the logo to generate
 * @param options Additional options for generation
 */
export async function generateLogo(prompt: string, options: { 
  model?: string, 
  size?: string,
  style?: string
} = {}) {
  try {
    const model = options.model || DEFAULT_MODEL;
    const size = options.size || '512x512';
    const [width, height] = size.split('x').map(Number);
    
    // Enhance the prompt with style guidance
    let enhancedPrompt = prompt;
    if (options.style) {
      enhancedPrompt += `, ${options.style} style`;
    }
    
    // Add logo-specific guidance to the prompt
    enhancedPrompt += ', professional logo, vector style, high contrast, minimalist, clean lines';
    
    // Generate the image
    const result = await hf.textToImage({
      model,
      inputs: enhancedPrompt,
      parameters: {
        negative_prompt: 'blurry, low quality, pixelated, rough edges, text, words, letters',
        width,
        height,
      }
    });
    
    // Convert the blob to base64
    const buffer = await result.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    return {
      base64,
      model,
      prompt: enhancedPrompt
    };
  } catch (error: any) {
    console.error('Error generating logo with Hugging Face:', error);
    throw new Error('Failed to generate logo image: ' + (error.message || 'Unknown error'));
  }
}

/**
 * Generates a pattern or background image using Hugging Face's text-to-image models
 * @param prompt The text prompt describing the pattern to generate
 * @param options Additional options for generation
 */
export async function generatePattern(prompt: string, options: {
  model?: string,
  size?: string,
  style?: string,
  seamless?: boolean
} = {}) {
  try {
    const model = options.model || DEFAULT_MODEL;
    const size = options.size || '768x768';
    const [width, height] = size.split('x').map(Number);
    const seamless = options.seamless !== false; // Default to true
    
    // Enhance the prompt with style guidance
    let enhancedPrompt = prompt;
    if (options.style) {
      enhancedPrompt += `, ${options.style} style`;
    }
    
    // Add pattern-specific guidance to the prompt
    if (seamless) {
      enhancedPrompt += ', seamless pattern, tileable texture, repeating design';
    }
    enhancedPrompt += ', background pattern, subtle, professional';
    
    // Generate the image
    const result = await hf.textToImage({
      model,
      inputs: enhancedPrompt,
      parameters: {
        negative_prompt: 'blurry, low quality, pixelated, text, words, letters',
        width,
        height,
      }
    });
    
    // Convert the blob to base64
    const buffer = await result.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    return {
      base64,
      model,
      prompt: enhancedPrompt
    };
  } catch (error: any) {
    console.error('Error generating pattern with Hugging Face:', error);
    throw new Error('Failed to generate pattern image: ' + (error.message || 'Unknown error'));
  }
}