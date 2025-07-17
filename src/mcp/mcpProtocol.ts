/**
 * Model Control Protocol (MCP) message types and interfaces
 */

// Base message interface
export interface McpMessage {
  type: string;
  messageId: string;
  content: any;
}

// Client-to-server prompt message
export interface McpPromptMessage extends McpMessage {
  type: 'prompt';
  content: {
    prompt: string;
    context?: string;
    options?: McpPromptOptions;
  };
}

// Server-to-client response message
export interface McpResponseMessage extends McpMessage {
  type: 'response';
  content: {
    response: string;
    error?: string;
  };
}

// Error message
export interface McpErrorMessage extends McpMessage {
  type: 'error';
  content: {
    error: string;
    code?: string;
  };
}

// Prompt options
export interface McpPromptOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  model?: string;
}

// Stream message for streaming responses
export interface McpStreamMessage extends McpMessage {
  type: 'stream';
  content: {
    delta: string;
    done: boolean;
  };
}
