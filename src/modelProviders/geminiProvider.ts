import { BaseModelProvider } from './modelProviderInterface';
/* import { initChatModel } from "langchain/chat_models/universal"; */

/**
 * Google Gemini API provider implementation using the official SDK
 */
export class GeminiProvider extends BaseModelProvider {
  private geminiModel: any = null;
  private modelName: string;
  private apiKey: string = '';

  constructor(modelName: string = 'gemini-pro') {
    super(
      'Google Gemini',
      'https://generativelanguage.googleapis.com/v1beta/models'
    );
    this.modelName = modelName;
  }

  /**
   * Create a request body for Gemini API
   * Note: With the SDK, we're preparing parameters for the API call
   */
  createRequestBody(prompt: string, userInput: string): any {
    return {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${prompt}\n\n${userInput}`
            }
          ]
        }
      ],
      // generationConfig: {
      //   temperature: 0.2,
      //   maxOutputTokens: 1024
      // }
    };
  }

  /**
   * Extract content from Gemini API response
   * Supports both SDK-like and raw API response formats
   */
  extractContent(response: any): string {
    // Check official SDK streaming (if present)
    if (response?.response?.text) {
      try {
        // SDK returns a Promise for text() method
        // We'll just call it synchronously if possible, else fallback
        if (typeof response.response.text === 'function') {
          // Use as a promise (Edge-case: properly handle async in the consumer if needed)
          return '';
        }
        // If it's just a .text property
        return response.response.text;
      } catch {}
    }
    // Raw REST API response: candidates[0].content.parts[0].text is the main content string
    if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.candidates[0].content.parts[0].text;
    }
    // Some versions: choices[0].content
    if (response?.choices?.[0]?.content) {
      return response.choices[0].content;
    }
    // Fallbacks:
    if (response?.text) return response.text;
    // Handle plain string
    if (typeof response === 'string') return response;
    // Nothing found
    return '';
  }

  /**
   * Initialize the Gemini client with the API key
   */
  getHeaders(apiKey: string): Record<string, string> {
    // Store the API key
    this.apiKey = apiKey;
    // Initialize the LangChain Gemini model if not already done
    // (modelProvider: "google-vertexai" for Gemini)
    // This is async, so actual initialization is deferred to sendMessage
    return {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    };
  }

  /**
   * Send a message using LangChain's Gemini (VertexAI) via initChatModel
   */
  // sendMessage is not implemented in this build due to missing langchain/chat_models/universal
  async sendMessage(_: string, __: string, ___: string): Promise<any> {
    throw new Error("sendMessage is not implemented: missing langchain/chat_models/universal in this langchain version.");
  }

  /**
   * Override getEndpoint to include model name and append API key as query parameter
   * Note: With the SDK, this isn't used for actual requests but kept for compatibility
   */
  getEndpoint(): string {
    const baseEndpoint = super.getEndpoint();
    const endpointWithModel = `${baseEndpoint}/${this.modelName}:generateContent`;
    // Do not append the API key to the URL; rely on headers instead.
    return endpointWithModel;
  }
}
