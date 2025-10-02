import * as fs from 'fs/promises';
import * as path from 'path';

const NYS_DIR = path.resolve(process.cwd(), '.nys');
const CONFIG_FILE = path.join(NYS_DIR, 'config.json');

export class ConfigManager {
  /**
   * Ensures the .nys directory exists.
   */
  private static async ensureNysDir(): Promise<void> {
    try {
      await fs.mkdir(NYS_DIR, { recursive: true });
    } catch (err) {
      // Ignore if already exists
    }
  }

  /**
   * Reads the main config from .nys/config.json.
   */
  static async readConfig<T = any>(): Promise<T | null> {
    await this.ensureNysDir();
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf-8');
      return JSON.parse(data) as T;
    } catch (err: any) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  /**
   * Writes the main config to .nys/config.json.
   */
  static async writeConfig<T = any>(config: T): Promise<void> {
    await this.ensureNysDir();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * Reads a state file (e.g., memory, tasks, role preferences) from .nys/.
   * @param fileName The file name (e.g., 'memory.json')
   */
  static async readState<T = any>(fileName: string): Promise<T | null> {
    await this.ensureNysDir();
    const filePath = path.join(NYS_DIR, fileName);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (err: any) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  /**
   * Writes a state file (e.g., memory, tasks, role preferences) to .nys/.
   * @param fileName The file name (e.g., 'memory.json')
   * @param state The state object to write
   */
  static async writeState<T = any>(fileName: string, state: T): Promise<void> {
    await this.ensureNysDir();
    const filePath = path.join(NYS_DIR, fileName);
    await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
  }
}