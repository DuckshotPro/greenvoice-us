import OpenAI from 'openai';
import { apiRequest } from '@/lib/queryClient';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AIAssistantOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  remainingDaily?: number;
  remainingMonthly?: number;
  planType: string;
}

export interface UsageStats {
  planType: string;
  daily: {
    used: number;
    limit: number;
    remaining: number;
  };
  monthly: {
    used: number;
    limit: number;
    remaining: number;
  };
  allowedTypes: string[];
  maxTokensPerRequest: number;
}

/**
 * Check if user can make an AI request
 */
export async function checkUsageLimit(usageType: string = 'chat'): Promise<UsageCheckResult> {
  try {
    const response = await apiRequest(`/api/ai/check-usage?type=${usageType}`);
    return response;
  } catch (error) {
    console.error('Error checking usage limit:', error);
    throw new Error('Failed to check usage limits');
  }
}

/**
 * Get user's AI usage statistics
 */
export async function getUserUsageStats(): Promise<UsageStats> {
  try {
    const response = await apiRequest('/api/ai/usage-stats');
    return response;
  } catch (error) {
    console.error('Error getting usage stats:', error);
    throw new Error('Failed to get usage statistics');
  }
}

/**
 * Track AI usage after a successful request
 */
async function trackUsage(usageType: string, tokensUsed: number, metadata: any = {}): Promise<void> {
  try {
    await apiRequest('/api/ai/track-usage', 'POST', {
      usageType,
      tokensUsed,
      metadata
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    // Don't throw error here as tracking failure shouldn't break the main functionality
  }
}

/**
 * Send a message to the AI Assistant and get a response
 * @param messages - Array of chat messages
 * @param options - Configuration options for the AI
 * @returns Promise containing the AI's response
 */
export async function sendMessageToAI(
  messages: ChatMessage[],
  options: AIAssistantOptions = {}
): Promise<string> {
  const defaultOptions = {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: `You are a helpful AI assistant for an invoice management platform called GreenVoice. You help users with:
    - Creating and managing invoices
    - Business finance advice
    - Invoice formatting and best practices
    - Payment processing guidance
    - General business questions
    
    Be professional, helpful, and concise. Focus on practical solutions.`
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Check usage limits before making request
  const usageCheck = await checkUsageLimit('chat');
  if (!usageCheck.allowed) {
    throw new Error(usageCheck.reason || 'Usage limit exceeded');
  }

  try {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: mergedOptions.systemPrompt,
      timestamp: new Date()
    };

    const apiMessages = [systemMessage, ...messages].map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await openai.chat.completions.create({
      model: mergedOptions.model,
      messages: apiMessages,
      temperature: mergedOptions.temperature,
      max_tokens: mergedOptions.maxTokens,
    });

    const content = response.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
    const tokensUsed = response.usage?.total_tokens || 0;

    // Track usage after successful request
    await trackUsage('chat', tokensUsed, {
      model: mergedOptions.model,
      messageCount: messages.length,
      promptLength: apiMessages.reduce((total, msg) => total + msg.content.length, 0)
    });

    return content;
  } catch (error) {
    console.error('Error communicating with OpenAI:', error);
    throw new Error('Failed to get AI response. Please check your API key and try again.');
  }
}

/**
 * Generate invoice content suggestions based on business context
 * @param businessType - Type of business
 * @param serviceDescription - Description of services/products
 * @returns Promise containing AI-generated suggestions
 */
export async function generateInvoiceContent(
  businessType: string,
  serviceDescription: string
): Promise<string> {
  // Check usage limits before making request
  const usageCheck = await checkUsageLimit('content_generation');
  if (!usageCheck.allowed) {
    throw new Error(usageCheck.reason || 'Usage limit exceeded');
  }

  const prompt = `Generate professional invoice line items and descriptions for a ${businessType} business providing: ${serviceDescription}. 
  
  Include:
  - Appropriate service/product descriptions
  - Suggested pricing structure
  - Professional terms and conditions
  - Payment terms recommendations
  
  Format as a structured response with clear sections.`;

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    }
  ];

  const response = await sendMessageToAI(messages, {
    systemPrompt: `You are an expert business consultant specializing in invoice creation and pricing strategies. Provide detailed, professional recommendations.`,
    temperature: 0.8
  });

  // Track specific usage type
  await trackUsage('content_generation', 0, {
    businessType,
    serviceDescription,
    feature: 'invoice_content_generation'
  });

  return response;
}

/**
 * Get AI assistance for payment collection strategies
 * @param invoiceAge - How long the invoice has been outstanding
 * @param clientType - Type of client (individual, small business, enterprise)
 * @returns Promise containing AI-generated collection advice
 */
export async function getPaymentCollectionAdvice(
  invoiceAge: number,
  clientType: string
): Promise<string> {
  const prompt = `An invoice has been outstanding for ${invoiceAge} days from a ${clientType} client. 
  Provide professional advice on:
  - Follow-up timeline and approach
  - Communication templates
  - Payment incentives or penalties
  - When to escalate collection efforts
  
  Be diplomatic but firm in tone.`;

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    }
  ];

  return sendMessageToAI(messages, {
    systemPrompt: `You are a professional accounts receivable specialist. Provide ethical, legal, and effective collection strategies.`,
    temperature: 0.6
  });
}

/**
 * Generate business insights based on invoice data
 * @param invoiceData - Summary of invoice statistics
 * @returns Promise containing AI-generated business insights
 */
export async function generateBusinessInsights(invoiceData: {
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  averagePaymentTime: number;
  topServices: string[];
}): Promise<string> {
  const prompt = `Based on this invoice data, provide business insights:
  - Total invoices: ${invoiceData.totalInvoices}
  - Paid invoices: ${invoiceData.paidInvoices}
  - Overdue invoices: ${invoiceData.overdueInvoices}
  - Average payment time: ${invoiceData.averagePaymentTime} days
  - Top services: ${invoiceData.topServices.join(', ')}
  
  Provide actionable recommendations for improving cash flow and business operations.`;

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    }
  ];

  return sendMessageToAI(messages, {
    systemPrompt: `You are a business analyst specializing in financial operations and cash flow management. Provide data-driven insights and recommendations.`,
    temperature: 0.7
  });
}

export default openai;