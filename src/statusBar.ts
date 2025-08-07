import * as vscode from 'vscode';

/**
 * Manages the status bar items for the MCP client
 */
export class StatusBarManager {
  private connectionStatusItem: vscode.StatusBarItem;
  private processingStatusItem: vscode.StatusBarItem;

  constructor() {
    // Create the connection status item
    this.connectionStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.connectionStatusItem.command = 'vscode-mcp-client.openChatView';
    this.setConnected(false);
    this.connectionStatusItem.show();

    // Create the processing status item
    this.processingStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    this.setProcessing(false);
  }

  /**
   * Update the connection status
   */
  public setConnected(connected: boolean, serverUrl?: string): void {
    if (connected && serverUrl) {
      this.connectionStatusItem.text = `$(check) MCP Connected: ${serverUrl}`;
      this.connectionStatusItem.tooltip = `Connected to MCP server at ${serverUrl}`;
    } else {
      this.connectionStatusItem.text = '$(comment-discussion) Chat with AI';
      this.connectionStatusItem.tooltip = 'Connect to MCP server';
    }
  }

  /**
   * Update the processing status
   */
  public setProcessing(isProcessing: boolean): void {
    if (isProcessing) {
      this.processingStatusItem.text = '$(sync~spin) Processing AI request...';
      this.processingStatusItem.show();
    } else {
      this.processingStatusItem.hide();
    }
  }

  /**
   * Dispose of the status bar items
   */
  public dispose(): void {
    this.connectionStatusItem.dispose();
    this.processingStatusItem.dispose();
  }
}
