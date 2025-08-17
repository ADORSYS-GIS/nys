import * as vscode from 'vscode';
import { HeuristicParser } from './heuristicParser';
import { LlmParser } from './llmParser';

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
   * Parse user input using either LLM or heuristic parser based on the useLlmParser parameter.
   */
  public async parseInput(input: string, useLlmParser: boolean): Promise<{ toolCommand: string | null, wasLlmUsed: boolean }> {
    console.log(`Parsing input: "${input}" with ${useLlmParser ? 'LLM' : 'heuristic parser'}.`);

    // Skip parsing if it's already in the correct format
    if (input.startsWith('tool:')) {
      console.log('Input already in tool: format, returning as is');
      return { toolCommand: input, wasLlmUsed: false };
    }

    // Try heuristic parser first if LLM parser is not requested
    if (!useLlmParser) {
      const heuristicResult = this.heuristicParser.parseInput(input);
      if (heuristicResult) {
        const heuristicCommandRaw = `tool:${heuristicResult.name} ${this.formatParams(heuristicResult.params)}`;
        return { toolCommand: heuristicCommandRaw, wasLlmUsed: false };
      }
    }

    // Use LLM parser if requested or if heuristic parser failed
    if (useLlmParser) {
      try {
        const llmResult = await this.llmParser.parseInput(input);
        if (llmResult) {
          const llmCommandRaw = `tool:${llmResult.name} ${this.formatParams(llmResult.params)}`;
          return { toolCommand: llmCommandRaw, wasLlmUsed: true };
        }
      } catch (err) {
        console.error('LLM parsing failed:', err);
        // Could not parse
      }
    }
    
    // No match
    return { toolCommand: null, wasLlmUsed: useLlmParser };
  }

  /**
   * Format parameters object into a string
   */
  private formatParams(params: Record<string, any>): string {
    return Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
  }
}
