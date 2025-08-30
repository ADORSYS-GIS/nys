import { BaseModelProvider } from './modelProviderInterface';
import OpenAI from 'openai';

/**
 * OpenAI API provider implementation using the official SDK
 */
export class OpenAiProvider extends BaseModelProvider {
  private client: OpenAI | null = null;
  private modelName: string;

  constructor(modelName: string = 'gpt-5') {
    super(
      'OpenAI',
      'https://api.openai.com/v1/chat/completions'
    );
    this.modelName = modelName;
  }

  /**
   * Create a request body for OpenAI's chat completions API
   * Note: With the SDK, we're not directly creating a request body,
   * but instead preparing the parameters for the API call
   */
  createRequestBody(prompt: string, userInput: string): any {
    return {
      model: this.modelName,
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: userInput
        }
      ],
    };
  }

  /**
   * Extract content from OpenAI's API response
   */
  extractContent(response: any): string {
    // SDK response format is different from raw API response
    if (response.choices && response.choices[0]?.message?.content) {
      return response.choices[0].message.content;
    }
    // Handle SDK response format
    return response.content || '';
  }

  /**
   * Initialize the OpenAI client with the API key
   */
  getHeaders(apiKey: string): Record<string, string> {
    // Initialize the OpenAI client if not already done
    this.client = new OpenAI({
      apiKey: apiKey
    });

    // Still return headers for compatibility with the interface
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
  }
}
