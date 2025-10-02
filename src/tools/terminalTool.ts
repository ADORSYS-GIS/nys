import { Tool } from "langchain/tools";
import { spawn } from "child_process";

/**
 * TerminalTool: LangChain Tool for executing shell commands.
 * Usage: tool:terminal command="ls -la"
 */
export const TerminalTool = {
  name: "terminal",
  description: "Execute a shell command in the workspace and return its output.",
  parameters: [
    {
      name: "command",
      type: "string",
      description: "The shell command to execute",
      required: true,
    },
  ],
  /**
   * Executes a shell command and returns stdout/stderr (up to 8KB).
   * @param params { command: string }
   * @returns {Promise<string>}
   */
  async execute(params: { command: string }): Promise<string> {
    return new Promise((resolve) => {
      if (!params || typeof params.command !== "string" || !params.command.trim()) {
        resolve("No command provided.");
        return;
      }
      // Use user's default shell
      const shell = process.env.SHELL || (process.platform === "win32" ? "cmd.exe" : "/bin/bash");
      const proc = spawn(shell, ["-c", params.command], { cwd: process.cwd() });

      let output = "";
      let error = "";

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });
      proc.stderr.on("data", (data) => {
        error += data.toString();
      });
      proc.on("close", (code) => {
        let result = "";
        if (output) result += output;
        if (error) result += error;
        result += `\n[Process exited with code ${code}]`;
        // Limit output to 8KB
        if (result.length > 8192) {
          result = result.slice(0, 8192) + "\n[Output truncated]";
        }
        resolve(result);
      });
      proc.on("error", (err) => {
        resolve(`Failed to execute command: ${err.message}`);
      });
    });
  },
};