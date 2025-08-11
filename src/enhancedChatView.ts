import * as vscode from 'vscode';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Enhanced chat view panel with mode toggle options
 */
export class EnhancedChatView {
  private static instance: EnhancedChatView | undefined;
  private panel: vscode.WebviewPanel | undefined;
  private messages: ChatMessage[] = [];
  private sendMessageCallback: ((message: string) => Promise<void>) | undefined;
  private useLlmParser: boolean = true;
  private useContextAware: boolean = true;
  private useCodeSearch: boolean = false;

  /**
   * Get the singleton instance of the EnhancedChatView
   */
  public static getInstance(): EnhancedChatView {
    if (!EnhancedChatView.instance) {
      EnhancedChatView.instance = new EnhancedChatView();
    }
    return EnhancedChatView.instance;
  }

  /**
   * Show the chat panel
   */
  public show(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'mcpChat',
        'MCP AI Chat',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });

      // Handle messages from the webview
      this.panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
          case 'sendMessage':
            if (this.sendMessageCallback) {
              this.addMessage('user', message.text);
              this.sendMessageCallback(message.text);
            }
            break;
          case 'executeCommand':
            if (message.commandId) {
              vscode.commands.executeCommand(message.commandId);
            }
            break;
          case 'toggleLlmParser':
            this.useLlmParser = message.value;
            break;
          case 'toggleContextAware':
            this.useContextAware = message.value;
            break;
          case 'toggleCodeSearch':
            this.useCodeSearch = message.value;
            break;
          case 'clearChat':
            this.clearMessages();
            break;
        }
      });

      this.updateView();
    }
  }

  /**
   * Add a message to the chat
   */
  public addMessage(role: 'user' | 'assistant' | 'system', content: string): void {
    this.messages.push({ role, content });
    if (this.panel) {
      this.updateView();
    }
  }

  /**
   * Check if LLM parser should be used
   */
  public isUsingLlmParser(): boolean {
    return this.useLlmParser;
  }

  /**
   * Check if context-aware mode is enabled
   */
  public isContextAware(): boolean {
    return this.useContextAware;
  }

  /**
   * Check if code search is enabled
   */
  public isCodeSearchEnabled(): boolean {
    return this.useCodeSearch;
  }

  /**
   * Clear all messages
   */
  public clearMessages(): void {
    this.messages = [];
    if (this.panel) {
      this.updateView();
    }
  }

  /**
   * Set the callback for sending messages
   */
  public setSendMessageCallback(callback: (message: string) => Promise<void>): void {
    this.sendMessageCallback = callback;
  }

  /**
   * Check if a send message callback is set
   */
  public hasSendMessageCallback(): boolean {
    return !!this.sendMessageCallback;
  }

  /**
   * Set the processing state (loading indicator)
   */
  public setProcessing(isProcessing: boolean): void {
    if (this.panel) {
      this.panel.webview.postMessage({ command: 'setProcessing', isProcessing });
    }
  }

  /**
   * Update the webview content
   */
  private updateView(): void {
    if (this.panel) {
      this.panel.webview.html = this.getWebviewContent();

      // Automatically scroll to bottom after updating content
      this.panel.webview.postMessage({ command: 'scrollToBottom' });
    }
  }

  /**
   * Get the HTML content for the webview
   */
  private getWebviewContent(): string {
    // Get configuration
    let showRawAssistant = false;
    let showSystemMessages = false;
    
    try {
      showRawAssistant = vscode.workspace.getConfiguration('mcpClient').get('showRawAssistantResponse', false);
      showSystemMessages = vscode.workspace.getConfiguration('mcpClient').get('showSystemMessages', false);
    } catch {}

    // Process messages
    const enhancedMessagesHtml = this.messages.map(message => {
      const isUser = message.role === 'user';
      const isSystem = message.role === 'system';

      // Hide system messages unless explicitly enabled
      if (isSystem && !showSystemMessages) {
        return '';
      }

      if (isSystem) {
        return `
          <div class="message system-message">
            <div class="message-header">System</div>
            <div class="message-content">${this.formatMessageContent(message.content)}</div>
          </div>
        `;
      }

      // Assistant: presenter returns finalized PLAIN TEXT; render through formatter (escapes HTML)
      if (message.role === 'assistant' && !showRawAssistant) {
        const text = typeof message.content === 'string' ? message.content : String(message.content ?? '');
        return `
          <div class="message assistant-message">
            <div class="message-header">Assistant</div>
            <div class="message-content">${this.formatMessageContent(text)}</div>
          </div>
        `;
      }

      // Default (user or assistant raw)
      return `
        <div class="message ${isUser ? 'user-message' : 'assistant-message'}">
          <div class="message-header">${isUser ? 'You' : 'Assistant'}</div>
          <div class="message-content">${this.formatMessageContent(message.content)}</div>
        </div>
      `;
    }).join('');

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MCP AI Chat</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                height: 100vh;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
            }

            .chat-container {
                display: flex;
                flex-direction: column;
                height: 100%;
            }

            .messages-container {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                padding-bottom: 220px; /* reserve space so long tables don't overlap the input area */
                box-sizing: border-box;
                scroll-behavior: smooth;
            }

            /* Make assistant tables responsive and prevent horizontal overflow */
            .assistant-message {
                max-width: 100%;
            }

            .assistant-message .message-content {
                overflow-x: auto; /* allow horizontal scroll if table is wider */
            }

            .assistant-message .message-content table {
                width: 100%;
                border-collapse: collapse;
            }

            .assistant-message .message-content th,
            .assistant-message .message-content td {
                white-space: normal;
                word-break: break-word;
            }

            .input-container {
                display: flex;
                flex-direction: column;
                padding: 10px;
                background-color: var(--vscode-sideBar-background);
                border-top: 1px solid var(--vscode-panel-border);
            }

            .toggle-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 10px;
                padding: 5px;
                background-color: var(--vscode-panel-background);
                border-radius: 4px;
            }

            .toggle-option {
                display: flex;
                align-items: center;
                margin-right: 10px;
                font-size: 12px;
            }

            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 28px;
                height: 16px;
                margin-right: 4px;
            }

            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--vscode-input-background);
                transition: .4s;
                border-radius: 16px;
            }

            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 12px;
                width: 12px;
                left: 2px;
                bottom: 2px;
                background-color: var(--vscode-input-foreground);
                transition: .4s;
                border-radius: 50%;
            }

            input:checked + .toggle-slider {
                background-color: var(--vscode-activityBarBadge-background);
            }

            input:checked + .toggle-slider:before {
                transform: translateX(12px);
            }

            .message-controls {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 8px;
            }

            .clear-button {
                background-color: transparent;
                color: var(--vscode-foreground);
                border: 1px solid var(--vscode-panel-border);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
            }

            .clear-button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .input-row {
                display: flex;
            }

            #message-input {
                flex: 1;
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid var(--vscode-input-border);
                background-color: #282828; /* VS Code gray/dark gray */
                color: var(--vscode-input-foreground);
                font-family: var(--vscode-font-family);
                resize: none;
                min-height: 60px;
                max-height: 200px;
            }

            #send-button {
                margin-left: 8px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                align-self: flex-end;
                height: 60px;
            }

            #send-button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            #send-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .message {
                margin-bottom: 16px;
                padding: 10px;
                border-radius: 6px;
                max-width: 85%;
            }

            .user-message {
                align-self: flex-end;
                background-color: var(--vscode-activityBarBadge-background);
                color: var(--vscode-activityBarBadge-foreground);
                margin-left: auto;
            }

            .assistant-message {
                background-color: var(--vscode-sideBar-background);
                border: 1px solid var(--vscode-panel-border);
                margin-right: auto;
            }

            .system-message {
                background-color: rgba(255, 255, 0, 0.1);
                border: 1px dashed #999;
                margin-right: auto;
                margin-left: auto;
                font-style: italic;
                max-width: 95%;
            }

            .message-header {
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 0.9em;
            }

            .message-content {
                white-space: pre-wrap;
                overflow-wrap: break-word;
            }

            pre {
                background-color: var(--vscode-textCodeBlock-background);
                padding: 8px 12px;
                border-radius: 4px;
                overflow-x: auto;
            }

            code {
                font-family: var(--vscode-editor-font-family);
                font-size: 0.9em;
            }

            .spinner {
                display: none;
                width: 20px;
                height: 20px;
                margin-left: 10px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: var(--vscode-activityBarBadge-background);
                animation: spin 1s ease-in-out infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .processing .spinner {
                display: inline-block;
            }

            .welcome-message {
                text-align: center;
                padding: 20px;
                color: var(--vscode-descriptionForeground);
                font-style: italic;
            }

            .actions-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 5px;
            }

            .action-buttons {
                display: flex;
                gap: 8px;
            }

            .action-button {
                background-color: transparent;
                color: var(--vscode-descriptionForeground);
                border: none;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
            }

            .action-button:hover {
                color: var(--vscode-foreground);
            }

            .action-button svg {
                width: 14px;
                height: 14px;
                margin-right: 4px;
            }
        </style>
    </head>
    <body>
        <div class="chat-container">
            <div class="messages-container" id="messages">
                ${enhancedMessagesHtml || '<div class="welcome-message">Welcome to MCP AI Chat! Configure your preferences below and ask anything about your code...</div>'}
            </div>
            <div class="input-container">
                <div class="toggle-container">
                    <div class="toggle-option">
                        <label class="toggle-switch">
                            <input type="checkbox" id="llm-parser-toggle" ${this.useLlmParser ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                        <span>AI Command Parsing</span>
                    </div>
                    <div class="toggle-option">
                        <label class="toggle-switch">
                            <input type="checkbox" id="context-aware-toggle" ${this.useContextAware ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                        <span>Context-Aware</span>
                    </div>
                    <div class="toggle-option">
                        <label class="toggle-switch">
                            <input type="checkbox" id="code-search-toggle" ${this.useCodeSearch ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                        <span>Code Search</span>
                    </div>
                </div>
                <div class="message-controls">
                    <button class="clear-button" id="clear-chat-button">Clear Chat</button>
                </div>
                <div class="input-row">
                    <textarea id="message-input" placeholder="Ask about your code, request tool commands, or just chat..." rows="2"></textarea>
                    <button id="send-button">Send</button>
                    <div class="spinner" id="spinner"></div>
                </div>
                <div class="actions-row">
                    <div class="action-buttons">
                        <button class="action-button" id="list-tools-button">
                            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                                <path d="M14.5 2h-13l-.5.5v9l.5.5H4v2.5l.854.354L7.707 12H14.5l.5-.5v-9l-.5-.5zm-.5 9H7.5l-.354.146L5 13.293V11.5l-.5-.5H2V3h12v8z"/>
                                <path d="M7 5h4v1H7zm0 2h5v1H7z"/>
                            </svg>
                            List Tools
                        </button>
                        <button class="action-button" id="connect-button">
                            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                                <path d="M15.45 8.695l-2.33-2.33a.51.51 0 00-.72 0 .51.51 0 000 .72l1.485 1.485h-3.31c-.284 0-.514.23-.514.514a.515.515 0 00.514.515h3.31L12.4 11.085a.51.51 0 000 .72.51.51 0 00.72 0l2.33-2.33a.548.548 0 000-.78zM9.78 11.095H6.39L7.95 9.535a.51.51 0 000-.72.51.51 0 00-.72 0l-2.33 2.33a.548.548 0 000 .78l2.33 2.33a.51.51 0 00.72 0 .51.51 0 000-.72L6.39 12.125h3.39a.515.515 0 00.515-.515.515.515 0 00-.515-.515zM10.55 3c0-.245-.2-.445-.445-.445-.245 0-.445.2-.445.445v3.31L8.175 4.825a.51.51 0 00-.72 0 .51.51 0 000 .72l2.33 2.33a.548.548 0 00.78 0l2.33-2.33a.51.51 0 000-.72.51.51 0 00-.72 0L10.55 6.31V3z"/>
                            </svg>
                            Connect
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const messagesContainer = document.getElementById('messages');
            const messageInput = document.getElementById('message-input');
            const sendButton = document.getElementById('send-button');
            const spinner = document.getElementById('spinner');
            const llmParserToggle = document.getElementById('llm-parser-toggle');
            const contextAwareToggle = document.getElementById('context-aware-toggle');
            const codeSearchToggle = document.getElementById('code-search-toggle');
            const clearChatButton = document.getElementById('clear-chat-button');
            const listToolsButton = document.getElementById('list-tools-button');
            const connectButton = document.getElementById('connect-button');

            // Scroll to bottom
            function scrollToBottom() {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            // Send message to extension
            function sendMessage() {
                const text = messageInput.value.trim();
                if (text) {
                    vscode.postMessage({
                        command: 'sendMessage',
                        text
                    });
                    messageInput.value = '';
                    setProcessing(true);
                }
            }

            // Set processing state
            function setProcessing(isProcessing) {
                const inputContainer = document.querySelector('.input-container');
                if (isProcessing) {
                    inputContainer.classList.add('processing');
                    sendButton.disabled = true;
                    messageInput.disabled = true;
                } else {
                    inputContainer.classList.remove('processing');
                    sendButton.disabled = false;
                    messageInput.disabled = false;
                    messageInput.focus();
                }
            }

            // Toggle event handlers
            llmParserToggle.addEventListener('change', () => {
                vscode.postMessage({
                    command: 'toggleLlmParser',
                    value: llmParserToggle.checked
                });
            });

            contextAwareToggle.addEventListener('change', () => {
                vscode.postMessage({
                    command: 'toggleContextAware',
                    value: contextAwareToggle.checked
                });
            });

            codeSearchToggle.addEventListener('change', () => {
                vscode.postMessage({
                    command: 'toggleCodeSearch',
                    value: codeSearchToggle.checked
                });
            });

            // Clear chat
            clearChatButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'clearChat'
                });
            });

            // List tools button
            listToolsButton.addEventListener('click', () => {
                // Use the VSCode command service to execute the list tools command
                vscode.postMessage({
                    command: 'sendMessage',
                    text: 'tool:list_tools'
                });
                setProcessing(true);
            });

            // Connect button
            connectButton.addEventListener('click', () => {
                // This will trigger the connect command in VSCode
                vscode.postMessage({
                    command: 'executeCommand',
                    commandId: 'vscode-mcp-client.connect'
                });
            });

            // Send message when clicking the send button
            sendButton.addEventListener('click', sendMessage);

            // Send message when pressing Enter (Shift+Enter for new line)
            messageInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                }
            });

            // Handle messages from the extension
            window.addEventListener('message', (event) => {
                const message = event.data;
                if (message.command === 'setProcessing') {
                    setProcessing(message.isProcessing);
                } else if (message.command === 'scrollToBottom') {
                    scrollToBottom();
                }
            });

            // Auto-resize textarea
            messageInput.addEventListener('input', () => {
                messageInput.style.height = 'auto';
                messageInput.style.height = (messageInput.scrollHeight) + 'px';
            });

            // Initial scroll to bottom
            scrollToBottom();

            // Focus input on load
            messageInput.focus();
        </script>
    </body>
    </html>`;
  }

  /**
   * Format message content with Markdown-like syntax
   */
  private formatMessageContent(content: string): string {
    // Escape HTML
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Format code blocks
    return escaped
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  }
}
