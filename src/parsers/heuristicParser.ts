import * as vscode from 'vscode';

interface ToolCommand {
  name: string;
  params: Record<string, any>;
}

/**
 * A local heuristic parser that tries to convert natural language to structured tool commands
 * without using external LLM APIs.
 */
export class HeuristicParser {
  // Store available tools to help with parsing
  private availableTools: any[] = [];

  /**
   * Update the list of available tools to improve parsing accuracy
   */
  public setAvailableTools(tools: any[]) {
    this.availableTools = tools;
  }

  /**
   * Parse natural language input into a structured tool command
   * Returns null if no clear command structure could be determined
   */
  public parseInput(input: string): ToolCommand | null {
    // Quick pass - if it's already in the correct format, return as is
    if (input.startsWith('tool:')) {
      return this.parseStructuredInput(input);
    }

    // Check for common tool patterns
    const toolMatches = this.matchToolCommand(input);
    if (toolMatches) {
      return toolMatches;
    }

    // No clear tool command detected
    return null;
  }

  /**
   * Estimates the confidence level of the parsing from 0.0 to 1.0
   * This helps decide when to use LLM fallback
   */
  public estimateConfidence(input: string): number {
    // Already in tool format = 100% confident
    if (input.startsWith('tool:')) {
      return 1.0;
    }

    // Contains clear tool mentions
    const toolMatch = this.matchToolCommand(input);
    if (toolMatch) {
      return 0.8; // High confidence but not 100%
    }

    // Fallback case - low confidence
    return 0.2;
  }

  /**
   * Parse input that's already in the structured tool:name param=value format
   */
  private parseStructuredInput(input: string): ToolCommand {
    const [toolPrefix, ...paramParts] = input.split(' ');
    const toolName = toolPrefix.substring(5); // Remove 'tool:' prefix

    // Parse parameters from the format param=value
    const params: Record<string, any> = {};
    for (const part of paramParts) {
      const [key, value] = part.split('=');
      if (key && value) {
        // Try to convert numbers and booleans
        if (value === 'true') params[key] = true;
        else if (value === 'false') params[key] = false;
        else if (!isNaN(Number(value))) params[key] = Number(value);
        else params[key] = value;
      }
    }

    return { name: toolName, params };
  }

  /**
   * Try to match the input against known tool command patterns
   */
  private matchToolCommand(input: string): ToolCommand | null {
    // Normalize input for better matching
    const normalizedInput = input.toLowerCase().trim();

    // Check if input directly mentions a tool by name
    for (const tool of this.availableTools) {
      const toolName = tool.name.toLowerCase();

      // Special case for list_issues command
      if (toolName === 'list_issues' && 
          (normalizedInput.includes('list issues') || 
           normalizedInput.includes('list_issues') || 
           normalizedInput.includes('show issues'))) {
        // Extract repository owner and name
        const ownerMatch = input.match(/(?:owned by|from|by)\s+([\w.-]+)/i);
        const repoMatch = input.match(/(?:repository|repo)\s+([\w.-]+)/i);
        const stateMatch = input.match(/(?:state|status)\s+([\w]+)/i);

        const params: Record<string, any> = {};

        if (ownerMatch && ownerMatch[1]) {
          params.owner = ownerMatch[1];
        }

        if (repoMatch && repoMatch[1]) {
          params.repo = repoMatch[1];
        }

        if (stateMatch && stateMatch[1]) {
          params.state = stateMatch[1];
        }

        // Check for direct mentions of repositories in owner/repo format
        const directRepoMatch = input.match(/([\w.-]+)\/([\w.-]+)/i);
        if (directRepoMatch) {
          params.owner = directRepoMatch[1];
          params.repo = directRepoMatch[2];
        }

        return {
          name: 'list_issues',
          params
        };
      }

      // Check if input starts with or clearly mentions using the tool
      const usagePhrases = [
        `use ${toolName}`,
        `run ${toolName}`,
        `execute ${toolName}`,
        `${toolName} tool`,
        `with ${toolName}`,
        toolName // Just the tool name itself
      ];

      if (normalizedInput.startsWith(toolName) || 
          usagePhrases.some(phrase => normalizedInput.includes(phrase))) {

        // Try to extract parameters
        const params = this.extractParameters(input, tool);
        return {
          name: tool.name,
          params
        };
      }
    }

    // Check for specific tool patterns if no direct matches
    return this.checkSpecificToolPatterns(normalizedInput);
  }

