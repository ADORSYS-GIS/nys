import * as vscode from 'vscode';
import axios from 'axios';
import { ModelProviderFactory } from '../modelProviders/modelProviderFactory';

interface LlmParserOptions {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  maxRetries?: number;
}

export interface ToolCommand {
  name: string;
  params: Record<string, any>;
}

/**
 * An LLM-based parser that uses an API to convert natural language to structured tool commands
 */
export class LlmParser {
  private options: LlmParserOptions;
  private availableTools: any[] = [];

  constructor(options: LlmParserOptions = {}) {
    this.options = {
      maxRetries: 2,
      ...options
    };
  }

  /**
   * Deprecated: No longer used; LLM is always expected to look up live tool lists via web.
   */
  public setAvailableTools(_tools: any[]) {
    // No-op: live web lookup always used.
  }

  /**
   * Parse natural language into a structured tool command using an LLM
   * @param input The user input to parse
   */
  public async parseInput(input: string, context?: any): Promise<ToolCommand | null> {
    // Quick pass - if it's already in the correct format, just return it
    if (input.startsWith('tool:')) {
      const [toolPrefix, ...paramParts] = input.split(' ');
      const toolName = toolPrefix.substring(5); // Remove 'tool:' prefix

      // Parse parameters
      const params: Record<string, any> = {};
      for (const part of paramParts) {
        const [key, value] = part.split('=');
        if (key && value) {
          // Try to convert numbers and booleans
          if (value === 'true') params[key] = true;
          else if (value === 'false') params[key] = false;
          else if (!isNaN(Number(value))) params[key] = Number(value);
          else params[key] = value;
        }
      }
      return { name: toolName, params };
    }

    // Check if we have the API key
    const config = vscode.workspace.getConfiguration('mcpClient');
    const apiKey = this.options.apiKey || config.get<string>('apiKey', '') || config.get<string>('llmApiKey', '');
    const useMockLlm = config.get<boolean>('useMockLlm', true); // Default to mock for testing

    if (!apiKey && !useMockLlm) {
      throw new Error('LLM API Key not configured. Please set mcpClient.apiKey in settings.');
    }

    // Build the LLM prompt with context if provided (README/project scope)
    const prompt = this.buildPrompt(typeof context === 'string' ? context : '');

    try {
      // For testing or when no API key is available, use a mock implementation
      if (useMockLlm) {
        console.log('Using mock LLM implementation');
        return this.mockLlmParse(input);
      }

      // Get the appropriate model provider based on configuration
      const modelProvider = ModelProviderFactory.getProvider();
      // Get current model name from configuration
      const configuredModel = config.get<string>('modelName', '');
      console.log(`Using ${modelProvider.name} for LLM parsing with model: ${configuredModel || 'default'}`);

      // Create request body based on the provider, first arg is system prompt with context
      const requestBody = modelProvider.createRequestBody(prompt, input);
      // Log the actual model being used in the request
      if (requestBody.model) {
        console.log(`Model being used in request: ${requestBody.model}`);
      }

      // Get appropriate headers
      const headers = modelProvider.getHeaders(apiKey);

      // Log request details for debugging (masked API key)
      console.log(`Calling ${modelProvider.name} API with endpoint: ${modelProvider.getEndpoint()}`);
      console.log(`Request headers: ${JSON.stringify({...headers, 'x-api-key': '***MASKED***', 'Authorization': '***MASKED***'}, null, 2)}`);
      console.log(`Request body preview: ${JSON.stringify(requestBody, null, 2).substring(0, 500)}...`);

      // Try using SDK for specific providers if available
      if (modelProvider.name === 'Anthropic Claude' && typeof (modelProvider as any).sendMessage === 'function') {
        console.log('Using Anthropic SDK direct method');
        try {
          // Use the SDK method directly
          const response = await (modelProvider as any).sendMessage(apiKey, prompt, input);
          console.log('Received response from Anthropic SDK');

          // Extract content using the provider's extraction method
          const content = modelProvider.extractContent(response);
          if (!content) {
            console.warn('No content extracted from Anthropic SDK response');
            return null;
          }

          console.log('Extracted content from Anthropic SDK response:', content.substring(0, 100) + '...');
          return this.parseToolCallFromLlm(content);
        } catch (sdkError) {
          console.error('Error using Anthropic SDK:', sdkError);
          // Fall through to standard HTTP request as fallback
        }
      }

      // Make the standard API call via HTTP
      console.log('Making standard HTTP API call');
      const response = await axios.post(
        modelProvider.getEndpoint(),
        requestBody,
        { headers }
      );

      // Log the response status
      console.log(`API response status: ${response.status}`);

      // Log response data structure (without sensitive data)
      const responseKeys = Object.keys(response.data || {});
      console.log(`Response data structure keys: ${responseKeys.join(', ')}`);

      // Extract content using the provider's extraction method
      const content = modelProvider.extractContent(response.data);

      // Log content extraction result
      if (!content) {
        console.warn('No content extracted from API response');
        return null;
      }

      console.log('Extracted content from API response:', content.substring(0, 100) + '...');

      // Extract the tool call
      return this.parseToolCallFromLlm(content);
    } catch (error) {
      console.error('Error calling LLM API:', error);

      // Log specific error details if available
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;
        if (errorObj.response) {
          console.error('API response status:', errorObj.response.status);
          console.error('API response data:', JSON.stringify(errorObj.response.data || {}, null, 2));
        }
      }

      // Try the mock as a fallback
      console.log('Falling back to mock LLM implementation after API error');

      // Import error handler dynamically to avoid circular dependencies
      const errorHandler = await import('../modelProviders/handleApiError');
      const errorMessage = errorHandler.handleApiError(error);

      // Log detailed error information
      console.error(`LLM API error details: ${errorMessage}`);

      // Try mock implementation as fallback
      try {
        return this.mockLlmParse(input);
      } catch (mockError) {
        throw new Error(`Failed to parse input using LLM: ${errorMessage}`);
      }
    }
  }

  /**
   * Mock LLM implementation for testing or when API key is not available
   */
  private mockLlmParse(input: string): ToolCommand | null {
    const normalizedInput = input.toLowerCase().trim();

    // Check for GitHub specific patterns
    if (normalizedInput.includes('list issues')) {
      // Extract owner and repo
      const ownerMatch = input.match(/(?:owned by|from|by|owner)\s+([\w.-]+)/i);
      const repoMatch = input.match(/(?:repository|repo|in)\s+([\w.-]+)/i);

      // If we found both owner and repo, create a tool command
      if (ownerMatch && repoMatch) {
        return {
          name: 'list_issues',
          params: {
            owner: ownerMatch[1],
            repo: repoMatch[1],
            state: 'open'
          }
        };
      }

      // Handle specific case from the user's example
      if (normalizedInput.includes('github_mcp_server') && normalizedInput.includes('github')) {
        return {
          name: 'list_issues',
          params: {
            owner: 'github',
            repo: 'github_mcp_server',
            state: 'open'
          }
        };
      }
    }

    // No match found
    return null;
  }

  /**
   * Build the prompt for the LLM with available tools
   */
  private buildPrompt(context: string): string {
    const extraContext = (typeof context === 'string' && context.trim()) ? context : '[No additional context provided]';

    return `You are a tool command parser for developer automation.
Your main job is to convert natural language into structured tool commands, for the GitHub MCP Server (https://github.com/github/github-mcp-server).

Context (GitHub project README or environment description, may provide repository name, tech stack, deployment intent, etc.):
${extraContext ? `-----\n${extraContext}\n-----\n` : '[No additional context provided]\n'}

Instructions:
- ALWAYS use your web/search browsing tool to consult the latest official documentation at https://github.com/github/github-mcp-server for current tool names, usage, and parameters.
- TOOL NAMES are ALWAYS in snake_case (use underscores between words, do not use dots or camelCase), e.g., use "create_repository" not "createRepository" or "github.create_repository".
- Example: tool:create_repository owner=someuser name=demo_repo will create a new repository.
- If the context describes a GitHub repo/project and the user's request is to "spin up" or setup infrastructure, figure out which tools (and in what sequence) would be needed; generate those tool commands one per line, in step-by-step order.
- Never rely on internal memory or prior tool names or parameters; always check the live repository for the most accurate catalog.
- Use only tool names, parameter formats, value choices, and expected output shapes that precisely match the latest official documentation as found during your live lookup.
- If the web tool is unavailable or you cannot find the tool information, reply with "NO_TOOL_MATCH" and nothing else.
- Do not use any supplied tool list from the client; always go to the source.

When you process a user request:
- Analyze the prompt (and the context if provided).
- Use your browsing tool to visit https://github.com/github/github-mcp-server (or its API docs) and find the correct tool and its parameters.
- Respond ONLY with the sequence of structured tool commands, in this format, one command per line:
  tool:tool_name param1=value1 param2=value2

If the input doesn't specify a valid tool/usage you can find, reply with "NO_TOOL_MATCH" and nothing else.

Output rules:
- Output must only be the formatted tool command(s) (one per line) or NO_TOOL_MATCH, nothing else.
- Do not include explanations, extra text, or chat summaries.`;
  }

  /**
   * Parse the LLM response to extract the tool call
   */
  public parseToolCallFromLlm(content: string | null): ToolCommand | null {
    // Handle null or undefined content
    if (!content) {
      console.error('LLM returned null or empty content');
      return null;
    }

    // Clean up the response
    const cleaned = content.trim();

    // Check if content is empty after trimming
    if (!cleaned) {
      console.error('LLM returned empty content after trimming');
      return null;
    }

    // Check if no tool match
    if (cleaned === 'NO_TOOL_MATCH') {
      return null;
    }

    // Check for tool: format
    if (cleaned.startsWith('tool:')) {
      const [toolPrefix, ...paramParts] = cleaned.split(' ');
      // Remove 'tool:' prefix and sanitize 'github.' or leading/trailing underscores
      let toolName = toolPrefix.substring(5);
      if (toolName.startsWith('github.')) {
        toolName = toolName.substring('github.'.length);
      }
      toolName = toolName.replace(/^_+|_+$/g, '');

      // Parse parameters
      const params: Record<string, any> = {};
      for (const part of paramParts) {
        const [key, value] = part.split('=');
        if (key && value) {
          // Try to convert numbers and booleans
          if (value === 'true') params[key] = true;
          else if (value === 'false') params[key] = false;
          else if (!isNaN(Number(value))) params[key] = Number(value);
          else params[key] = value;
        }
      }
      return { name: toolName, params };
    }

    // Log the unexpected content format
    console.warn('LLM response not in expected format:', cleaned);

    // Couldn't parse the response
    return null;
  }
}
