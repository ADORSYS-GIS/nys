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
  public async parseInput(input: string, context?: any): Promise<ToolCommand[] | string> {
    // Quick pass - if it's already in the correct format, just return it as an array
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
      // Wrap in array for consistency
      return [{ name: toolName, params }];
    }

    // Check if we have the API key
    const config = vscode.workspace.getConfiguration('mcpClient');
    const apiKey = this.options.apiKey || config.get<string>('apiKey', '') || config.get<string>('llmApiKey', '');

    if (!apiKey) {
      throw new Error('LLM API Key not configured. Please set mcpClient.apiKey in settings.');
    }

    // Build the LLM prompt with context if provided (README/project scope)
    const prompt = this.buildPrompt(typeof context === 'string' ? context : '');

    try {
      // Only real LLM calls from here
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
            return "NO_TOOL_MATCH";
          }

          console.log('Extracted content from Anthropic SDK response:', content.substring(0, 100) + '...');
          const parsed = this.parseToolCallFromLlm(content);
          if (parsed === null) return "NO_TOOL_MATCH";
          return [parsed];
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
        return "NO_TOOL_MATCH";
      }

      console.log('Extracted content from API response:', content.substring(0, 100) + '...');

      // Extract the tool call(s): handle multi-line, NO_TOOL_MATCH, or a single tool
      // If empty/invalid, return NO_TOOL_MATCH as string
      if (typeof content === 'string') {
        const normalized = content.trim();
        if (!normalized) {
          return "NO_TOOL_MATCH";
        }
        if (normalized === 'NO_TOOL_MATCH') {
          return "NO_TOOL_MATCH";
        }
        // Support multi-command LLM responses (one per line)
        const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);
        const toolCommands: ToolCommand[] = [];
        for (const line of lines) {
          const toolObj = this.parseToolCallFromLlm(line);
          if (toolObj !== null) toolCommands.push(toolObj);
        }
        if (toolCommands.length > 0) {
          return toolCommands;
        }
        // If nothing parsed, propagate raw text as reason
        return "NO_TOOL_MATCH";
      }
      // If LLM returned a tool object directly (should not happen, but for compatibility)
      if (typeof content === 'object' && content !== null) {
        if (Array.isArray(content)) {
          return content as ToolCommand[];
        } else {
          return [content as ToolCommand];
        }
      }
      // If nothing at all, return "NO_TOOL_MATCH" string
      return "NO_TOOL_MATCH";
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

      // Import error handler dynamically to avoid circular dependencies
      const errorHandler = await import('../modelProviders/handleApiError');
      const errorMessage = errorHandler.handleApiError(error);

      // Log detailed error information
      console.error(`LLM API error details: ${errorMessage}`);

      throw new Error(`Failed to parse input using LLM: ${errorMessage}`);
    }
  }

  // (Mock implementation removed)

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
