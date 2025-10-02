import * as vscode from 'vscode';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Manages the chat view panel for the MCP client
 */
export class ChatView {
  private static instance: ChatView | undefined;
  private panel: vscode.WebviewPanel | undefined;
  private messages: ChatMessage[] = [];
  private sendMessageCallback: ((message: string) => Promise<void>) | undefined;

  /**
   * Get the singleton instance of the ChatView
   */
  public static getInstance(): ChatView {
    if (!ChatView.instance) {
      ChatView.instance = new ChatView();
    }
    return ChatView.instance;
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
        'MCP Chat',
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
        if (message.command === 'sendMessage' && this.sendMessageCallback) {
          this.addMessage('user', message.text);
          this.sendMessageCallback(message.text);
        } else if (message.command === 'restart') {
          // Trigger extension restart (same as Enhanced Chat View)
          vscode.commands.executeCommand('vscode-mcp-client.restartExtension');
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
    // Default implementation - can be overridden by configuration
    return false;
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
    }
  }

  /**
   * Get the HTML content for the webview
   */
  private getWebviewContent(): string {
    const messagesHtml = this.messages.map(message => {
      const isUser = message.role === 'user';
      const isSystem = message.role === 'system';

      if (isSystem) {
        return `
          <div class="message system-message">
            <div class="message-header">System</div>
            <div class="message-content">${this.formatMessageContent(message.content)}</div>
          </div>
        `;
      }

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
        <title>MCP Chat</title>
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
            }

            .input-container {
                display: flex;
                padding: 10px;
                background-color: var(--vscode-sideBar-background);
                border-top: 1px solid var(--vscode-panel-border);
            }

            #message-input {
                flex: 1;
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
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
                background-color: var(--vscode-editorWidget-background);
                border: 1px solid var(--vscode-panel-border);
                color: var(--vscode-foreground);
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
        </style>
    </head>
    <body>
        <div class="chat-container">
            <div class="messages-container" id="messages">
                ${messagesHtml || '<div class="welcome-message">Ask anything about your code...</div>'}
            </div>
            <div class="input-container">
                <textarea id="message-input" placeholder="Type your message..." rows="2"></textarea>
                <button id="send-button">Send</button>
                <button id="restart-button" style="margin-left:8px;background-color:transparent;color:var(--vscode-descriptionForeground);border:none;padding:4px 8px;font-size:12px;cursor:pointer;display:flex;align-items:center;">
                    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" style="width:14px;height:14px;margin-right:4px;">
                        <path d="M8 3V1l-4 3.5L8 8V6c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5h1.5c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5S9.93 6.5 8 6.5V3z"/>
                    </svg>
                    Restart
                </button>
                <div class="spinner" id="spinner"></div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const messagesContainer = document.getElementById('messages');
            const messageInput = document.getElementById('message-input');
            const sendButton = document.getElementById('send-button');
            const spinner = document.getElementById('spinner');
            const restartButton = document.getElementById('restart-button');

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

            // Send message when clicking the send button
            sendButton.addEventListener('click', sendMessage);

            // Restart button
            restartButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'restart'
                });
            });

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
