import type { McpClient } from './mcpClient';

let activeClient: McpClient | null = null;

/**
 * Set the currently active/connected MCP client instance.
 */
export function setActiveClient(client: McpClient | null) {
  activeClient = client;
}

/**
 * Get the currently active/connected MCP client instance.
 */
export function getActiveClient(): McpClient | null {
  return activeClient;
}
