import * as fs from 'fs/promises';
import * as path from 'path';

const NYS_DIR = path.resolve(process.cwd(), '.nys');

export type Session = {
  id: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};

export type Message = {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | string;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type Task = {
  id: string;
  sessionId: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | string;
  metadata?: Record<string, unknown>;
};

export type PlannerState = {
  id: string;
  sessionId: string;
  state: Record<string, unknown>;
  updatedAt: string;
};

type StoreFiles = 'sessions' | 'messages' | 'tasks' | 'plannerStates';

type StoreMap = {
  sessions: Session;
  messages: Message;
  tasks: Task;
  plannerStates: PlannerState;
};

export class MemoryStore {
  private static getFilePath(store: StoreFiles): string {
    return path.join(NYS_DIR, `${store}.json`);
  }

  private static async ensureNysDir(): Promise<void> {
    try {
      await fs.mkdir(NYS_DIR, { recursive: true });
    } catch (err) {
      throw new Error(`Failed to ensure .nys directory: ${(err as Error).message}`);
    }
  }

  private static async readAll<T>(store: StoreFiles): Promise<T[]> {
    await this.ensureNysDir();
    const filePath = this.getFilePath(store);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data) as T[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to read ${store}: ${(err as Error).message}`);
    }
  }

  private static async writeAll<T>(store: StoreFiles, items: T[]): Promise<void> {
    await this.ensureNysDir();
    const filePath = this.getFilePath(store);
    try {
      await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf8');
    } catch (err) {
      throw new Error(`Failed to write ${store}: ${(err as Error).message}`);
    }
  }

  // Generic CRUD
  public static async list<K extends StoreFiles, T extends StoreMap[K]>(store: K): Promise<T[]> {
    return this.readAll<T>(store);
  }

  public static async getById<K extends StoreFiles, T extends StoreMap[K]>(store: K, id: string): Promise<T | null> {
    const items = await this.readAll<T>(store);
    return items.find(item => (item as any).id === id) || null;
  }

  public static async create<K extends StoreFiles, T extends StoreMap[K]>(store: K, item: T): Promise<void> {
    const items = await this.readAll<T>(store);
    items.push(item);
    await this.writeAll<T>(store, items);
  }

  public static async update<K extends StoreFiles, T extends StoreMap[K]>(store: K, id: string, partial: Partial<T>): Promise<void> {
    const items = await this.readAll<T>(store);
    const idx = items.findIndex(item => (item as any).id === id);
    if (idx === -1) throw new Error(`${store} item with id "${id}" not found`);
    items[idx] = { ...items[idx], ...partial };
    await this.writeAll<T>(store, items);
  }

  public static async delete<K extends StoreFiles, T extends StoreMap[K]>(store: K, id: string): Promise<void> {
    const items = await this.readAll<T>(store);
    const filtered = items.filter(item => (item as any).id !== id);
    await this.writeAll<T>(store, filtered);
  }

  // Convenience methods for each entity
  // Sessions
  public static listSessions = () => this.list('sessions');
  public static getSession = (id: string) => this.getById('sessions', id);
  public static createSession = (session: Session) => this.create('sessions', session);
  public static updateSession = (id: string, partial: Partial<Session>) => this.update('sessions', id, partial);
  public static deleteSession = (id: string) => this.delete('sessions', id);

  // Messages
  public static listMessages = () => this.list('messages');
  public static getMessage = (id: string) => this.getById('messages', id);
  public static createMessage = (message: Message) => this.create('messages', message);
  public static updateMessage = (id: string, partial: Partial<Message>) => this.update('messages', id, partial);
  public static deleteMessage = (id: string) => this.delete('messages', id);

  // Tasks
  public static listTasks = () => this.list('tasks');
  public static getTask = (id: string) => this.getById('tasks', id);
  public static createTask = (task: Task) => this.create('tasks', task);
  public static updateTask = (id: string, partial: Partial<Task>) => this.update('tasks', id, partial);
  public static deleteTask = (id: string) => this.delete('tasks', id);

  // PlannerStates
  public static listPlannerStates = () => this.list('plannerStates');
  public static getPlannerState = (id: string) => this.getById('plannerStates', id);
  public static createPlannerState = (state: PlannerState) => this.create('plannerStates', state);
  public static updatePlannerState = (id: string, partial: Partial<PlannerState>) => this.update('plannerStates', id, partial);
  public static deletePlannerState = (id: string) => this.delete('plannerStates', id);
}