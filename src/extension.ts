// @ts-ignore

import * as vscode from 'vscode';
import {McpClient, McpServerType} from './mcp/mcpClient';
import {StatusBarManager} from './statusBar';

let mcpClient: McpClient;
let statusBarManager: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
  // Log extension configuration for debugging
  const config = vscode.workspace.getConfiguration('mcpClient');
  console.log('Extension activated with configuration:', {
    modelProvider: config.get('modelProvider'),
    modelName: config.get('modelName'),
    serverType: config.get('serverType'),
    serverUrl: config.get('serverUrl')
  });

  console.log('Activating MCP Client extension');

  // Initialize the status bar
  statusBarManager = new StatusBarManager();

  // Initialize the MCP client
  mcpClient = new McpClient();

  // Register commands
  let connectCommand = vscode.commands.registerCommand('vscode-mcp-client.connect', async () => {
    try {
      const config = vscode.workspace.getConfiguration('mcpClient');
      const serverUrl = config.get<string>('serverUrl');
      let apiKey = config.get<string>('apiKey', '');
      const githubToken = config.get<string>('githubToken', '');
      const serverTypeString = config.get<string>('serverType', 'stdio');
      const serverType = serverTypeString === 'stdio' ? McpServerType.Stdio : McpServerType.Standard;
      const modelProvider = config.get<string>('modelProvider', 'openai');
      const modelName = config.get<string>('modelName', '');

      console.log(`Connecting to MCP server: ${serverUrl}`);
      console.log(`Server type: ${serverTypeString}`);
      console.log(`GitHub token configured: ${githubToken ? 'Yes' : 'No'}`);
      console.log(`Using model provider: ${modelProvider}${modelName ? ` (${modelName})` : ''}`);

      if (!serverUrl) {
        throw new Error('Server URL not configured');
      }

      // Check if we need to use the GitHub token instead of API key
      if (serverUrl.includes('github-mcp-server') || serverUrl.includes('mcp/github-mcp-server')) {
        console.log('GitHub MCP server detected');

        // Use the GitHub token if available
        if (githubToken) {
          console.log('Using GitHub token from settings');
          apiKey = githubToken;
        } else if (!apiKey) {
          // Prompt for GitHub token if neither token nor API key is configured
          const tokenInput = await vscode.window.showInputBox({
            prompt: 'GitHub Personal Access Token is required for github-mcp-server',
            placeHolder: 'Enter your GitHub Personal Access Token',
            password: true // Hide the token as it's typed
          });

          if (!tokenInput) {
            throw new Error('GitHub Personal Access Token is required for github-mcp-server');
          }

          apiKey = tokenInput;

          // Ask if the user wants to save the token in settings
          const saveToken = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Do you want to save this token in your settings?'
          });

          if (saveToken === 'Yes') {
            await config.update('githubToken', tokenInput, true);
            vscode.window.showInformationMessage('GitHub token saved in settings');
          }
        }
      } else if (!apiKey) {
        throw new Error('API Key not configured');
      }

      await mcpClient.connect(serverUrl, apiKey, serverType);
      statusBarManager.setConnected(true, serverUrl);
      vscode.window.showInformationMessage(`Connected to MCP server at ${serverUrl}`);
    } catch (error) {
      statusBarManager.setConnected(false);
      vscode.window.showErrorMessage(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  let executePromptCommand = vscode.commands.registerCommand('vscode-mcp-client.executePrompt', async () => {
    if (!mcpClient.isConnected()) {
      vscode.window.showErrorMessage('Not connected to MCP server. Please connect first.');
      return;
    }

    // Import the EnhancedChatView class
    const { EnhancedChatView } = await import('./enhancedChatView');
    const chatView = EnhancedChatView.getInstance();

    // Setup the send message callback - use the processPrompt command for consistent handling
    chatView.setSendMessageCallback(async (userInput: string) => {
      await vscode.commands.executeCommand('vscode-mcp-client.processPrompt', userInput);
    });

    // Show the chat view
    chatView.show();
  });

  // Command to list available tools from the server
  let listToolsCommand = vscode.commands.registerCommand('vscode-mcp-client.listTools', async () => {
    if (!mcpClient.isConnected()) {
      vscode.window.showErrorMessage('Not connected to MCP server. Please connect first.');
      return;
    }

    try {
      statusBarManager.setProcessing(true);

      // Import toolsHelper dynamically
      const { buildToolCallRequest } = await import('./mcp/jsonRpc');
      const toolsListRequest = buildToolCallRequest('list_tools', {});

      const response = await mcpClient.sendJsonRpcRequest(toolsListRequest);

      // Import the EnhancedChatView class and InputParser
      const { EnhancedChatView } = await import('./enhancedChatView');
      const { InputParser } = await import('./parsers/inputParser');
      const { LlmPresenter } = await import('./presentation/llmPresenter');

      const chatView = EnhancedChatView.getInstance();
      const inputParser = InputParser.getInstance();

      // Update the input parser with available tools
      if (Array.isArray(response)) {
        inputParser.setAvailableTools(response);
      } else if (response.tools && Array.isArray(response.tools)) {
        inputParser.setAvailableTools(response.tools);
      }

      // Present the tools list with the LLM presenter as an HTML table
      const html = await LlmPresenter.present('list_tools', response, 'List available tools');

      // Add the response to the chat as HTML
      chatView.addMessage('assistant', html);
      chatView.show();

      statusBarManager.setProcessing(false);
      chatView.setProcessing(false);
    } catch (error) {
      statusBarManager.setProcessing(false);
      vscode.window.showErrorMessage(`Error fetching tools: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register command to directly open the chat view
  let openChatViewCommand = vscode.commands.registerCommand('vscode-mcp-client.openChatView', async () => {
    // Import the EnhancedChatView class
    const { EnhancedChatView } = await import('./enhancedChatView');
    const chatView = EnhancedChatView.getInstance();

    // If not connected yet, trigger the connect command first
    if (!mcpClient.isConnected()) {
      await vscode.commands.executeCommand('vscode-mcp-client.connect');
    }

    if (mcpClient.isConnected()) {
      // Setup the send message callback if not already set
      if (!chatView.hasSendMessageCallback()) {
        chatView.setSendMessageCallback(async (userInput: string) => {
          await vscode.commands.executeCommand('vscode-mcp-client.processPrompt', userInput);
        });
      }

      // Show the chat view
      chatView.show();
    }
  });

  // Register a command to process prompts (used internally)
  let processPromptCommand = vscode.commands.registerCommand('vscode-mcp-client.processPrompt', async (userInput: string) => {
    if (!mcpClient.isConnected()) {
      vscode.window.showErrorMessage('Not connected to MCP server. Please connect first.');
      return;
    }

    const { EnhancedChatView } = await import('./enhancedChatView');
    const { InputParser } = await import('./parsers/inputParser');
    const { LlmPresenter } = await import('./presentation/llmPresenter');

    const chatView = EnhancedChatView.getInstance();
    const inputParser = InputParser.getInstance();

    try {
      statusBarManager.setProcessing(true);
      chatView.setProcessing(true);
      let response;

      // Try to parse the input as a tool command if it's not already in that format
      // Default to false if method doesn't exist (for backward compatibility)
      const useLlmParser = typeof chatView.isUsingLlmParser === 'function' ? chatView.isUsingLlmParser() : false;

      // If LLM parser is enabled, ensure we have an API key
      if (useLlmParser) {
        const config = vscode.workspace.getConfiguration('mcpClient');
        const apiKey = config.get<string>('apiKey', '');
        const llmApiKey = config.get<string>('llmApiKey', '');
        const useMockLlm = config.get<boolean>('useMockLlm', true);

        if (!apiKey && !llmApiKey && !useMockLlm) {
          vscode.window.showWarningMessage('LLM parsing is enabled but no API key is configured. Using mock parser instead.');
        }
      }

      const parseResult = await inputParser.parseInput(userInput, useLlmParser);

      // If LLM was used, add a system message to inform the user
      if (parseResult.wasLlmUsed) {
        // Check if the ChatView supports system messages
        if (typeof chatView.addMessage === 'function') {
          try {
            chatView.addMessage('system', `Input was parsed using LLM into: ${parseResult.toolCommand}`);
          } catch (error) {
            // Fallback to assistant message if system is not supported
            chatView.addMessage('assistant', `Note: Input was parsed using LLM into: ${parseResult.toolCommand}`);
          }
        }
      }

      if (parseResult.toolCommand) {
        // Parse the tool command format: tool:name param1=value1 param2=value2
        const [toolPrefix, ...paramParts] = parseResult.toolCommand.split(' ');
        const toolName = toolPrefix.substring(5); // Remove 'tool:' prefix

        // Parse parameters from the format param=value
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

        // Import the toolsHelper dynamically
        const { buildToolCallRequest } = await import('./mcp/jsonRpc');
        // Send the tool call request
        response = await mcpClient.sendJsonRpcRequest(
          buildToolCallRequest(toolName, params)
        );
      } else {
        // Regular prompt
        const editor = vscode.window.activeTextEditor;
        const document = editor?.document;
        let context = "";

        // Check if context-aware mode is enabled
        const isContextAware = typeof chatView.isContextAware === 'function' ? chatView.isContextAware() : true;

        if (isContextAware && editor && document) {
          // Get current file contents for natural context
          context = document.getText();
        }

        // Check if code search is enabled
        const useCodeSearch = typeof chatView.isCodeSearchEnabled === 'function' ? chatView.isCodeSearchEnabled() : false;

        if (useCodeSearch) {
          // TODO: Implement code search across the workspace
          // This would search for relevant code snippets related to the query
          // For now, we'll add a system message indicating this feature is coming soon
          chatView.addMessage('system', 'Code search functionality will be available in a future update.');
        }

        response = await mcpClient.executePrompt(userInput, context);
      }

      // Present the response via LLM into user-friendly HTML
      let toolForPresentation = 'generic';
      if (parseResult.toolCommand) {
        try {
          const [tp] = parseResult.toolCommand.split(' ');
          toolForPresentation = tp.startsWith('tool:') ? tp.substring(5) : 'generic';
        } catch {}
      }
      let presentedHtml = await LlmPresenter.present(toolForPresentation, response, userInput);

      // Add the assistant's response (HTML) to the chat
      chatView.addMessage('assistant', presentedHtml);

      statusBarManager.setProcessing(false);
      chatView.setProcessing(false);
    } catch (error) {
      statusBarManager.setProcessing(false);
      chatView.setProcessing(false);
      vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  context.subscriptions.push(connectCommand, executePromptCommand, listToolsCommand, openChatViewCommand, processPromptCommand);
}

export function deactivate() {
  if (mcpClient) {
    mcpClient.disconnect();
  }
  if (statusBarManager) {
    statusBarManager.dispose();
  }
}

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats tools data into HTML for display
 */
function formatToolsToHtml(tools: any): string {
  let toolsHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; padding: 10px; }
      .tool { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
      .tool-name { font-weight: bold; font-size: 16px; }
      .tool-description { margin: 5px 0; color: #555; }
      .params { margin-top: 10px; }
      .param { margin-left: 15px; margin-top: 5px; }
      .param-name { font-weight: bold; }
      .param-type { color: #666; margin-left: 5px; }
      .required { color: red; margin-left: 5px; }
      .usage-title { margin-top: 10px; }
      .usage { font-family: monospace; background-color: #f5f5f5; padding: 5px; margin-top: 5px; }
    </style>
  </head>
  <body>
  <h1>Available Tools</h1>
  `;

  // Check if tools is an array
  if (Array.isArray(tools)) {
    tools.forEach(tool => {
      toolsHtml += `
      <div class="tool">
          <div class="tool-name">${escapeHtml(tool.name || 'Unnamed Tool')}</div>
          <div class="tool-description">${escapeHtml(tool.description || 'No description available')}</div>
          <div class="params"><strong>Parameters:</strong></div>`;

      // Add parameters if available
      if (tool.parameters && Array.isArray(tool.parameters)) {
        tool.parameters.forEach((param: any) => {
          toolsHtml += `
          <div class="param">
              <span class="param-name">${escapeHtml(param.name || '')}</span>
              <span class="param-type">(${escapeHtml(param.type || 'any')})</span>
              ${param.required ? '<span class="required">required</span>' : ''}
              ${param.description ? `: ${escapeHtml(param.description)}` : ''}
          </div>`;
        });
      } else {
        toolsHtml += `<div class="param">No parameters</div>`;
      }

      // Add usage example
      toolsHtml += `
      <div class="usage-title"><strong>Example Usage:</strong></div>
      <div class="usage">tool:${escapeHtml(tool.name)}`;

      // Add example parameter values
      if (tool.parameters && Array.isArray(tool.parameters)) {
        tool.parameters.forEach((param: any) => {
          if (param.name) {
            toolsHtml += ` ${escapeHtml(param.name)}=value`;
          }
        });
      }

      toolsHtml += `</div>
      </div>`;
    });
  } else {
    // If tools is not an array but an object with tools property
    if (tools && tools.tools && Array.isArray(tools.tools)) {
      tools.tools.forEach((tool: any) => {
        toolsHtml += `
        <div class="tool">
            <div class="tool-name">${escapeHtml(tool.name || 'Unnamed Tool')}</div>
            <div class="tool-description">${escapeHtml(tool.description || 'No description available')}</div>
            <div class="usage-title"><strong>Example Usage:</strong></div>
            <div class="usage">tool:${escapeHtml(tool.name)} param1=value1 param2=value2</div>
        </div>`;
      });
    } else {
      toolsHtml += `<p>No tools found or unknown format. Raw response:</p>
      <pre>${JSON.stringify(tools, null, 2)}</pre>`;
    }
  }

  toolsHtml += `
  </body>
  </html>`;

  return toolsHtml;
}
