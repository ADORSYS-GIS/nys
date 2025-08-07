import * as vscode from 'vscode';

export class Config {
  // Get configuration value with fallback
  public static get<T>(section: string, defaultValue?: T): T | undefined {
    const config = vscode.workspace.getConfiguration('mcpClient');
    return config.get<T>(section, defaultValue as T);
  }

  // Update configuration value
  public static async update(section: string, value: any, global = true): Promise<void> {
    const config = vscode.workspace.getConfiguration('mcpClient');
    await config.update(section, value, global);
  }

  // Add LLM API key configuration
  public static async addLlmApiKeySettings(): Promise<void> {
    // This would normally update the package.json contributes.configuration section
    // But for now, just show a message if the setting isn't found
    const config = vscode.workspace.getConfiguration('mcpClient');
    if (config.get('llmApiKey') === undefined) {
      console.log('Adding llmApiKey setting');
      // This is a placeholder - in a real extension we would update the package.json
    }
  }
}
