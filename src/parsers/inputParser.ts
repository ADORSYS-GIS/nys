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
   * Parse user input using both LLM and heuristic, post-correcting LLM output if appropriate
   */
  public async parseInput(input: string, useLlmParser: boolean): Promise<{ toolCommand: string | null, wasLlmUsed: boolean }> {
    console.log(`Parsing input: "${input}" with combined LLM and heuristic post-processing.`);

    // Skip parsing if it's already in the correct format
    if (input.startsWith('tool:')) {
      console.log('Input already in tool: format, returning as is');
      return { toolCommand: input, wasLlmUsed: false };
    }

    // Step 1: Run heuristic parser on user input ("classic" mode)
    const heuristicResult = this.heuristicParser.parseInput(input);
    const heuristicConfidence = this.heuristicParser.estimateConfidence(input);

    // If high confidence from heuristics or LLM is disabled, take heuristic directly
    if (heuristicResult && (heuristicConfidence > 0.6 || !useLlmParser)) {
      const formatted = `tool:${heuristicResult.name} ${this.formatParams(heuristicResult.params)}`;
      return { toolCommand: formatted, wasLlmUsed: false };
    }

    // Step 2: Otherwise call LLM
    if (useLlmParser) {
      try {
        const llmResult = await this.llmParser.parseInput(input);

        if (llmResult) {
          const llmCommandRaw = `tool:${llmResult.name} ${this.formatParams(llmResult.params)}`;

          // Now post-process: run heuristic parser on the LLM output
          const heuristicPost = this.heuristicParser.parseInput(llmCommandRaw);
          const heuristicPostConfidence = this.heuristicParser.estimateConfidence(llmCommandRaw);

          // If heuristic parser is at least moderately confident, use/correct its result
          if (heuristicPost && heuristicPostConfidence >= 0.2) {
            const corrected = `tool:${heuristicPost.name} ${this.formatParams(heuristicPost.params)}`;
            if (corrected !== llmCommandRaw) {
              console.log(`[Combiner] Heuristic postprocessing corrected LLM output to: ${corrected}`);
            }
            return { toolCommand: corrected, wasLlmUsed: true }; // true, since LLM parsing was used
          } else {
            // If lower than 0.2, use the raw LLM output (likely not in tool list)
            console.log(`[Combiner] Heuristic postprocessing left LLM output unchanged (confidence ${heuristicPostConfidence})`);
            return { toolCommand: llmCommandRaw, wasLlmUsed: true };
          }
        }
      } catch (err) {
        console.error('LLM parsing failed:', err);
        // Fallback to heuristic if available
        if (heuristicResult) {
          const fallbackHeuristic = `tool:${heuristicResult.name} ${this.formatParams(heuristicResult.params)}`;
          return { toolCommand: fallbackHeuristic, wasLlmUsed: false };
        }
      }
    } else if (heuristicResult) {
      // If LLM is disabled but have even low confidence result
      const lowConf = `tool:${heuristicResult.name} ${this.formatParams(heuristicResult.params)}`;
      return { toolCommand: lowConf, wasLlmUsed: false };
    }

    // No match
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
