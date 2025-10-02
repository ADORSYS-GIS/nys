/**
 * Mock Terminal Service for Mira Sidebar Chat
 * Provides a method to run a command and stream output (simulated, no real terminal operations).
 * Strict TypeScript, modular, ready for orchestrator integration.
 */

export interface TerminalService {
  /**
   * Runs a command and streams output via the provided callback.
   * @param command The command to "run" (simulated).
   * @param onData Callback invoked with simulated output chunks.
   * @returns Promise that resolves when streaming is complete.
   */
  runCommand(command: string, onData: (data: string) => void): Promise<void>;
}

/**
 * Mock implementation of TerminalService.
 * Simulates command execution and output streaming.
 */
export class MockTerminalService implements TerminalService {
  async runCommand(command: string, onData: (data: string) => void): Promise<void> {
    // Simulated output for demonstration
    const simulatedOutput: string[] = [
      `$ ${command}`,
      "Simulated terminal output line 1...",
      "Simulated terminal output line 2...",
      "Command completed successfully."
    ];

    for (const line of simulatedOutput) {
      // Simulate streaming delay
      await new Promise(resolve => setTimeout(resolve, 100));
      onData(line);
    }
  }
}