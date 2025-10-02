// Strict TypeScript module for Mira Sidebar Chat RoleOrchestrator

// --- Role Types ---
export type SupportedRole =
  | "Architect"
  | "Developer"
  | "Debugger"
  | "DataEngineer"
  | "DocEngineer"
  | "PM";

export type RoleChain = SupportedRole[];

// --- Intent Types ---
export type Intent =
  | "planning"
  | "coding"
  | "debugging"
  | "data"
  | "documentation"
  | "management"
  | "unknown";

// --- Role Templates (Example) ---
export interface RoleTemplate {
  role: SupportedRole;
  description: string;
  examplePrompt: string;
}

export const RoleTemplates: Record<SupportedRole, RoleTemplate> = {
  Architect: {
    role: "Architect",
    description: "Designs system architecture, plans features, and outlines solutions.",
    examplePrompt: "Design a scalable architecture for a chat application."
  },
  Developer: {
    role: "Developer",
    description: "Implements features, writes and refactors code.",
    examplePrompt: "Implement the user authentication module."
  },
  Debugger: {
    role: "Debugger",
    description: "Identifies, analyzes, and fixes bugs or errors in the system.",
    examplePrompt: "Debug the login failure issue reported by users."
  },
  DataEngineer: {
    role: "DataEngineer",
    description: "Handles data pipelines, ETL, and database optimization.",
    examplePrompt: "Optimize the data ingestion pipeline for real-time analytics."
  },
  DocEngineer: {
    role: "DocEngineer",
    description: "Creates and maintains technical documentation.",
    examplePrompt: "Document the API endpoints for the new feature."
  },
  PM: {
    role: "PM",
    description: "Coordinates project management, requirements, and delivery.",
    examplePrompt: "Outline the project milestones and delivery schedule."
  }
};

// --- Intent Classification ---
export function classifyIntent(input: string): Intent {
  const text = input.toLowerCase();
  if (/plan|design|architecture|outline/.test(text)) return "planning";
  if (/code|implement|develop|refactor/.test(text)) return "coding";
  if (/debug|error|bug|fix/.test(text)) return "debugging";
  if (/data|etl|pipeline|database|analytics/.test(text)) return "data";
  if (/doc|document|explain|comment/.test(text)) return "documentation";
  if (/project|milestone|schedule|manage|pm\b/.test(text)) return "management";
  return "unknown";
}

// --- Default Role Chains ---
export const DefaultRoleChains: Record<Intent, RoleChain> = {
  planning: ["Architect", "PM"],
  coding: ["Developer"],
  debugging: ["Debugger", "Developer"],
  data: ["DataEngineer", "Developer"],
  documentation: ["DocEngineer", "Developer"],
  management: ["PM"],
  unknown: ["PM"]
};

// --- RoleOrchestrator Class ---
export interface OrchestratorOptions {
  customChains?: Partial<Record<Intent, RoleChain>>;
}

export class RoleOrchestrator {
  private chains: Record<Intent, RoleChain>;

  constructor(options: OrchestratorOptions = {}) {
    this.chains = { ...DefaultRoleChains, ...options.customChains };
  }

  // Main entry: classify and route input to the appropriate role chain
  public async handleRequest(input: string, context: any = {}): Promise<any> {
    const intent = classifyIntent(input);
    const roleChain = this.chains[intent] || DefaultRoleChains.unknown;

    let lastOutput: any = input;
    for (const role of roleChain) {
      lastOutput = await this.invokeRoleStub(role, lastOutput, context);
    }
    return lastOutput;
  }

  // Stub: Simulate role execution (replace with real LLM/tool logic in integration)
  private async invokeRoleStub(role: SupportedRole, input: any, context: any): Promise<any> {
    // Simulate role processing with a stub
    return {
      role,
      processed: true,
      input,
      context,
      note: `Stub: ${role} processed the input.`
    };
  }

  // Expose role templates for UI or integration
  public static getRoleTemplates(): Record<SupportedRole, RoleTemplate> {
    return RoleTemplates;
  }

  // Expose current chains for inspection
  public getRoleChains(): Record<Intent, RoleChain> {
    return this.chains;
  }
}