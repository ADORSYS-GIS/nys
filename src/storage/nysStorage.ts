import * as vscode from 'vscode';
import * as path from 'path';
import { Issue, Todo } from '../issueViewProvider';

export class NysStorage {
  private _nysFolder: vscode.Uri | null = null;
  private _workspaceFolder: vscode.Uri | null = null;

  constructor() {
    this.initializeWorkspace();
  }

  private async initializeWorkspace(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this._workspaceFolder = workspaceFolders[0].uri;
      this._nysFolder = vscode.Uri.joinPath(this._workspaceFolder, '.nys');
      
      // Create .nys folder if it doesn't exist
      try {
        await vscode.workspace.fs.stat(this._nysFolder);
      } catch {
        await vscode.workspace.fs.createDirectory(this._nysFolder);
        console.log('Created .nys folder for issue storage');
      }
    }
  }

  public async ensureNysFolder(): Promise<vscode.Uri | null> {
    if (!this._nysFolder) {
      await this.initializeWorkspace();
    }
    return this._nysFolder;
  }

  public async saveIssue(issue: Issue): Promise<void> {
    const nysFolder = await this.ensureNysFolder();
    if (!nysFolder) {
      throw new Error('No workspace folder available');
    }

    const fileName = `${issue.id}.md`;
    const filePath = vscode.Uri.joinPath(nysFolder, fileName);
    const content = this.generateIssueMarkdown(issue);
    
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf8'));
    console.log(`Saved issue ${issue.id} to ${filePath.fsPath}`);
  }

  public async loadIssues(): Promise<Issue[]> {
    const nysFolder = await this.ensureNysFolder();
    if (!nysFolder) {
      return [];
    }

    try {
      const files = await vscode.workspace.fs.readDirectory(nysFolder);
      const issueFiles = files.filter(([name]) => name.endsWith('.md'));
      
      const issues: Issue[] = [];
      for (const [fileName] of issueFiles) {
        try {
          const filePath = vscode.Uri.joinPath(nysFolder, fileName);
          const content = await vscode.workspace.fs.readFile(filePath);
          const issue = this.parseIssueFromMarkdown(fileName, content.toString());
          if (issue) {
            issues.push(issue);
          }
        } catch (error) {
          console.error(`Failed to load issue ${fileName}:`, error);
        }
      }

      // Sort by updated date (newest first)
      issues.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      return issues;
    } catch (error) {
      console.error('Failed to load issues:', error);
      return [];
    }
  }

  public async deleteIssue(issueId: string): Promise<void> {
    const nysFolder = await this.ensureNysFolder();
    if (!nysFolder) {
      throw new Error('No workspace folder available');
    }

    const fileName = `${issueId}.md`;
    const filePath = vscode.Uri.joinPath(nysFolder, fileName);
    
    try {
      await vscode.workspace.fs.delete(filePath);
      console.log(`Deleted issue ${issueId}`);
    } catch (error) {
      console.error(`Failed to delete issue ${issueId}:`, error);
    }
  }

  public async saveIssueState(issueId: string, state: any): Promise<void> {
    const nysFolder = await this.ensureNysFolder();
    if (!nysFolder) {
      throw new Error('No workspace folder available');
    }

    const fileName = `${issueId}.state.json`;
    const filePath = vscode.Uri.joinPath(nysFolder, fileName);
    const content = JSON.stringify(state, null, 2);
    
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf8'));
  }

  public async loadIssueState(issueId: string): Promise<any | null> {
    const nysFolder = await this.ensureNysFolder();
    if (!nysFolder) {
      return null;
    }

    try {
      const fileName = `${issueId}.state.json`;
      const filePath = vscode.Uri.joinPath(nysFolder, fileName);
      const content = await vscode.workspace.fs.readFile(filePath);
      return JSON.parse(content.toString());
    } catch (error) {
      return null;
    }
  }

  public async saveGlobalState(state: any): Promise<void> {
    const nysFolder = await this.ensureNysFolder();
    if (!nysFolder) {
      throw new Error('No workspace folder available');
    }

    const filePath = vscode.Uri.joinPath(nysFolder, 'global-state.json');
    const content = JSON.stringify(state, null, 2);
    
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf8'));
  }

  public async loadGlobalState(): Promise<any | null> {
    const nysFolder = await this.ensureNysFolder();
    if (!nysFolder) {
      return null;
    }

    try {
      const filePath = vscode.Uri.joinPath(nysFolder, 'global-state.json');
      const content = await vscode.workspace.fs.readFile(filePath);
      return JSON.parse(content.toString());
    } catch (error) {
      return null;
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

  public async cleanup(): Promise<void> {
    const nysFolder = await this.ensureNysFolder();
    if (!nysFolder) {
      return;
    }

    try {
      // Clean up old state files (older than 30 days)
      const files = await vscode.workspace.fs.readDirectory(nysFolder);
      const stateFiles = files.filter(([name]) => name.endsWith('.state.json'));
      
      for (const [fileName] of stateFiles) {
        try {
          const filePath = vscode.Uri.joinPath(nysFolder, fileName);
          const stat = await vscode.workspace.fs.stat(filePath);
          const fileAge = Date.now() - stat.mtime;
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          
          if (fileAge > thirtyDays) {
            await vscode.workspace.fs.delete(filePath);
            console.log(`Cleaned up old state file: ${fileName}`);
          }
        } catch (error) {
          console.error(`Failed to clean up state file ${fileName}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
    }
  }
}
