import * as fs from 'fs/promises';
import * as path from 'path';

const NYS_DIR = path.resolve(process.cwd(), '.nys');

export type ConfigData = Record<string, unknown>;

export class ConfigManager {
  private static getConfigPath(name: string): string {
    if (!/^[\w\-]+$/.test(name)) {
      throw new Error('Invalid config name');
    }
    return path.join(NYS_DIR, `${name}.json`);
  }

  private static async ensureNysDir(): Promise<void> {
    try {
      await fs.mkdir(NYS_DIR, { recursive: true });
    } catch (err) {
      throw new Error(`Failed to ensure .nys directory: ${(err as Error).message}`);
    }
  }

  public static async listConfigs(): Promise<string[]> {
    await this.ensureNysDir();
    const files = await fs.readdir(NYS_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''));
  }

  public static async readConfig(name: string): Promise<ConfigData | null> {
    await this.ensureNysDir();
    const filePath = this.getConfigPath(name);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data) as ConfigData;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw new Error(`Failed to read config "${name}": ${(err as Error).message}`);
    }
  }

  public static async writeConfig(name: string, data: ConfigData): Promise<void> {
    await this.ensureNysDir();
    const filePath = this.getConfigPath(name);
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      throw new Error(`Failed to write config "${name}": ${(err as Error).message}`);
    }
  }

  public static async updateConfig(name: string, partialData: ConfigData): Promise<void> {
    await this.ensureNysDir();
    const filePath = this.getConfigPath(name);
    let current: ConfigData = {};
    try {
      const data = await fs.readFile(filePath, 'utf8');
      current = JSON.parse(data) as ConfigData;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Failed to read config for update "${name}": ${(err as Error).message}`);
      }
    }
    const updated = { ...current, ...partialData };
    try {
      await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
    } catch (err) {
      throw new Error(`Failed to update config "${name}": ${(err as Error).message}`);
    }
  }

  public static async deleteConfig(name: string): Promise<void> {
    await this.ensureNysDir();
    const filePath = this.getConfigPath(name);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Failed to delete config "${name}": ${(err as Error).message}`);
      }
    }
  }
}