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
   * Parse user input using appropriate parser based on settings and complexity
   */
  public async parseInput(input: string, useLlmParser: boolean): Promise<{ toolCommand: string | null, wasLlmUsed: boolean }> {
    // Log for debugging
    console.log(`Parsing input: "${input}" with LLM parser ${useLlmParser ? 'enabled' : 'disabled'}`);

    // Skip parsing if it's already in the correct format
    if (input.startsWith('tool:')) {
      console.log('Input already in tool: format, returning as is');
      return { toolCommand: input, wasLlmUsed: false };
    }

    // First try the heuristic parser
    console.log('Trying heuristic parser...');
    const heuristicResult = this.heuristicParser.parseInput(input);
    const confidence = this.heuristicParser.estimateConfidence(input);

    console.log(`Heuristic parser result: ${heuristicResult ? JSON.stringify(heuristicResult) : 'null'} with confidence ${confidence}`);

    // If we have a high confidence result or LLM is disabled, return the heuristic result
    if (heuristicResult && (confidence > 0.6 || !useLlmParser)) {
      const formattedCommand = `tool:${heuristicResult.name} ${this.formatParams(heuristicResult.params)}`;
      console.log(`Using heuristic result: ${formattedCommand}`);
      return { 
        toolCommand: formattedCommand, 
        wasLlmUsed: false 
      };
    }

    // If LLM parsing is enabled and we have low confidence, try LLM parsing
    if (useLlmParser) {
      console.log('Trying LLM parser...');
      try {
        const llmResult = await this.llmParser.parseInput(input);
        console.log(`LLM parser result: ${llmResult ? JSON.stringify(llmResult) : 'null'}`);

        if (llmResult) {
          const formattedCommand = `tool:${llmResult.name} ${this.formatParams(llmResult.params)}`;
          console.log(`Using LLM result: ${formattedCommand}`);
          return { 
            toolCommand: formattedCommand, 
            wasLlmUsed: true 
          };
        }
      } catch (error) {
        console.error('LLM parsing failed:', error);
        // Fall back to heuristic result if LLM fails
        if (heuristicResult) {
          const formattedCommand = `tool:${heuristicResult.name} ${this.formatParams(heuristicResult.params)}`;
          console.log(`LLM failed, falling back to heuristic: ${formattedCommand}`);
          return { 
            toolCommand: formattedCommand, 
            wasLlmUsed: false 
          };
        }
      }
    } else if (heuristicResult) {
      // If LLM is disabled but we have a low confidence heuristic result, still try to use it
      const formattedCommand = `tool:${heuristicResult.name} ${this.formatParams(heuristicResult.params)}`;
      console.log(`LLM disabled, using low confidence heuristic: ${formattedCommand}`);
      return { 
        toolCommand: formattedCommand, 
        wasLlmUsed: false 
      };
    }

    // No clear tool command detected, treat as regular prompt
    console.log('No tool command detected, treating as regular prompt');
    return { toolCommand: null, wasLlmUsed: false };
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
