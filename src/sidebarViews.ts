import * as vscode from 'vscode';

// --- Planner Sidebar View Provider ---
export class PlannerWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'mcpPlanner';
  private _view?: vscode.WebviewView;
  // In-memory tasks for UI demo
  private _tasks: { label: string; done: boolean }[] = [
    { label: "Design UI for Planner", done: false },
    { label: "Implement checklist interactivity", done: false },
    { label: "Test live updates", done: false }
  ];

  constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage((msg) => {
      if (msg.command === 'toggleTask' && typeof msg.index === 'number') {
        this._tasks[msg.index].done = !this._tasks[msg.index].done;
        this.update();
      }
    });
  }

  private update() {
    if (this._view) {
      this._view.webview.html = this.getHtml();
    }
  }

  private getHtml(): string {
    const checklistHtml = this._tasks
      .map(
        (task, i) => `
        <label class="task-item">
          <input type="checkbox" data-index="${i}" ${task.done ? "checked" : ""}/>
          <span class="${task.done ? "done" : ""}">${this.escapeHtml(task.label)}</span>
        </label>
      `
      )
      .join('');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Planner</title>
  <style>
    body { font-family: var(--vscode-font-family); margin: 0; padding: 0; color: var(--vscode-foreground); background: var(--vscode-editor-background);}
    .container { padding: 16px; }
    .title { font-size: 1.2em; font-weight: bold; margin-bottom: 8px; }
    .checklist { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
    .task-item { display: flex; align-items: center; font-size: 1em; }
    .task-item input[type="checkbox"] { margin-right: 8px; }
    .done { text-decoration: line-through; color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">Planner Checklist</div>
    <div class="checklist" id="checklist">
      ${checklistHtml}
    </div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('.task-item input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        vscode.postMessage({ command: 'toggleTask', index: idx });
      });
    });
  </script>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;');
  }
}

// --- Terminal Sidebar View Provider ---
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

export class TerminalWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'mcpTerminal';
  private _view?: vscode.WebviewView;
  private _terminalProcess?: ChildProcessWithoutNullStreams;
  private _terminalBuffer: string[] = [];
  private _isDisposed = false;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml();

    // Start persistent shell process if not already started
    if (!this._terminalProcess) {
      this.startTerminalProcess();
    }

    // Send initial buffer if any
    setTimeout(() => {
      this.flushTerminalBuffer();
    }, 100);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage((msg) => {
      if (msg.command === 'sendCommand' && typeof msg.text === 'string') {
        this.sendToTerminal(msg.text);
      }
    });

    // Clean up on dispose
    webviewView.onDidDispose(() => {
      this.disposeTerminal();
    });
  }

  private startTerminalProcess() {
    // Use user's default shell
    const shell = process.env.SHELL || (process.platform === 'win32' ? 'cmd.exe' : '/bin/bash');
    this._terminalProcess = spawn(shell, [], { stdio: 'pipe' });

    this._terminalProcess.stdout.on('data', (data: Buffer) => {
      this.appendTerminalOutput(data.toString());
    });
    this._terminalProcess.stderr.on('data', (data: Buffer) => {
      this.appendTerminalOutput(data.toString());
    });
    this._terminalProcess.on('close', (code) => {
      this.appendTerminalOutput(`\n[Process exited with code ${code}]\n`);
    });
  }

  private sendToTerminal(text: string) {
    if (this._terminalProcess && !this._terminalProcess.killed) {
      this._terminalProcess.stdin.write(text + '\n');
    }
  }

  private appendTerminalOutput(data: string) {
    this._terminalBuffer.push(data);
    if (this._view) {
      this._view.webview.postMessage({ command: 'terminalOutput', data });
    }
  }

  private flushTerminalBuffer() {
    if (this._view && this._terminalBuffer.length > 0) {
      this._view.webview.postMessage({ command: 'terminalOutput', data: this._terminalBuffer.join('') });
      this._terminalBuffer = [];
    }
  }

  private disposeTerminal() {
    this._isDisposed = true;
    if (this._terminalProcess && !this._terminalProcess.killed) {
      this._terminalProcess.kill();
    }
    this._terminalProcess = undefined;
    this._terminalBuffer = [];
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Terminal</title>
  <style>
    body { font-family: var(--vscode-font-family); margin: 0; padding: 0; color: var(--vscode-foreground); background: var(--vscode-editor-background);}
    .container { display: flex; flex-direction: column; height: 100vh; padding: 0; }
    .title { font-size: 1.2em; font-weight: bold; margin: 16px 0 8px 16px; }
    .terminal-output { flex: 1; background: #181818; color: #e0e0e0; font-family: monospace; padding: 12px; overflow-y: auto; border-radius: 6px; margin: 0 16px 8px 16px; min-height: 200px; }
    .input-row { display: flex; margin: 0 16px 16px 16px; }
    #terminal-input { flex: 1; padding: 8px 12px; border-radius: 4px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); font-family: monospace;}
    #send-command { margin-left: 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;}
    #send-command:hover { background: var(--vscode-button-hoverBackground);}
  </style>
</head>
<body>
  <div class="container">
    <div class="title">Terminal</div>
    <div class="terminal-output" id="terminal-output"></div>
    <div class="input-row">
      <input id="terminal-input" type="text" placeholder="Type a command and press Enter..." autocomplete="off"/>
      <button id="send-command">Send</button>
    </div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const outputDiv = document.getElementById('terminal-output');
    const inputBox = document.getElementById('terminal-input');
    const sendBtn = document.getElementById('send-command');

    function appendOutput(text) {
      outputDiv.textContent += text;
      outputDiv.scrollTop = outputDiv.scrollHeight;
    }

    sendBtn.addEventListener('click', sendCommand);
    inputBox.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        sendCommand();
      }
    });

    function sendCommand() {
      const text = inputBox.value.trim();
      if (text) {
        vscode.postMessage({ command: 'sendCommand', text });
        inputBox.value = '';
      }
    }

    window.addEventListener('message', (event) => {
      if (event.data.command === 'terminalOutput') {
        appendOutput(event.data.data);
      }
    });

    // Focus input on load
    inputBox.focus();
  </script>
</body>
</html>`;
  }
}