import * as vscode from 'vscode';

/**
 * Formats the response from the MCP server for better readability
 */
export class ResponseFormatter {
  /**
   * Format a response based on its content type and structure
   */
  public static format(response: any): string {
    // If response is already a string, check if it's JSON
    if (typeof response === 'string') {
      try {
        // Try to parse as JSON to format it
        const parsedJson = JSON.parse(response);
        return this.formatJsonResponse(parsedJson);
      } catch (error) {
        // Not JSON, return as is or apply other formatting
        return this.formatTextResponse(response);
      }
    }

    // Object response - format as JSON
    return this.formatJsonResponse(response);
  }

  /**
   * Format a text response for better readability
   */
  private static formatTextResponse(text: string): string {
    // Check if it's a code block and add syntax highlighting
    const codeBlockMatch = text.match(/```(\w*)\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      const language = codeBlockMatch[1] || 'text';
      const code = codeBlockMatch[2];

      // Keep the code block format for the chat view which supports markdown
      return text;
    }

    // Apply general text formatting improvements
    return text;
  }

  /**
   * Format a JSON response for better readability
   */
  private static formatJsonResponse(json: any): string {
    // Check for common response structures and format accordingly

    // If it's an array of objects, consider formatting as a table
    if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
      // For short arrays, stringify with indentation
      if (json.length <= 10) {
        return JSON.stringify(json, null, 2);
      }
      // For longer arrays, summarize
      return `Array with ${json.length} items:\n${JSON.stringify(json.slice(0, 5), null, 2)}\n...\n(${json.length - 5} more items)`;
    }

    // If it's an error response
    if (json.error) {
      return `Error: ${json.error.message || JSON.stringify(json.error)}`;
    }

    // Default JSON formatting with indentation
    return JSON.stringify(json, null, 2);
  }

  /**
   * Convert the response to Markdown format for saving to a file
   */
  public static toMarkdown(response: any, prompt: string): string {
    const timestamp = new Date().toISOString();
    let markdown = `# MCP Response\n\n*Generated at: ${timestamp}*\n\n## Prompt\n\n${prompt}\n\n## Response\n\n`;

    // Format based on the response type
    if (typeof response === 'string') {
      try {
        // Try to parse as JSON
        const parsedJson = JSON.parse(response);
        markdown += '```json\n' + JSON.stringify(parsedJson, null, 2) + '\n```';
      } catch (error) {
        // Check if it already has markdown code blocks
        if (response.includes('```')) {
          markdown += response;
        } else {
          markdown += response;
        }
      }
    } else {
      // Object response
      markdown += '```json\n' + JSON.stringify(response, null, 2) + '\n```';
    }

    return markdown;
  }
}
