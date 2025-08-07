import { BaseModelProvider } from './modelProviderInterface';
import Anthropic from '@anthropic-ai/sdk';


/**
 * Anthropic Claude API provider implementation using official SDK
 */
export class AnthropicProvider extends BaseModelProvider {
  private anthropicClient: Anthropic | null = null;
  private readonly defaultModel: string = 'claude-3-sonnet-20240229';

  constructor(private modelName: string = 'claude-3-sonnet-20240229') {
    super(
      'Anthropic Claude',
      'https://api.anthropic.com/v1/messages'
    );
    console.log(`AnthropicProvider initialized with model: ${this.modelName || this.defaultModel}`);
  }

  /**
   * Initialize the Anthropic client
   */
  private initClient(apiKey: string): Anthropic {
    if (!this.anthropicClient) {
      try {
        this.anthropicClient = new Anthropic({
          apiKey,
          // Only enable this in browser environments if needed
          // dangerouslyAllowBrowser: true
        });
      } catch (error) {
        console.error('Failed to initialize Anthropic client:', error);
        throw new Error(`Anthropic client initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return this.anthropicClient;
  }

  /**
   * Create a request body for Anthropic's API
   * Note: When using the SDK directly, this is used to structure the messages
   */
  createRequestBody(prompt: string, userInput: string): any {
    // Log the model name being used
    console.log(`Creating request body for Anthropic model: ${this.modelName}`);

    return {
      model: this.modelName,
      system: prompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userInput
            }
          ]
        }
      ],
      max_tokens: 1024,
      temperature: 0.2
    };
  }

  /**
   * Extract content from Anthropic's API response
   */
  extractContent(response: any): string {
    // Add detailed logging for debugging
    console.log('Anthropic response structure:', JSON.stringify(response, null, 2).substring(0, 500));

    // Handle null or undefined response
    if (!response) {
      console.error('Received null or undefined response from Anthropic API');
      return '';
    }

    // Handle the response structure from the latest SDK
    if (response.content) {
      // The SDK returns content as an array of blocks with type and text properties
      const content = response.content;
      if (Array.isArray(content) && content.length > 0) {
        console.log(`Found ${content.length} content blocks in Anthropic response`);

        // Handle structured content blocks
        const textBlocks = content.filter(block => block.type === 'text');
        if (textBlocks.length > 0) {
          const extractedText = textBlocks.map(block => block.text).join('\n');
          console.log('Extracted text from Anthropic response:', extractedText.substring(0, 100) + '...');
          return extractedText;
        }
      }

      // Fallback: try to get text from first content block
      if (content[0]?.text) {
        console.log('Using first content block fallback:', content[0].text.substring(0, 100) + '...');
        return content[0].text;
      }
    }

    // Check for alternative response formats
    if (response.message?.content) {
      console.log('Found content in message.content structure');
      return typeof response.message.content === 'string' 
        ? response.message.content 
        : JSON.stringify(response.message.content);
    }

    // Check for completion structure
    if (response.completion) {
      console.log('Found completion in response');
      return response.completion;
    }

    // Log error for unexpected structure
    console.error('Could not extract content from Anthropic response with structure:', 
      Object.keys(response).join(', '));

    // Fallback for unexpected response structure
    return '';
  }

  /**
   * Get Anthropic API headers
   */
  getHeaders(apiKey: string): Record<string, string> {
    // Initialize client for future use
    this.initClient(apiKey);

    // Still returning headers for compatibility with the interface
    // When using the SDK directly, these won't be needed
    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };
  }

  /**
   * API key authentication method similar to the library implementation
   * @param apiKey API key for authentication
   * @returns Headers object with API key
   */
  protected apiKeyAuth(apiKey: string): Record<string, string> {
    if (apiKey == null) {
      return {};
    }
    // Use the same case as in the SDK
    return { 'x-api-key': apiKey };
  }

  /**
   * Send a message using the Anthropic SDK directly
   * This method can be used as an alternative to the standard HTTP request flow
   */
  async sendMessage(apiKey: string, prompt: string, userInput: string): Promise<any> {
    try {
      const client = this.initClient(apiKey);
      console.log(`Using Anthropic model: ${this.modelName}`);

      return await client.messages.create({
        model: this.modelName,
        max_tokens: 1024,
        temperature: 0.2,
        system: prompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userInput
              }
            ]
          }
        ]
      });
    } catch (error) {
      // Enhanced error handling with complete details
      console.error('Anthropic API error:', error);

      // Extract response details if available
      const errorResponse = typeof error === 'object' && error !== null 
        ? (error as any).response?.data || (error as Error).message || 'Unknown Anthropic API error'
        : 'Unknown Anthropic API error';
      const errorStatus = typeof error === 'object' && error !== null 
        ? (error as any).response?.status || 500
        : 500;

      // Rethrow with detailed information
      const enhancedError = new Error(`Anthropic API error (${errorStatus}): ${JSON.stringify(errorResponse)}`);
      // @ts-ignore - Adding custom properties to the error object
      enhancedError.status = errorStatus;
      // @ts-ignore
      enhancedError.responseData = errorResponse;

      throw enhancedError;
    }
  }
}
