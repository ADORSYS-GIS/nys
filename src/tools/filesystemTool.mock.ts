/**
 * Mock Filesystem Tool for Mira Sidebar Chat
 * Provides a method to list project files (simulated, no real FS operations).
 * Strict TypeScript, modular, ready for orchestrator integration.
 */

export interface FilesystemTool {
  /**
   * Lists project files.
   * @returns Promise resolving to an array of file paths (simulated).
   */
  listProjectFiles(): Promise<string[]>;
}

/**
 * Mock implementation of FilesystemTool.
 * Returns a static/simulated file list.
 */
export class MockFilesystemTool implements FilesystemTool {
  private static readonly mockFiles: string[] = [
    "src/index.ts",
    "src/app.ts",
    "src/components/Sidebar.tsx",
    "src/styles/main.css",
    "README.md",
    "package.json"
  ];

  async listProjectFiles(): Promise<string[]> {
    // Simulate async operation
    return Promise.resolve(MockFilesystemTool.mockFiles);
  }
}