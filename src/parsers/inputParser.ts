import * as vscode from 'vscode';
import { HeuristicParser } from './heuristicParser';
import { LlmParser, ToolCommand } from './llmParser';

export class InputParser {
  private static instance: InputParser;
  private heuristicParser: HeuristicParser;
  private llmParser: LlmParser;
  private availableTools: any[] = [];

  private constructor() {
    this.heuristicParser = new HeuristicParser();
    this.llmParser = new LlmParser();
  }

  public static getInstance(): InputParser {
    if (!InputParser.instance) {
      InputParser.instance = new InputParser();
    }
    return InputParser.instance;
  }

  /**
   * Update the list of available tools for both parsers
   */
  public setAvailableTools(tools: any[]) {
    this.availableTools = tools;
    this.heuristicParser.setAvailableTools(tools);
    this.llmParser.setAvailableTools(tools);
  }

  /**
   * Parse user input using the LLM parser ONLY; never fallback to heuristic or prompt-to-server.
   * Always expects LLM to generate one or more commands, else returns null for "sorry" UI.
   */
  public async parseInput(input: string, context?: string): Promise<{ toolCommand: string | null, wasLlmUsed: boolean }> {
    console.log(`Parsing input: "${input}" with LLM ONLY (context length: ${context ? context.length : 0})`);

    if (input.startsWith('tool:')) {
      return { toolCommand: input, wasLlmUsed: false };
    }

    try {
      // Pass context to the LLM parser always
      const llmResult = await this.llmParser.parseInput(input, context ?? '');
      if (llmResult && Array.isArray(llmResult) && llmResult.length > 0) {
        const commandsAsLines = llmResult.map(cmd => {
          const params = Object.entries(cmd.params)
            .map(([key, value]) => `${key}=${value}`)
            .join(' ');
          return `tool:${cmd.name}${params ? ' ' + params : ''}`;
        });
        return { toolCommand: commandsAsLines.join('\n'), wasLlmUsed: true };
      }
    } catch (err) {
      console.error('LLM parsing failed:', err);
    }
    return { toolCommand: null, wasLlmUsed: true };
  }

  /**
   * Format parameters object into a string
   */
  private formatParams(params: Record<string, any>): string {
    return Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
  }

  /**
   * Parse the LLM response to extract tool calls
   * @param content The LLM response content
   * @returns An array of ToolCommand objects
   */
  public parseToolCallFromLlm(content: string): ToolCommand[] {
    // Split content by lines to handle multiple commands
    const lines = content.trim().split('\n').filter(line => line.trim().length > 0);
    const commands: ToolCommand[] = [];

    for (const line of lines) {
      const result = this.llmParser.parseToolCallFromLlm(line);
      if (result !== null) {
        commands.push(result);
      }
    }

    return commands;
  }
}
