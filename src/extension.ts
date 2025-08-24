// @ts-ignore

import * as vscode from 'vscode';
import {McpClient, McpServerType} from './mcp/mcpClient';
import { getMergedConfig, hasExternalOverride } from './config/configLoader';
import {StatusBarManager} from './statusBar';

let mcpClient: McpClient;
let statusBarManager: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
  // Log extension configuration for debugging
  const settings = vscode.workspace.getConfiguration('mcpClient');
  const mergedBoot = (getMergedConfig('mcpClient') || {}) as any;
  console.log('Extension activated with configuration:', {
    modelProvider: mergedBoot.modelProvider ?? settings.get('modelProvider'),
    modelName: mergedBoot.modelName ?? settings.get('modelName'),
    serverType: mergedBoot.serverType ?? settings.get('serverType'),
    serverUrl: mergedBoot.serverUrl ?? settings.get('serverUrl')
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
      const merged = (getMergedConfig('mcpClient') || {}) as any;
      const serverUrl = String(merged.serverUrl || '');
      let apiKey = String(merged.apiKey || '');
      const githubToken = String(merged.githubToken || '');
      const serverTypeString = String(merged.serverType || 'stdio');
      const serverType = serverTypeString === 'stdio' ? McpServerType.Stdio : McpServerType.Standard;
      const modelProvider = String(merged.modelProvider || 'openai');
      const modelName = String(merged.modelName || '');

      console.log(`Connecting to MCP server: ${serverUrl}`);
      console.log(`Server type: ${serverTypeString}`);
      console.log(`GitHub token configured: ${githubToken ? 'Yes' : 'No'}`);
      console.log(`Using model provider: ${modelProvider}${modelName ? ` (${modelName})` : ''}`);

      if (!serverUrl) {
        throw new Error('Server URL not configured');
      }

      // Prefer GitHub token automatically in stdio mode (common for GitHub MCP binaries),
      // regardless of the server path string.
      if (serverType === McpServerType.Stdio && githubToken) {
        console.log('Stdio mode: using GitHub token from configuration');
        apiKey = githubToken;
      }

      // Back-compat: also detect explicit github-mcp-server in path
      if ((serverUrl.includes('github-mcp-server') || serverUrl.includes('mcp/github-mcp-server')) && githubToken) {
        console.log('GitHub MCP server detected in path: using GitHub token from configuration');
        apiKey = githubToken;
      }

      // Prefer GitHub token for GitHub Copilot MCP over HTTP(S)
      if (serverType === McpServerType.Standard && githubToken) {
        const urlLower = serverUrl.toLowerCase();
        if (urlLower.includes('githubcopilot.com') || urlLower.endsWith('/mcp') || urlLower.includes('/mcp/')) {
          console.log('Standard mode with Copilot MCP URL: using GitHub token from configuration for Authorization header');
          apiKey = githubToken;
        }
      }

      // If still no key, prompt in stdio mode; otherwise require API key configured
      if (!apiKey) {
        if (serverType === McpServerType.Stdio) {
          const tokenInput = await vscode.window.showInputBox({
            prompt: 'A Personal Access Token is required for this MCP server (stdio mode)',
            placeHolder: 'Enter your token',
            password: true
          });

          if (!tokenInput) {
            throw new Error('A token is required to start the MCP server in stdio mode');
          }

          apiKey = tokenInput;

          const saveToken = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Do you want to save this token in your settings (mcpClient.githubToken)?'
          });

          if (saveToken === 'Yes') {
            await config.update('githubToken', tokenInput, true);
            vscode.window.showInformationMessage('Token saved in settings (mcpClient.githubToken)');
          }
        } else {
          throw new Error('API Key not configured');
        }
      }

      // Debug and ensure Authorization header for Standard HTTP/HTTPS
      try {
        const isHttp = serverType === McpServerType.Standard && (serverUrl.startsWith('http://') || serverUrl.startsWith('https://'));
        const maskedToken = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.slice(-4)}` : '(none)';
        console.log(`[MCP Connect] serverType=${serverTypeString} url=${serverUrl} isHttp=${isHttp}`);
        const tokenSourceLabel = (githubToken && apiKey === githubToken) ? 'githubToken' : 'apiKey';
        console.log(`[MCP Connect] tokenSource=${tokenSourceLabel} token(masked)=${maskedToken}`);
        if (isHttp && apiKey) {
          const authHeader = `Bearer ${apiKey}`;
          const maskedHeader = `Bearer ${apiKey.substring(0, 4)}...${apiKey.slice(-4)}`;
          console.log(`[MCP Connect] Will set Authorization header: ${maskedHeader}`);
          // Provide the header/token to the client if it exposes any of these helpers
          try { (mcpClient as any)?.setAuthHeader?.({ Authorization: authHeader }); } catch {}
          try { (mcpClient as any)?.setBearerToken?.(apiKey); } catch {}
          try { (mcpClient as any)?.setHeaders?.({ Authorization: authHeader }); } catch {}
          // Fallback env variable in case client implementation reads it
          try { (process as any).env.MCP_AUTH_BEARER = apiKey; } catch {}
        }
      } catch (logErr) {
        console.warn('[MCP Connect] Debug/authorization setup error:', logErr);
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
    const { CatalogService } = await import('./tools/catalogService');
    const { PromptRewriter } = await import('./presentation/promptRewriter');

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
      const mergedCfg = (getMergedConfig('mcpClient') || {}) as any;
      let apiKey = (mergedCfg.apiKey as string) || '';
      const githubToken = (mergedCfg.githubToken as string) || '';
      const serverTypeString = (mergedCfg.serverType as string) || 'stdio';
      const serverType = serverTypeString === 'stdio' ? McpServerType.Stdio : McpServerType.Standard;
      const serverUrl = (mergedCfg.serverUrl as string) || '';
      
      if (useLlmParser) {
        const settingsCfg = !hasExternalOverride() ? vscode.workspace.getConfiguration('mcpClient') : undefined;
        const llmApiKey = (mergedCfg.llmApiKey as string) || (settingsCfg ? settingsCfg.get<string>('llmApiKey', '') : '');
        const useMockLlm = (typeof mergedCfg.useMockLlm === 'boolean') ? !!mergedCfg.useMockLlm : (settingsCfg ? settingsCfg.get<boolean>('useMockLlm', true) : true);

        if (!apiKey && !llmApiKey && !useMockLlm) {
          vscode.window.showWarningMessage('LLM parsing is enabled but no API key is configured. Using mock parser instead.');
        }
      }

      // Gather README context only if context-aware toggle is enabled
      let context = "";
      const isContextAware = typeof chatView.isContextAware === 'function' ? chatView.isContextAware() : true;

      if (isContextAware) {
        const { workspace } = await import('vscode');
        const wsFolders = workspace.workspaceFolders;
        let readmeContent = '';
        if (wsFolders && wsFolders.length > 0) {
          try {
            const readmeUri = vscode.Uri.joinPath(wsFolders[0].uri, 'README.md');
            const arr = await workspace.fs.readFile(readmeUri);
            readmeContent = Buffer.from(arr).toString('utf8').slice(0, 8000); // max 8KB
            console.log(`[Context] Read ${readmeContent.length} chars from project README.md`);
          } catch (err) {
            console.warn('[Context] Could not read README.md:', (err as any)?.message || String(err));
          }
        }
        context = readmeContent;
      }

      const parseResult = await inputParser.parseInput(userInput, context);
      let methodNotFoundTriggered = false; // track MethodNotFound to control messaging

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
        } else if (
          serverType === McpServerType.Standard &&
          (serverUrl.startsWith('http://') || serverUrl.startsWith('https://'))
        ) {
          // Remote Standard (HTTP/HTTPS) servers typically expect Authorization: Bearer <GitHub PAT>
          if (githubToken) {
            console.log('Standard HTTP/HTTPS MCP server detected. Using GitHub token as Bearer credential.');
            apiKey = githubToken;
          } else if (!apiKey) {
            // Fall back to asking for a token if no generic API key is set
            const tokenInput = await vscode.window.showInputBox({
              prompt: 'A GitHub Personal Access Token is required for remote MCP servers.',
              placeHolder: 'Enter your GitHub Personal Access Token',
              password: true
            });

            if (!tokenInput) {
              throw new Error('GitHub Personal Access Token is required for remote MCP server');
            }

            apiKey = tokenInput;

            const saveToken = await vscode.window.showQuickPick(['Yes', 'No'], {
              placeHolder: 'Do you want to save this token in your settings as mcpClient.githubToken?'
            });

            if (saveToken === 'Yes') {
              const settingsToUpdate = vscode.workspace.getConfiguration('mcpClient');
              await settingsToUpdate.update('githubToken', tokenInput, true);
              vscode.window.showInformationMessage('GitHub token saved in settings (mcpClient.githubToken)');
            }
          }

          // Validate that the token appears to be a GitHub PAT, not another provider key
          if (apiKey) {
            const looksLikeGoogle = /^AIza[0-9A-Za-z_\-]{10,}$/.test(apiKey);
            const looksLikeOpenAI = /^sk-[0-9A-Za-z]{20,}$/.test(apiKey);
            const looksLikeGitHubPat = /^(github_pat_|ghp_|gho_|ghu_|ghs_|ghr_)/.test(apiKey);

            if (looksLikeGoogle || looksLikeOpenAI) {
              console.error('[MCP Connect] Token format looks like a non-GitHub key (Google/OpenAI). A GitHub PAT is required for remote MCP servers.');
              vscode.window.showErrorMessage('Remote MCP requires a GitHub Personal Access Token (PAT), but a non-GitHub key appears to be configured. Please set "mcpClient.githubToken" to a valid GitHub PAT (starts with "github_pat_" or "ghp_").');
              throw new Error('Invalid token type for remote MCP server (expected GitHub PAT).');
            }

            if (!looksLikeGitHubPat) {
              console.warn('[MCP Connect] Token does not look like a typical GitHub PAT prefix. Continuing, but this may fail with 401.');
            }
          }
      }

      if (parseResult.toolCommand) {
        // Multi-command: parse all tool commands up front
        // Note: parseToolCallFromLlm now returns ToolCommand[]
        let commands: ToolCommand[] = [];
        try {
          // Try to split multiple commands (if parseResult.toolCommand holds them as lines)
          const parseToolCallFromLlm = inputParser['parseToolCallFromLlm']?.bind(inputParser);
          if (typeof parseToolCallFromLlm === 'function') {
            const multiCmds = parseToolCallFromLlm(parseResult.toolCommand);
            if (Array.isArray(multiCmds) && multiCmds.length > 0) {
              commands = multiCmds;
            }
          }
          // Fallback: treat as single command if the above fails
          if (commands.length === 0) {
            const [toolPrefix, ...paramParts] = parseResult.toolCommand.split(' ');
            let toolName = toolPrefix.substring(5).replace(/^_+|_+$/g, '');
            if (toolName.startsWith('github.')) toolName = toolName.substring('github.'.length);
            const params: Record<string, any> = {};
            for (const part of paramParts) {
              const [key, value] = part.split('=');
              if (key && value) {
                if (value === 'true') params[key] = true;
                else if (value === 'false') params[key] = false;
                else if (!isNaN(Number(value))) params[key] = Number(value);
                else params[key] = value;
              }
            }
            commands = [{ name: toolName, params }];
          }
        } catch {
          // Defensive fallback: treat as single command split by space
          const [toolPrefix, ...paramParts] = parseResult.toolCommand.split(' ');
          let toolName = toolPrefix.substring(5).replace(/^_+|_+$/g, '');
          if (toolName.startsWith('github.')) toolName = toolName.substring('github.'.length);
          const params: Record<string, any> = {};
          for (const part of paramParts) {
            const [key, value] = part.split('=');
            if (key && value) {
              if (value === 'true') params[key] = true;
              else if (value === 'false') params[key] = false;
              else if (!isNaN(Number(value))) params[key] = Number(value);
              else params[key] = value;
            }
          }
          commands = [{ name: toolName, params }];
        }

        // Import the toolsHelper dynamically
        const { buildToolCallRequest } = await import('./mcp/jsonRpc');

        // Helper to detect method-not-found from response or error
        const isMethodNotFound = (obj: any): boolean => {
          if (!obj) return false;
          const msg = (obj.error?.message || obj.error || obj.message || obj.toString?.() || '').toString().toLowerCase();
          const code = (obj.code || obj.error?.code || '').toString().toLowerCase();
          return code.includes('methodnotfound') ||
                 msg.includes('method not found') ||
                 msg.includes('unknown tool') ||
                 msg.includes('unknown method') ||
                 msg.includes('tool not found');
        };

        // Sequentially execute commands, abort on failure
        let commandError: any = null;
        let lastResponse: any = undefined;
        for (let i = 0; i < commands.length; ++i) {
          const cmd = commands[i];
          try {
            lastResponse = await mcpClient.sendJsonRpcRequest(
              buildToolCallRequest(cmd.name, cmd.params)
            );
            if (lastResponse && (lastResponse.error || lastResponse?.content?.error)) {
              if (isMethodNotFound(lastResponse.error || lastResponse?.content)) {
                throw lastResponse;
              }
              // Other errors: stop
              commandError = lastResponse;
              break;
            }
          } catch (cmdErr) {
            commandError = cmdErr;
            break;
          }
        }
        if (commandError) {
          // Present friendly error on failure of any step, abort further execution
          response = { error: { message: 'Sorry, an error occurred while executing your command(s). Please check the tool name/parameters and try again.' } };
        } else {
          response = lastResponse;
        }
      } else {
        // If no tool command parsed by LLM, show friendly assistant message and do NOT send prompt/context to the MCP server.
        chatView.addMessage('assistant', 'Sorry, I could not generate actionable tool commands for your request. Please rephrase or try a more specific instruction.');
        statusBarManager.setProcessing(false);
        chatView.setProcessing(false);
        return;
      }

      // Present the response via LLM into user-friendly HTML
      let toolForPresentation = 'generic';
      if (parseResult.toolCommand) {
        try {
          const [tp] = parseResult.toolCommand.split(' ');
          toolForPresentation = tp.startsWith('tool:') ? tp.substring(5) : 'generic';
        } catch {}
      }
      // If the response is an error object, convert it to a readable plain text summary first
      let effectiveResponse: any = response;
      if (response && (response.error || response?.content?.error)) {
        const errObj = response.error || response?.content?.error || response?.content;
        effectiveResponse = {
          error: true,
          message: errObj?.message || errObj || 'Unknown server error',
          code: errObj?.code
        };
      }

      // If MethodNotFound occurred and we still have an error, return a short friendly message
      let presentedText: string;
      if (methodNotFoundTriggered && effectiveResponse && effectiveResponse.error) {
        presentedText = "Sorry, I can’t help with that.";
      } else {
        presentedText = await LlmPresenter.present(toolForPresentation, effectiveResponse, userInput);
      }

      // Add the assistant's response (plain text) to the chat
      chatView.addMessage('assistant', presentedText);

      statusBarManager.setProcessing(false);
      chatView.setProcessing(false);
    } catch (error) {
      statusBarManager.setProcessing(false);
      chatView.setProcessing(false);

      // Build a user-friendly assistant message instead of throwing raw errors
      let rawMessage: string = '';
      let statusCode: any = undefined;
      let details: any = undefined;

      if (error && typeof error === 'object') {
        const errObj: any = error;
        statusCode = errObj.status ?? errObj.code;
        rawMessage =
          errObj.message ??
          (errObj.response && errObj.response.statusText) ??
          (errObj.error && errObj.error.message) ??
          (error instanceof Error ? error.message : String(error));
        details = errObj.details ?? errObj.data ?? errObj.response?.data;
      } else {
        rawMessage = String(error);
      }

      const normalized = (rawMessage || '').toLowerCase();

      // Heuristics for common MCP errors
      const isMethodNotFound =
        normalized.includes('method not found') || normalized.includes('-32601');

      const isInvalidParams =
        normalized.includes('invalid params') || normalized.includes('-32602');

      const isAuth =
        normalized.includes('unauthorized') ||
        normalized.includes('forbidden') ||
        normalized.includes('401') ||
        normalized.includes('403');

      const isRateLimit =
        normalized.includes('rate limit') || normalized.includes('429');

      const isNotFound =
        normalized.includes('not found') || normalized.includes('404');

      let friendly = 'I can’t help with that request right now.\n\n';

      friendly += `Server reported: ${rawMessage || 'Unknown error'}${statusCode ? ` (code: ${statusCode})` : ''}.\n\n`;

      friendly += 'Possible causes:\n';
      if (isMethodNotFound) {
        friendly += '- The tool name may be incorrect or not supported by the server.\n';
      }
      if (isInvalidParams) {
        friendly += '- One or more parameters are missing or have invalid values.\n';
      }
      if (isAuth) {
        friendly += '- Authentication/authorization failed (token missing or insufficient scopes).\n';
      }
      if (isRateLimit) {
        friendly += '- Rate limits were exceeded.\n';
      }
      if (isNotFound) {
        friendly += '- The requested resource or endpoint was not found.\n';
      }
      if (!isMethodNotFound && !isInvalidParams && !isAuth && !isRateLimit && !isNotFound) {
        friendly += '- Server rejected the request or encountered an internal error.\n';
      }

      friendly += '\nWhat you can try:\n';
      friendly += '- Run "List Tools" to see available tool names and parameters.\n';
      friendly += '- Check your tool command and parameter names/values.\n';
      friendly += '- Ensure your token is set and has the right permissions.\n';
      friendly += '- Try again later if you hit a rate limit.\n';

      // Include minimal diagnostics for development
      if (details) {
        try {
          const snippet = JSON.stringify(details);
          if (snippet && snippet !== '{}') {
            friendly += '\nDetails (for reference): ';
            friendly += snippet.length > 500 ? snippet.slice(0, 500) + '…' : snippet;
          }
        } catch {
          // ignore
        }
      }

      // Show friendly message in the chat instead of a backend error
      chatView.addMessage('assistant', friendly);
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
