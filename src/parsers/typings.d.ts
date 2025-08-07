// Type definitions for parsers
// Type definitions for parsers

interface ToolCommand {
  name: string;
  params: Record<string, any>;
}

interface ParseResult {
  toolCommand: string | null;
  wasLlmUsed: boolean;
}

interface ToolParameter {
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
}

interface Tool {
  name: string;
  description?: string;
  parameters?: ToolParameter[];
}
interface ToolCommand {
  name: string;
  params: Record<string, any>;
}

interface ParseResult {
  toolCommand: string | null;
  wasLlmUsed: boolean;
}

interface ToolParameter {
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
}

interface Tool {
  name: string;
  description?: string;
  parameters?: ToolParameter[];
}
