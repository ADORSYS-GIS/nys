/**
 * Interface for LLM model providers
 */
export interface ModelProviderInterface {
  /**
   * Name of the model provider
   */
  readonly name: string;

  /**
   * Get the provider's endpoint URL
   */
  getEndpoint(): string;

  /**
   * Create a request body for the model provider
   * @param prompt The system prompt
   * @param userInput The user input
   */
  createRequestBody(prompt: string, userInput: string): any;

  /**
   * Extract the content from the provider's response
   * @param response The raw response from the API
   */
  extractContent(response: any): string;

  /**
   * Get request headers including authorization
   * @param apiKey The API key to use
   */
  getHeaders(apiKey: string): Record<string, string>;
}

/**
 * Base implementation with common methods
 */
export abstract class BaseModelProvider implements ModelProviderInterface {
  constructor(public readonly name: string, protected readonly endpoint: string) {}

  getEndpoint(): string {
    return this.endpoint;
  }

  abstract createRequestBody(prompt: string, userInput: string): any;
  abstract extractContent(response: any): string;
  abstract getHeaders(apiKey: string): Record<string, string>;
}
