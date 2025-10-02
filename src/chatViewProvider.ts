import * as vscode from 'vscode';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'miraSidebarChat.chatView';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri,
        vscode.Uri.joinPath(this._extensionUri, 'media'),
        vscode.Uri.joinPath(this._extensionUri, 'out'),
      ],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Listen for messages from the webview (ready for backend connection)
    webviewView.webview.onDidReceiveMessage(async (message) => {
      // No backend logic here; just a placeholder for future message handling
      switch (message.type) {
        case 'newChat':
        case 'sendMessage':
        case 'selectHistory':
        case 'toggleCommand':
        case 'attachFile':
        case 'selectModel':
        case 'selectRole':
        case 'feedback':
          // Ready for backend connection
          break;
      }
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const fs = require('fs');
    const path = require('path');
    const nonce = getNonce();
    const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webview', 'chatSidebar.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Inject CSP nonce and webview resource URIs if needed
    html = html.replace(
      /<meta name="viewport"[^>]*>/,
      `<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' ${webview.cspSource};">`
    );
    // If you want to inject the nonce into <script> tags, add id="mainScript" and replace as needed

    return html;
  }
}

// Utility for CSP nonce
function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}