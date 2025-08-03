import * as vscode from 'vscode';
import {McpClient, McpServerType} from './mcp/mcpClient';
import {StatusBarManager} from './statusBar';

let mcpClient: McpClient;
let statusBarManager: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
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

      console.log(`Connecting to MCP server: ${serverUrl}`);
      console.log(`Server type: ${serverTypeString}`);
      console.log(`GitHub token configured: ${githubToken ? 'Yes' : 'No'}`);

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

    // Ask the user for natural language input ("prompt")
    const userInput = await vscode.window.showInputBox({
      placeHolder: 'Describe what you want to do or use "tool:name" format (e.g., "tool:list_issues owner=github repo=github-mcp-server")',
      prompt: 'What would you like the AI to help you with?'
    });

    if (!userInput) return;

    try {
      statusBarManager.setProcessing(true);
      let response;

      // Check if this is a tool command using the tool:name format
      if (userInput.startsWith('tool:')) {
        // Parse the tool command format: tool:name param1=value1 param2=value2
        const [toolPrefix, ...paramParts] = userInput.split(' ');
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

        if (editor && document) {
          // Get current file contents for natural context
          context = document.getText();
        }

        response = await mcpClient.executePrompt(userInput, context);
      }

      // Display response (for both tool calls and prompts)
      const resultPanel = vscode.window.createWebviewPanel(
        'mcpResult',
        'AI Response',
        vscode.ViewColumn.Two,
        {
          retainContextWhenHidden: true
        }
      );

      // Set panel dimensions to occupy 10% vertical space on right side
      const columnSize = vscode.window.activeTextEditor?.visibleRanges[0]?.end.line || 100;
      const panelHeight = Math.floor(columnSize * 0.1); // 10% of editor height

      resultPanel.webview.html = getWebviewContent(userInput, typeof response === 'string' ? response : JSON.stringify(response, null, 2));
      statusBarManager.setProcessing(false);
    } catch (error) {
      statusBarManager.setProcessing(false);
      vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
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

      // Display the tools list
      const resultPanel = vscode.window.createWebviewPanel(
        'mcpTools',
        'Available MCP Tools',
        vscode.ViewColumn.Two,
        { retainContextWhenHidden: true }
      );

      // Format the tools list as HTML
      const toolsHtml = formatToolsList(response);
      resultPanel.webview.html = toolsHtml;

      statusBarManager.setProcessing(false);
    } catch (error) {
      statusBarManager.setProcessing(false);
      vscode.window.showErrorMessage(`Error fetching tools: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  context.subscriptions.push(connectCommand, executePromptCommand, listToolsCommand);
}

export function deactivate() {
  if (mcpClient) {
    mcpClient.disconnect();
  }
  if (statusBarManager) {
    statusBarManager.dispose();
  }
}

function getWebviewContent(prompt: string, response: string): string {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Response</title>
      <style>
          html, body {
              height: 100%;
              margin: 0;
              overflow: hidden;
          }
          body {
              font-family: var(--vscode-font-family);
              padding: 10px;
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
              width: 100%;
              height: 100vh;
              position: fixed;
              right: 0;
              top: 0;
          }
          .prompt {
              background-color: var(--vscode-editor-background);
              border-left: 4px solid var(--vscode-activityBarBadge-background);
              padding: 8px;
              margin-bottom: 12px;
              font-size: 0.9em;
              overflow-x: auto;
          }
          .response {
              white-space: pre-wrap;
              overflow-y: auto;
              flex: 1;
              font-size: 0.9em;
          }
          pre {
              background-color: var(--vscode-editor-background);
              padding: 8px;
              border-radius: 4px;
              overflow: auto;
              font-size: 0.9em;
          }
          .container {
              display: flex;
              flex-direction: column;
              height: 100%;
              overflow: hidden;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h3 style="margin-top: 0; font-size: 0.9em;">Prompt:</h3>
          <div class="prompt">${escapeHtml(prompt)}</div>
          <h3 style="margin-top: 8px; font-size: 0.9em;">Response:</h3>
          <div class="response">${formatResponse(response)}</div>
      </div>
  </body>
  </html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatResponse(text: string): string {
  // Simple Markdown-like formatting for code blocks
  return escapeHtml(text)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
}

function formatToolsList(tools: any): string {
  let toolsHtml = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Available MCP Tools</title>
      <style>
          body {
              font-family: var(--vscode-font-family);
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
          }
          .tool {
              background-color: var(--vscode-editor-background);
              border-left: 4px solid var(--vscode-activityBarBadge-background);
              padding: 12px;
              margin-bottom: 16px;
          }
          .tool-name {
              font-weight: bold;
              color: var(--vscode-activityBarBadge-background);
          }
          .tool-description {
              margin: 8px 0;
          }
          .param {
              margin-left: 16px;
              font-family: monospace;
          }
          .param-name {
              color: var(--vscode-symbolIcon-propertyForeground);
          }
          .param-type {
              color: var(--vscode-symbolIcon-typeParameterForeground);
              font-style: italic;
          }
          h1 {
              border-bottom: 1px solid var(--vscode-panel-border);
              padding-bottom: 8px;
          }
          .usage {
              background-color: var(--vscode-textBlockQuote-background);
              padding: 12px;
              border-radius: 4px;
              margin-top: 8px;
              font-family: monospace;
          }
      </style>
  </head>
  <body>
      <h1>Available MCP Tools</h1>
      <p>Use these tools with the <code>tool:</code> prefix in the execute prompt command.</p>`;

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