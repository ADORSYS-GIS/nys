import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class OutputExporter {
  /**
   * Save response as a markdown file
   */
  public static async saveAsMarkdown(content: string): Promise<string> {
    // Get workspace folder or use OS temp directory if no workspace
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const baseDir = workspaceFolder ? workspaceFolder.uri.fsPath : require('os').tmpdir();

    // Create a directory for MCP responses if it doesn't exist
    const outputDir = path.join(baseDir, 'mcp-responses');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate a filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `mcp-response-${timestamp}.md`;
    const filePath = path.join(outputDir, filename);

    // Write the content to the file
    fs.writeFileSync(filePath, content, 'utf8');

    // Open the file in the editor
    const openPath = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(openPath);

    return filePath;
  }
}
