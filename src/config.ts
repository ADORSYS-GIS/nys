import * as vscode from 'vscode';

export class Config {
  // Get configuration value with fallback
  public static get<T>(section: string, defaultValue?: T): T | undefined {
    const config = vscode.workspace.getConfiguration('mira');
    return config.get<T>(section, defaultValue as T);
  }

  // Update configuration value
  public static async update(section: string, value: any, global = true): Promise<void> {
    const config = vscode.workspace.getConfiguration('mira');
    await config.update(section, value, global);
  }
}