  /**
   * Extract parameters from natural language based on known parameter names
   */
  private extractParameters(input: string, tool: any): Record<string, any> {
    const params: Record<string, any> = {};

    // Skip if no parameters defined for this tool
    if (!tool.parameters || !Array.isArray(tool.parameters)) {
      return params;
    }

    // Look for each parameter
    for (const param of tool.parameters) {
      const paramName = param.name;
      if (!paramName) continue;

      // Try to extract value with format "paramName: value" or "paramName=value"
      const patterns = [
        new RegExp(`${paramName}[\s]*[:=][\s]*([\w.-]+)`, 'i'),
        new RegExp(`${paramName}[\s]+([\w.-]+)`, 'i'),
        new RegExp(`for[\s]+${paramName}[\s]+use[\s]+([\w.-]+)`, 'i'),
        new RegExp(`with[\s]+${paramName}[\s]+([\w.-]+)`, 'i')
      ];

      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
          // Convert the value to appropriate type
          const value = match[1].trim();
          if (value === 'true') params[paramName] = true;
          else if (value === 'false') params[paramName] = false;
          else if (!isNaN(Number(value))) params[paramName] = Number(value);
          else params[paramName] = value;
          break;
        }
      }
    }

    return params;
  }

  /**
   * Check for specific tool command patterns not tied to tool names
   */
  private checkSpecificToolPatterns(input: string): ToolCommand | null {
    const normalizedInput = input.toLowerCase().trim();

    // GitHub Issue commands
    if (normalizedInput.includes('list issues') || normalizedInput.includes('show issues') || 
        normalizedInput.includes('get issues') || normalizedInput.includes('find issues')) {
      // Extract repository owner and name
      const ownerMatch = input.match(/(?:owned by|from|by|owner)\s+([\w.-]+)/i);
      const repoMatch = input.match(/(?:repository|repo|in)\s+([\w.-]+)/i);

      const params: Record<string, any> = {};

      if (ownerMatch && ownerMatch[1]) {
        params.owner = ownerMatch[1];
      }

      if (repoMatch && repoMatch[1]) {
        params.repo = repoMatch[1];
      }

      // Check for direct mentions of repositories in owner/repo format
      const directRepoMatch = input.match(/([\w.-]+)\/([\w.-]+)/i);
      if (directRepoMatch) {
        params.owner = directRepoMatch[1];
        params.repo = directRepoMatch[2];
      }

      // State parameter
      if (normalizedInput.includes('closed')) {
        params.state = 'closed';
      } else if (normalizedInput.includes('all issues')) {
        params.state = 'all';
      } else {
        params.state = 'open';
      }

      // If we have enough params, return the command
      if (params.owner && params.repo) {
        return {
          name: 'list_issues',
          params
        };
      }
    }

    // GitHub Repository commands
    if (normalizedInput.includes('list repos') || normalizedInput.includes('show repositories') || 
        normalizedInput.includes('get repositories') || normalizedInput.includes('find repos')) {

      const ownerMatch = input.match(/(?:owned by|from|by|owner)\s+([\w.-]+)/i);

      if (ownerMatch && ownerMatch[1]) {
        return {
          name: 'list_repositories',
          params: {
            owner: ownerMatch[1]
          }
        };
      }
    }

    // UUID Generation
    if (input.match(/generate.*uuid|create.*uuid|get.*uuid|new.*uuid/i)) {
      return { name: 'generateUUID', params: {} };
    }

    // Ping command pattern
    const pingMatch = input.match(/ping\s+(\S+)(\s+with\s+(\d+)\s+packets)?/i);
    if (pingMatch) {
      const params: Record<string, any> = { host: pingMatch[1] };
      if (pingMatch[3]) {
        params.count = parseInt(pingMatch[3]);
      }
      return { name: 'ping', params };
    }

    // HTTP Request pattern
    const httpMatch = input.match(/(?:send|make)\s+(?:a\s+)?(get|post|put|delete)\s+(?:request\s+)?(?:to\s+)?(https?:\/\/\S+)/i);
    if (httpMatch) {
      return {
        name: 'httpRequest',
        params: {
          method: httpMatch[1].toUpperCase(),
          url: httpMatch[2]
        }
      };
    }

    // No specific pattern matched
    return null;
  }
}
