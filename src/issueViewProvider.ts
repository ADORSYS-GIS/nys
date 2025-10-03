import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface Issue {
  id: string;
  title: string;
  description: string;
  mode: 'design' | 'build' | 'debug';
  status: 'open' | 'in-progress' | 'completed' | 'blocked';
  todos: Todo[];
  createdAt: Date;
  updatedAt: Date;
  filePath: string;
}

export interface Todo {
  id: string;
  content: string;
  completed: boolean;
  createdAt: Date;
}

export class IssueViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'miraSidebarChat.issueView';
  private _view?: vscode.WebviewView;
  private _issues: Issue[] = [];
  private _currentIssue: Issue | null = null;
  private _nysFolder: vscode.Uri | null = null;

  constructor(private readonly _extensionUri: vscode.Uri) {
    this.initializeNysFolder();
  }

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

    // Load existing issues
    this.loadIssues();

    // Listen for messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'createIssue':
          await this.createIssue(message.title, message.description);
          break;
        case 'selectIssue':
          await this.selectIssue(message.issueId);
          break;
        case 'switchMode':
          await this.switchMode(message.mode);
          break;
        case 'updateIssue':
          await this.updateIssue(message.issueId, message.updates);
          break;
        case 'addTodo':
          await this.addTodo(message.issueId, message.content);
          break;
        case 'toggleTodo':
          await this.toggleTodo(message.issueId, message.todoId);
          break;
        case 'deleteTodo':
          await this.deleteTodo(message.issueId, message.todoId);
          break;
        case 'runTest':
          await this.runTest(message.issueId);
          break;
        case 'runBuild':
          await this.runBuild(message.issueId);
          break;
        case 'collectLogs':
          await this.collectLogs(message.issueId);
          break;
        case 'sendMessage':
          await this.handleUserMessage(message.message, message.mode, message.issueId);
          break;
        case 'getData':
          await this.sendDataToWebview();
          break;
      }
    });
  }

  private async initializeNysFolder(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this._nysFolder = vscode.Uri.joinPath(workspaceFolders[0].uri, '.nys');
      
      // Create .nys folder if it doesn't exist
      try {
        await vscode.workspace.fs.stat(this._nysFolder);
      } catch {
        await vscode.workspace.fs.createDirectory(this._nysFolder);
      }
    }
  }

  private async loadIssues(): Promise<void> {
    if (!this._nysFolder) return;

    try {
      const files = await vscode.workspace.fs.readDirectory(this._nysFolder);
      const issueFiles = files.filter(([name]) => name.endsWith('.md'));
      
      this._issues = [];
      for (const [fileName] of issueFiles) {
        const filePath = vscode.Uri.joinPath(this._nysFolder!, fileName);
        const content = await vscode.workspace.fs.readFile(filePath);
        const issue = this.parseIssueFromMarkdown(fileName, content.toString());
        if (issue) {
          this._issues.push(issue);
        }
      }

      // Sort by updated date (newest first)
      this._issues.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      this.updateWebview();
    } catch (error) {
      console.error('Failed to load issues:', error);
    }
  }

  private parseIssueFromMarkdown(fileName: string, content: string): Issue | null {
    try {
      const lines = content.split('\n');
      const id = fileName.replace('.md', '');
      
      // Extract metadata from frontmatter or first few lines
      let title = id;
      let description = '';
      let mode: 'design' | 'build' | 'debug' = 'design';
      let status: 'open' | 'in-progress' | 'completed' | 'blocked' = 'open';
      let todos: Todo[] = [];
      let createdAt = new Date();
      let updatedAt = new Date();

      // Parse frontmatter if present
      if (content.startsWith('---')) {
        const frontmatterEnd = content.indexOf('---', 3);
        if (frontmatterEnd > 0) {
          const frontmatter = content.substring(3, frontmatterEnd);
          const metadata = this.parseFrontmatter(frontmatter);
          title = metadata.title || id;
          mode = metadata.mode || 'design';
          status = metadata.status || 'open';
          createdAt = metadata.createdAt ? new Date(metadata.createdAt) : new Date();
          updatedAt = metadata.updatedAt ? new Date(metadata.updatedAt) : new Date();
          description = content.substring(frontmatterEnd + 3).trim();
        }
      } else {
        // Parse first line as title if no frontmatter
        const firstLine = lines[0];
        if (firstLine && !firstLine.startsWith('#')) {
          title = firstLine;
          description = lines.slice(1).join('\n').trim();
        } else {
          description = content;
        }
      }

      // Extract TODOs from content
      todos = this.extractTodosFromContent(content);

      return {
        id,
        title,
        description,
        mode,
        status,
        todos,
        createdAt,
        updatedAt,
        filePath: vscode.Uri.joinPath(this._nysFolder!, fileName).fsPath
      };
    } catch (error) {
      console.error(`Failed to parse issue ${fileName}:`, error);
      return null;
    }
  }

  private parseFrontmatter(frontmatter: string): any {
    const metadata: any = {};
    const lines = frontmatter.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        metadata[key] = value.trim();
      }
    }
    
    return metadata;
  }

  private extractTodosFromContent(content: string): Todo[] {
    const todos: Todo[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const todoMatch = line.match(/^(\s*)- \[([ x])\]\s*(.+)$/);
      if (todoMatch) {
        const [, indent, checked, content] = todoMatch;
        todos.push({
          id: `todo-${i}`,
          content: content.trim(),
          completed: checked === 'x',
          createdAt: new Date()
        });
      }
    }
    
    return todos;
  }

  public async createIssue(title: string, description: string): Promise<void> {
    if (!this._nysFolder) {
      await this.initializeNysFolder();
      if (!this._nysFolder) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
      }
    }

    const id = `issue-${Date.now()}`;
    const fileName = `${id}.md`;
    const filePath = vscode.Uri.joinPath(this._nysFolder, fileName);
    
    const issue: Issue = {
      id,
      title,
      description,
      mode: 'design',
      status: 'open',
      todos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      filePath: filePath.fsPath
    };

    const content = this.generateIssueMarkdown(issue);
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf8'));
    
    this._issues.unshift(issue);
    this._currentIssue = issue;
    this.updateWebview();
    
    vscode.window.showInformationMessage(`Created issue: ${title}`);
  }

  private async selectIssue(issueId: string): Promise<void> {
    const issue = this._issues.find(i => i.id === issueId);
    if (issue) {
      this._currentIssue = issue;
      this.updateWebview();
    }
  }

  public async switchMode(mode: 'design' | 'build' | 'debug'): Promise<void> {
    if (!this._currentIssue) return;

    this._currentIssue.mode = mode;
    this._currentIssue.updatedAt = new Date();
    await this.saveIssue(this._currentIssue);
    this.updateWebview();
  }

  private async updateIssue(issueId: string, updates: Partial<Issue>): Promise<void> {
    const issue = this._issues.find(i => i.id === issueId);
    if (!issue) return;

    Object.assign(issue, updates);
    issue.updatedAt = new Date();
    await this.saveIssue(issue);
    this.updateWebview();
  }

  private async addTodo(issueId: string, content: string): Promise<void> {
    const issue = this._issues.find(i => i.id === issueId);
    if (!issue) return;

    const todo: Todo = {
      id: `todo-${Date.now()}`,
      content,
      completed: false,
      createdAt: new Date()
    };

    issue.todos.push(todo);
    issue.updatedAt = new Date();
    await this.saveIssue(issue);
    this.updateWebview();
  }

  private async toggleTodo(issueId: string, todoId: string): Promise<void> {
    const issue = this._issues.find(i => i.id === issueId);
    if (!issue) return;

    const todo = issue.todos.find(t => t.id === todoId);
    if (todo) {
      todo.completed = !todo.completed;
      issue.updatedAt = new Date();
      await this.saveIssue(issue);
      this.updateWebview();
    }
  }

  private async deleteTodo(issueId: string, todoId: string): Promise<void> {
    const issue = this._issues.find(i => i.id === issueId);
    if (!issue) return;

    issue.todos = issue.todos.filter(t => t.id !== todoId);
    issue.updatedAt = new Date();
    await this.saveIssue(issue);
    this.updateWebview();
  }

  public async runTest(issueId: string): Promise<void> {
    const issue = this._issues.find(i => i.id === issueId);
    if (!issue) return;

    // Execute test command in terminal
    const terminal = vscode.window.createTerminal(`Test: ${issue.title}`);
    terminal.show();
    terminal.sendText('npm test');
    
    // Add a system message to the issue
    await this.addTodo(issueId, 'Run tests and verify results');
  }

  public async runBuild(issueId: string): Promise<void> {
    const issue = this._issues.find(i => i.id === issueId);
    if (!issue) return;

    // Execute build command in terminal
    const terminal = vscode.window.createTerminal(`Build: ${issue.title}`);
    terminal.show();
    terminal.sendText('npm run build');
    
    // Add a system message to the issue
    await this.addTodo(issueId, 'Build project and verify output');
  }

  public async collectLogs(issueId: string): Promise<void> {
    const issue = this._issues.find(i => i.id === issueId);
    if (!issue) return;

    // Open output panel to show logs
    vscode.commands.executeCommand('workbench.action.output.show');
    
    // Add a system message to the issue
    await this.addTodo(issueId, 'Collect and analyze error logs');
  }

  private async saveIssue(issue: Issue): Promise<void> {
    const content = this.generateIssueMarkdown(issue);
    const filePath = vscode.Uri.file(issue.filePath);
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf8'));
  }

  private generateIssueMarkdown(issue: Issue): string {
    const frontmatter = [
      '---',
      `title: ${issue.title}`,
      `mode: ${issue.mode}`,
      `status: ${issue.status}`,
      `createdAt: ${issue.createdAt.toISOString()}`,
      `updatedAt: ${issue.updatedAt.toISOString()}`,
      '---',
      ''
    ].join('\n');

    const todosSection = issue.todos.length > 0 
      ? '\n## TODOs\n\n' + issue.todos.map(todo => 
          `- [${todo.completed ? 'x' : ' '}] ${todo.content}`
        ).join('\n') + '\n'
      : '';

    return frontmatter + issue.description + todosSection;
  }

  private updateWebview(): void {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateData',
        issues: this._issues,
        currentIssue: this._currentIssue
      });
    }
  }

  public getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <title>Mira Issue Manager</title>
    <style>
        :root {
            --jb-bg-primary: #1a1a1a;
            --jb-bg-secondary: #2d2d2d;
            --jb-bg-tertiary: #3a3a3a;
            --jb-fg-primary: #e0e0e0;
            --jb-fg-secondary: #b0b0b0;
            --jb-fg-disabled: #666666;
            --jb-accent: #6366f1;
            --jb-accent-hover: #7c3aed;
            --jb-border: #404040;
            --jb-border-light: #2a2a2a;
            --jb-success: #10b981;
            --jb-warning: #f59e0b;
            --jb-error: #ef4444;
            --jb-info: #3b82f6;
            --jb-assistant-bg: #1e1b4b;
            --jb-assistant-fg: #c7d2fe;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            background: var(--jb-bg-primary);
            color: var(--jb-fg-primary);
            height: 100vh;
            overflow: hidden;
        }

        .main-container {
            display: flex;
            height: 100vh;
            background: var(--jb-bg-primary);
        }

        /* Main Content Area */
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
        }

        /* Chat/Response Area */
        .chat-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: var(--jb-bg-primary);
            overflow: hidden;
        }

        .chat-header {
            padding: 12px 16px;
            background: var(--jb-bg-secondary);
            border-bottom: 1px solid var(--jb-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .chat-title {
            font-weight: 600;
            font-size: 14px;
            color: var(--jb-fg-primary);
        }

        .chat-content {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: var(--jb-bg-primary);
        }

        .chat-input-area {
            border-top: 1px solid var(--jb-border);
            background: var(--jb-bg-secondary);
            padding: 16px;
        }

        .chat-input-container {
            max-width: 100%;
            width: 100%;
        }

        .chat-input-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .mode-selector {
            display: flex;
            align-items: center;
        }

        .mode-dropdown {
            background: var(--jb-bg-primary);
            border: 1px solid var(--jb-border);
            border-radius: 6px;
            padding: 6px 12px;
            color: var(--jb-fg-primary);
            font-family: var(--jb-font-family);
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .mode-dropdown:focus {
            outline: none;
            border-color: var(--jb-accent);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        .mode-dropdown:hover {
            border-color: var(--jb-accent);
        }

        .chat-logo {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--jb-accent);
            font-weight: 600;
            font-size: 16px;
        }

        .logo-icon {
            font-size: 18px;
            animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.1) rotate(180deg); }
        }

        .logo-text {
            background: linear-gradient(45deg, var(--jb-accent), var(--jb-accent-hover));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .chat-input-wrapper {
            display: flex;
            gap: 12px;
            align-items: flex-end;
            width: 100%;
        }

        .chat-input {
            flex: 1;
            background: var(--jb-bg-primary);
            border: 1px solid var(--jb-border);
            border-radius: 8px;
            padding: 12px 16px;
            color: var(--jb-fg-primary);
            font-family: var(--jb-font-family);
            font-size: 14px;
            resize: vertical;
            min-height: 50px;
            max-height: 150px;
            transition: all 0.2s ease;
        }

        .chat-input:focus {
            outline: none;
            border-color: var(--jb-accent);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
            transform: translateY(-1px);
        }

        .chat-input::placeholder {
            color: var(--jb-fg-disabled);
        }

        .send-btn {
            background: linear-gradient(135deg, var(--jb-accent), var(--jb-accent-hover));
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 80px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .send-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .send-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
        }

        .send-btn:disabled {
            background: var(--jb-fg-disabled);
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .send-icon {
            font-size: 16px;
        }

        .send-text {
            font-size: 14px;
        }

        /* Chat Message Styles */
        .message {
            margin-bottom: 16px;
            padding: 12px;
            border-radius: 8px;
            max-width: 80%;
        }

        .user-message {
            background: var(--jb-bg-tertiary);
            margin-left: auto;
            border: 1px solid var(--jb-border);
        }

        .assistant-message {
            background: var(--jb-assistant-bg);
            color: var(--jb-assistant-fg);
            margin-right: auto;
            border: 1px solid rgba(199, 210, 254, 0.2);
        }

        .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 12px;
            opacity: 0.8;
        }

        .message-sender {
            font-weight: 600;
        }

        .message-time {
            font-size: 11px;
        }

        .message-content {
            line-height: 1.5;
            word-wrap: break-word;
        }

        .welcome-message {
            text-align: center;
            padding: 40px 20px;
            color: var(--jb-fg-secondary);
        }

        .welcome-message h2 {
            margin: 0 0 8px 0;
            font-size: 18px;
            color: var(--jb-fg-primary);
        }

        .welcome-message p {
            margin: 0 0 16px 0;
            font-size: 14px;
        }

        /* Right Panel - Issues */
        .issues-panel {
            width: 350px;
            background: var(--jb-bg-secondary);
            border-left: 1px solid var(--jb-border);
            display: flex;
            flex-direction: column;
            transition: width 0.3s ease;
        }

        .issues-panel.minimized {
            width: 0;
            overflow: hidden;
        }

        .issues-header {
            padding: 12px 16px;
            background: var(--jb-bg-tertiary);
            border-bottom: 1px solid var(--jb-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .issues-title {
            font-weight: 600;
            font-size: 14px;
            color: var(--jb-fg-primary);
        }

        .new-issue-btn {
            background: var(--jb-accent);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .new-issue-btn:hover {
            background: var(--jb-accent-hover);
        }

        .toggle-issues-btn {
            background: transparent;
            color: var(--jb-fg-secondary);
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .toggle-issues-btn:hover {
            background: var(--jb-bg-tertiary);
            color: var(--jb-fg-primary);
        }

        .issues-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px 0;
        }

        .issue-item {
            padding: 12px 16px;
            border-bottom: 1px solid var(--jb-border-light);
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
        }

        .issue-item:hover {
            background: var(--jb-bg-tertiary);
        }

        .issue-item.active {
            background: var(--jb-accent);
            color: white;
        }

        .issue-item.active .issue-mode {
            color: rgba(255, 255, 255, 0.8);
        }

        .issue-title {
            font-weight: 600;
            font-size: 13px;
            margin-bottom: 4px;
            line-height: 1.3;
        }

        .issue-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            color: var(--jb-fg-secondary);
        }

        .issue-mode {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .issue-mode.design { background: var(--jb-info); color: white; }
        .issue-mode.build { background: var(--jb-warning); color: white; }
        .issue-mode.debug { background: var(--jb-error); color: white; }

        .issue-status {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .issue-status.open { background: var(--jb-info); color: white; }
        .issue-status.in-progress { background: var(--jb-warning); color: white; }
        .issue-status.completed { background: var(--jb-success); color: white; }
        .issue-status.blocked { background: var(--jb-error); color: white; }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--jb-fg-secondary);
            text-align: center;
        }

        .empty-state h2 {
            margin: 0 0 8px 0;
            font-size: 18px;
            color: var(--jb-fg-primary);
        }

        .empty-state p {
            margin: 0 0 16px 0;
            font-size: 14px;
        }

        .create-issue-btn {
            background: var(--jb-accent);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }

        .create-issue-btn:hover {
            background: var(--jb-accent-hover);
        }
    </style>
</head>
<body>
    <div class="main-container">
        <!-- Main Content Area -->
        <div class="main-content">
            <!-- Chat/Response Area -->
            <div class="chat-area">
                <div class="chat-header">
                    <div class="chat-title">Mira Assistant</div>
                    <button class="toggle-issues-btn" id="toggleIssuesBtn" title="Toggle Issues Panel">📋</button>
                </div>
                <div class="chat-content" id="chatContent">
                    <div class="welcome-message">
                        <h2>Welcome to Mira</h2>
                        <p>Your AI-powered development assistant with issue-driven workflow.</p>
                        <p>Use the Issues panel on the right to manage your development tasks.</p>
                    </div>
                </div>
                
                <!-- Chat Input Area -->
                <div class="chat-input-area">
                    <div class="chat-input-container">
                        <div class="chat-input-header">
                            <div class="mode-selector">
                                <select id="modeSelector" class="mode-dropdown">
                                    <option value="design">🎨 Design</option>
                                    <option value="build">🔨 Build</option>
                                    <option value="debug">🐛 Debug</option>
                                </select>
                            </div>
                            <div class="chat-logo">
                                <span class="logo-icon">✨</span>
                                <span class="logo-text">Mira</span>
                            </div>
                        </div>
                        <div class="chat-input-wrapper">
                            <textarea 
                                class="chat-input" 
                                id="chatInput" 
                                placeholder="Ask Mira anything about your current issue or development tasks..."
                                rows="3"
                            ></textarea>
                            <button class="send-btn" id="sendBtn" title="Send message">
                                <span class="send-icon">🚀</span>
                                <span class="send-text">Send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Panel - Issues -->
        <div class="issues-panel" id="issuesPanel">
            <div class="issues-header">
                <div class="issues-title">Issues</div>
                <button class="new-issue-btn" id="newIssueBtn">+ New</button>
            </div>
            <div class="issues-list" id="issuesList">
                <!-- Issues will be populated here -->
            </div>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let currentIssue = null;
        let currentMode = 'design';

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            // Request initial data
            vscode.postMessage({ type: 'getData' });
            
            // Initialize UI state
            updateIssuesList([]);
            
            // Set up event listeners
            setupEventListeners();
        });

        function setupEventListeners() {
            // Toggle buttons
            document.getElementById('toggleIssuesBtn').addEventListener('click', toggleIssuesPanel);
            
            // Issue management
            document.getElementById('newIssueBtn').addEventListener('click', showCreateIssueDialog);
            
            // Mode switching via dropdown
            document.getElementById('modeSelector').addEventListener('change', function() {
                switchMode(this.value);
            });
            
            // Chat functionality
            document.getElementById('sendBtn').addEventListener('click', sendMessage);
            document.getElementById('chatInput').addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }

        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'updateData':
                    updateIssuesList(message.issues);
                    if (message.currentIssue) {
                        showIssue(message.currentIssue);
                    }
                    break;
                case 'assistantResponse':
                    addMessageToChat('assistant', message.content);
                    break;
            }
        });

        function updateIssuesList(issues) {
            const issuesList = document.getElementById('issuesList');
            issuesList.innerHTML = '';

            if (issues.length === 0) {
                issuesList.innerHTML = '<div style="padding: 16px; color: var(--jb-fg-secondary); text-align: center;">No issues yet</div>';
                return;
            }

            issues.forEach(issue => {
                const issueElement = document.createElement('div');
                issueElement.className = 'issue-item';
                issueElement.dataset.issueId = issue.id;
                issueElement.addEventListener('click', () => selectIssue(issue.id));
                
                issueElement.innerHTML = \`
                    <div class="issue-title">\${escapeHtml(issue.title)}</div>
                    <div class="issue-meta">
                        <span class="issue-mode \${issue.mode}">\${issue.mode}</span>
                        <span class="issue-status \${issue.status}">\${issue.status}</span>
                        <span>\${formatDate(issue.updatedAt)}</span>
                    </div>
                \`;
                
                issuesList.appendChild(issueElement);
            });
        }

        function selectIssue(issueId) {
            vscode.postMessage({ type: 'selectIssue', issueId });
        }

        function showIssue(issue) {
            currentIssue = issue;
            currentMode = issue.mode;

            // Update mode dropdown
            document.getElementById('modeSelector').value = issue.mode;

            // Update issue list selection
            document.querySelectorAll('.issue-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(\`[data-issue-id="\${issue.id}"]\`)?.classList.add('active');
        }

        function toggleIssuesPanel() {
            const panel = document.getElementById('issuesPanel');
            panel.classList.toggle('minimized');
        }

        function switchMode(mode) {
            if (!currentIssue) return;

            currentMode = mode;
            currentIssue.mode = mode;

            // Send mode change to extension
            vscode.postMessage({ type: 'switchMode', mode });
        }

        function showCreateIssueDialog() {
            const title = prompt('Issue Title:');
            if (!title) return;
            
            const description = prompt('Issue Description (optional):') || '';
            
            vscode.postMessage({ 
                type: 'createIssue', 
                title: title, 
                description: description 
            });
        }

        // Chat functionality
        function sendMessage() {
            const input = document.getElementById('chatInput');
            const modeSelector = document.getElementById('modeSelector');
            const message = input.value.trim();
            const selectedMode = modeSelector.value;
            
            if (!message) return;
            
            // Add user message to chat with mode context
            const messageWithMode = \`[\${selectedMode.toUpperCase()}] \${message}\`;
            addMessageToChat('user', messageWithMode);
            
            // Clear input
            input.value = '';
            
            // Send to extension
            vscode.postMessage({ 
                type: 'sendMessage', 
                message: message,
                mode: selectedMode,
                issueId: currentIssue ? currentIssue.id : null
            });
        }

        function addMessageToChat(sender, content) {
            const chatContent = document.getElementById('chatContent');
            
            // Remove welcome message if it exists
            const welcomeMsg = chatContent.querySelector('.welcome-message');
            if (welcomeMsg) {
                welcomeMsg.remove();
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${sender}-message\`;
            
            const timestamp = new Date().toLocaleTimeString();
            
            messageDiv.innerHTML = \`
                <div class="message-header">
                    <span class="message-sender">\${sender === 'user' ? 'You' : 'Mira'}</span>
                    <span class="message-time">\${timestamp}</span>
                </div>
                <div class="message-content">\${escapeHtml(content)}</div>
            \`;
            
            chatContent.appendChild(messageDiv);
            chatContent.scrollTop = chatContent.scrollHeight;
        }

        // Utility functions
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return 'Today';
            } else if (diffDays === 1) {
                return 'Yesterday';
            } else if (diffDays < 7) {
                return \`\${diffDays} days ago\`;
            } else {
                return date.toLocaleDateString();
            }
        }
    </script>
</body>
</html>`;
  }

  private async sendDataToWebview(): Promise<void> {
    if (!this._view) return;

    this._view.webview.postMessage({
      type: 'updateData',
      issues: this._issues,
      currentIssue: this._currentIssue
    });
  }

  private async handleUserMessage(message: string, mode?: string, issueId?: string): Promise<void> {
    if (!this._view) return;

    try {
      // Get current issue
      const currentIssue = issueId ? this._issues.find(issue => issue.id === issueId) : this._currentIssue;
      
      if (!currentIssue) {
        this._view.webview.postMessage({
          type: 'assistantResponse',
          content: 'No active issue found. Please create or select an issue first.'
        });
        return;
      }

      // Simple response based on mode (no complex workflow logic)
      let response: string;

      switch (mode?.toLowerCase()) {
        case 'design':
          response = `🎨 Design mode: I understand you want to work on "${message}". This is where you would design the requirements and architecture for your project. (Workflow implementation needed)`;
          break;

        case 'build':
          response = `🔨 Build mode: I understand you want to build "${message}". This is where you would generate the actual code implementation. (Workflow implementation needed)`;
          break;

        case 'debug':
          response = `🐛 Debug mode: I understand you want to debug "${message}". This is where you would identify and fix issues in your code. (Workflow implementation needed)`;
          break;

        default:
          response = `✨ I've received your message: "${message}". The extension skeleton is ready for you to implement your custom workflows and logic.`;
          break;
      }

      // Send response to webview
      this._view.webview.postMessage({
        type: 'assistantResponse',
        content: response
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this._view.webview.postMessage({
        type: 'assistantResponse',
        content: `❌ Error processing your message: ${errorMessage}`
      });
    }
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