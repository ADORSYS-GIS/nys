/**
 * JSON-RPC 2.0 helper utilities for MCP communication
 */

// Message ID counter for unique request IDs
let messageIdCounter = 1;

/**
 * Get a new unique message ID for requests
 */
export function getNextMessageId(): number {
  return messageIdCounter++;
}

/**
 * Build a JSON-RPC 2.0 request object
 * @param method The method to call
 * @param params The parameters for the method
 * @returns A properly formatted JSON-RPC request object
 */
export function buildJsonRpcRequest(method: string, params: any = {}): any {
  return {
    jsonrpc: "2.0",
    method,
    params,
    id: getNextMessageId()
  };
}

/**
 * Build a JSON-RPC notification (no response expected)
 * @param method The notification method
 * @param params The parameters for the notification
 * @returns A properly formatted JSON-RPC notification object
 */
export function buildJsonRpcNotification(method: string, params: any = {}): any {
  return {
    jsonrpc: "2.0",
    method,
    params
  };
}

/**
 * Build a tools/call request for the GitHub MCP server
 * @param toolName The name of the tool to call
 * @param args The arguments for the tool
 * @returns A properly formatted tools/call request
 */
export function buildToolCallRequest(toolName: string, args: any = {}): any {
  return buildJsonRpcRequest("tools/call", {
    name: toolName,
    arguments: args
  });
}

/**
 * Build a prompt request for the GitHub MCP server
 * @param promptText The prompt text
 * @param context Optional context for the prompt
 * @returns A properly formatted prompt request
 */
export function buildPromptRequest(promptText: string, context: string = ""): any {
  return buildJsonRpcRequest("prompt", {
    prompt: promptText,
    context: context || ""
  });
}
