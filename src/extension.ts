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
      const apiKey = config.get<string>('apiKey');
      const serverTypeString = config.get<string>('serverType', 'stdio');
      const serverType = serverTypeString === 'stdio' ? McpServerType.Stdio : McpServerType.Standard;

      if (!serverUrl) {
        throw new Error('Server URL not configured');
      }

      if (!apiKey) {
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

    const prompt = await vscode.window.showInputBox({
      placeHolder: 'Enter your prompt for the AI',
      prompt: 'What would you like the AI to help you with?'
    });

    if (prompt) {
      try {
        statusBarManager.setProcessing(true);
        const editor = vscode.window.activeTextEditor;
        const document = editor?.document;
        let context = "";

        if (editor && document) {
          // Get current file content for context
          context = document.getText();
        }

        const response = await mcpClient.executePrompt(prompt, context);

        // Display response
        const resultPanel = vscode.window.createWebviewPanel(
          'mcpResult',
          'AI Response',
          vscode.ViewColumn.Two,
          {}
        );

        resultPanel.webview.html = getWebviewContent(prompt, response);
        statusBarManager.setProcessing(false);
      } catch (error) {
        statusBarManager.setProcessing(false);
        vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });

  context.subscriptions.push(connectCommand, executePromptCommand);
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
          body {
              font-family: var(--vscode-font-family);
              padding: 20px;
          }
          .prompt {
              background-color: var(--vscode-editor-background);
              border-left: 4px solid var(--vscode-activityBarBadge-background);
              padding: 10px;
              margin-bottom: 20px;
          }
          .response {
              white-space: pre-wrap;
          }
          pre {
              background-color: var(--vscode-editor-background);
              padding: 10px;
              border-radius: 5px;
              overflow: auto;
          }
      </style>
  </head>
  <body>
      <h3>Prompt:</h3>
      <div class="prompt">${escapeHtml(prompt)}</div>
      <h3>Response:</h3>
      <div class="response">${formatResponse(response)}</div>
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