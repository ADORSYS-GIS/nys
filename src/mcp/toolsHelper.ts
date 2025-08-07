/**
 * Helper functions for working with GitHub MCP server tools
 */
import { McpClient } from './mcpClient';
import { buildToolCallRequest } from './jsonRpc';

/**
 * List all available tools on the GitHub MCP server
 * @param client Connected McpClient instance
 * @returns Promise resolving to the list of available tools
 */
export async function listTools(client: McpClient): Promise<any> {
  if (!client.isConnected()) {
    throw new Error('Not connected to MCP server');
  }

  const toolsRequest = buildToolCallRequest('list_tools', {});
  return client.sendJsonRpcRequest(toolsRequest);
}

/**
 * List issues in a GitHub repository
 * @param client Connected McpClient instance
 * @param owner Repository owner/organization
 * @param repo Repository name
 * @param state Issue state ('open', 'closed', 'all')
 * @param limit Maximum number of issues to return
 * @returns Promise resolving to the list of issues
 */
export async function listIssues(
  client: McpClient, 
  owner: string, 
  repo: string, 
  state: string = 'open', 
  limit: number = 10
): Promise<any> {
  if (!client.isConnected()) {
    throw new Error('Not connected to MCP server');
  }

  const listIssuesRequest = buildToolCallRequest('list_issues', {
    owner,
    repo,
    state,
    limit
  });

  return client.sendJsonRpcRequest(listIssuesRequest);
}

/**
 * Get repository information
 * @param client Connected McpClient instance
 * @param owner Repository owner/organization
 * @param repo Repository name
 * @returns Promise resolving to the repository information
 */
export async function getRepository(
  client: McpClient,
  owner: string,
  repo: string
): Promise<any> {
  if (!client.isConnected()) {
    throw new Error('Not connected to MCP server');
  }

  const getRepoRequest = buildToolCallRequest('get_repository', {
    owner,
    repo
  });

  return client.sendJsonRpcRequest(getRepoRequest);
}
