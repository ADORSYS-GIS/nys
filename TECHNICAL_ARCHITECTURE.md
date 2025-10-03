# 🏗️ Mira Technical Architecture - SPARC Workflow System

## 📋 **Overview**

Mira implements a sophisticated workflow-driven development assistant based on the SPARC framework. The system is architected for modularity, extensibility, and persistent state management across VS Code sessions.

## 🎯 **Core Architecture Principles**

### **1. Issue-Driven Development**
- Every development task becomes a structured issue with dedicated folder
- Complete traceability from requirements to implementation
- Persistent state management across sessions

### **2. SPARC Framework Integration**
- **Specification**: Automated requirements extraction and technical specification
- **Pseudocode**: Architecture planning and design documentation
- **Architecture**: Project structure planning and dependency management
- **Refinement**: Iterative improvement and optimization
- **Completion**: Final implementation and testing

### **3. Three-Mode Workflow**
- **Design Mode**: Requirements analysis and specification generation
- **Build Mode**: Code generation and project structure creation
- **Debug Mode**: Issue identification, fixing, and optimization

## 🏛️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Mira Extension Architecture                                                    │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ VS Code         │    │ SPARC Workflow  │    │ Issue Management│              │
│ │ Integration     │    │ Engine          │    │ System          │              │
│ │                 │    │                 │    │                 │              │
│ │ - Extension     │    │ - Design Mode   │    │ - Issue         │              │
│ │   Activation    │    │   Orchestration │    │   Creation      │              │
│ │ - Command       │    │ - Build Mode    │    │ - Folder        │              │
│ │   Registration  │    │   Processing    │    │   Management    │              │
│ │ - Webview       │    │ - Debug Mode    │    │ - State         │              │
│ │   Management    │    │   Analysis      │    │   Tracking      │              │
│ │ - Event         │    │ - Mode          │    │ - File          │              │
│ │   Handling      │    │   Transitions   │    │   Operations    │              │
│ │                 │    │                 │    │                 │              │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ Tool Integration│    │ State           │    │ File System     │              │
│ │ Layer           │    │ Management      │    │ Integration     │              │
│ │                 │    │                 │    │                 │              │
│ │ - Built-in      │    │ - Workflow      │    │ - Project       │              │
│ │   Tools         │    │   State         │    │   Files         │              │
│ │ - MCP Server    │    │ - Issue State   │    │ - Issue         │              │
│ │   Integration   │    │ - Session       │    │   Folders       │              │
│ │ - External      │    │   Persistence   │    │ - Output        │              │
│ │   APIs          │    │ - Cross-session │    │   Management    │              │
│ │ - Custom Tools  │    │   Continuity    │    │ - Version       │              │
│ │                 │    │                 │    │   Control       │              │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 **Core Components**

### **1. Extension Entry Point (`extension.ts`)**

```typescript
// Main extension activation and command registration
export function activate(context: vscode.ExtensionContext) {
  // Register Mira sidebar view provider
  const issueProvider = new IssueViewProvider(context.extensionUri);
  
  // Register workflow commands
  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-mcp-client.createIssue', ...),
    vscode.commands.registerCommand('vscode-mcp-client.switchToDesignMode', ...),
    vscode.commands.registerCommand('vscode-mcp-client.switchToBuildMode', ...),
    vscode.commands.registerCommand('vscode-mcp-client.switchToDebugMode', ...)
  );
}
```

**Responsibilities**:
- Extension lifecycle management
- Command registration and handling
- Webview provider initialization
- Event subscription management

### **2. Issue View Provider (`issueViewProvider.ts`)**

```typescript
export class IssueViewProvider implements vscode.WebviewViewProvider {
  private _issues: Issue[] = [];
  private _currentIssue: Issue | null = null;
  private _nysFolder: vscode.Uri | null = null;
  
  // Issue management methods
  public async createIssue(title: string, description: string): Promise<void>
  public async switchMode(mode: 'design' | 'build' | 'debug'): Promise<void>
  private async handleUserMessage(message: string, mode?: string): Promise<void>
}
```

**Responsibilities**:
- Issue creation and management
- Mode switching and state tracking
- Webview communication and UI updates
- File system operations for issue folders

### **3. SPARC Workflow Engine (`sparcWorkflowEngine.ts`)**

```typescript
export class SPARCWorkflowEngine {
  // Design Mode - SPARC: Specification
  public async processDesignMode(prompt: string, issue: Issue): Promise<void>
  
  // Build Mode - SPARC: Pseudocode + Architecture
  public async processBuildMode(issue: Issue): Promise<void>
  
  // Debug Mode - SPARC: Refinement + Completion
  public async processDebugMode(issue: Issue): Promise<void>
  
  // Tool integration
  private async useBuiltInTools(toolName: string, params: any): Promise<any>
  private async useMCPServer(serverName: string, operation: string): Promise<any>
}
```

**Responsibilities**:
- Workflow orchestration and mode-specific processing
- Tool integration and external service communication
- File generation and project structure management
- State management and progress tracking

### **4. Issue Management System**

```typescript
export interface Issue {
  id: string;
  title: string;
  description: string;
  mode: 'design' | 'build' | 'debug';
  status: 'open' | 'in-progress' | 'completed' | 'blocked';
  todos: Todo[];
  createdAt: Date;
  updatedAt: Date;
  filePath: string;
}

export interface IssueStatus {
  id: string;
  title: string;
  currentMode: 'design' | 'build' | 'debug';
  progress: {
    design: number;
    build: number;
    debug: number;
  };
  status: 'open' | 'in-progress' | 'completed' | 'blocked';
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  nextSteps: string[];
}
```

**Responsibilities**:
- Issue data structure and validation
- State persistence and retrieval
- Progress tracking and status updates
- File system integration for issue folders

## 📁 **File System Architecture**

### **Issue Folder Structure**

```
/issues/ISSUE-001/
├── requirements.md      # Technical specifications (Design Mode output)
├── guidelines.md        # Development standards (Design Mode output)
├── notes.md            # Development process (Debug Mode updates)
├── status.json         # Current state and progress tracking
```

### **State Management**

```
/.nys/                  # Extension state directory
├── issues/             # Issue folders
│   ├── ISSUE-001/
│   ├── ISSUE-002/
│   └── ...
├── config/             # Extension configuration
│   ├── settings.json
│   └── tool-config.json
└── cache/              # Temporary cache files
    ├── mcp-servers.json
    └── tool-results.json
```

## 🔄 **Workflow Processing**

### **Design Mode Processing**

```typescript
async processDesignMode(prompt: string, issue: Issue): Promise<void> {
  // 1. Analyze user prompt and project context
  const analysis = await this.analyzePrompt(prompt, issue);
  
  // 2. Generate requirements specification
  const requirements = await this.generateRequirements(analysis);
  
  // 3. Generate development guidelines
  const guidelines = await this.generateGuidelines(analysis, requirements);
  
  // 4. Write files to issue folder
  await this.writeRequirementsFile(issue, requirements);
  await this.writeGuidelinesFile(issue, guidelines);
  
  // 5. Update issue status
  await this.updateIssueStatus(issue, 'design', 100);
}
```

### **Build Mode Processing**

```typescript
async processBuildMode(issue: Issue): Promise<void> {
  // 1. Read requirements and guidelines
  const requirements = await this.readRequirementsFile(issue);
  const guidelines = await this.readGuidelinesFile(issue);
  
  // 2. Plan project structure
  const structure = await this.planProjectStructure(requirements, guidelines);
  
  // 3. Generate source code
  const codeFiles = await this.generateSourceCode(requirements, guidelines);
  
  // 4. Generate tests and documentation
  const tests = await this.generateTests(codeFiles, requirements);
  const docs = await this.generateDocumentation(codeFiles, requirements);
  
  // 5. Write files to outputs directory
  await this.writeOutputFiles(issue, { codeFiles, tests, docs });
  
  // 6. Update issue status
  await this.updateIssueStatus(issue, 'build', 100);
}
```

### **Debug Mode Processing**

```typescript
async processDebugMode(issue: Issue): Promise<void> {
  // 1. Analyze existing code
  const codeAnalysis = await this.analyzeExistingCode(issue);
  
  // 2. Identify issues and improvements
  const issues = await this.identifyIssues(codeAnalysis);
  const improvements = await this.identifyImprovements(codeAnalysis);
  
  // 3. Generate fixes
  const fixes = await this.generateFixes(issues, improvements);
  
  // 4. Apply fixes to project files
  await this.applyFixes(fixes);
  
  // 5. Update notes and status
  await this.updateDebugNotes(issue, issues, fixes);
  await this.updateIssueStatus(issue, 'debug', 100);
}
```

## 🛠️ **Tool Integration Architecture**

### **Built-in Tools**

```typescript
export class BuiltInTools {
  // Computation tools
  public async calculate(expression: string): Promise<number>
  public async processData(data: any, operation: string): Promise<any>
  
  // Search tools
  public async searchCode(query: string, scope: string): Promise<SearchResult[]>
  public async searchWeb(query: string): Promise<WebSearchResult[]>
  
  // File operations
  public async readFile(path: string): Promise<string>
  public async writeFile(path: string, content: string): Promise<void>
  public async createDirectory(path: string): Promise<void>
  
  // Code analysis
  public async analyzeSyntax(code: string, language: string): Promise<SyntaxAnalysis>
  public async analyzeDependencies(projectPath: string): Promise<DependencyAnalysis>
}
```

### **MCP Server Integration**

```typescript
export class MCPServerManager {
  private servers: Map<string, MCPServer> = new Map();
  
  public async connectServer(config: MCPServerConfig): Promise<void>
  public async disconnectServer(serverId: string): Promise<void>
  public async executeTool(serverId: string, toolName: string, params: any): Promise<any>
  public async listAvailableTools(serverId: string): Promise<ToolDefinition[]>
}

export interface MCPServerConfig {
  id: string;
  name: string;
  type: 'http' | 'websocket' | 'stdio';
  endpoint?: string;
  command?: string;
  args?: string[];
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
  };
}
```

## 🧠 **State Management**

### **Workflow State**

```typescript
export interface WorkflowState {
  currentMode: 'design' | 'build' | 'debug';
  currentStep: string;
  progress: {
    design: number;
    build: number;
    debug: number;
  };
  lastActivity: string;
  nextSteps: string[];
  errorState?: {
    error: string;
    recovery: string;
    timestamp: Date;
  };
}
```

### **Session Persistence**

```typescript
export class StateManager {
  private stateFile: vscode.Uri;
  
  public async saveState(state: WorkflowState): Promise<void>
  public async loadState(): Promise<WorkflowState | null>
  public async clearState(): Promise<void>
  public async backupState(): Promise<void>
  public async restoreState(backupId: string): Promise<void>
}
```

## 🔌 **Extension Integration**

### **VS Code API Integration**

```typescript
// Command registration
vscode.commands.registerCommand('mira.createIssue', async () => {
  const title = await vscode.window.showInputBox({
    prompt: 'Issue Title',
    placeHolder: 'Enter a descriptive title for your issue'
  });
  // ... handle issue creation
});

// Webview provider
vscode.window.registerWebviewViewProvider(
  IssueViewProvider.viewType, 
  issueProvider
);

// File system watchers
vscode.workspace.onDidChangeFiles((event) => {
  // Handle file changes for issue folders
});

// Terminal integration
const terminal = vscode.window.createTerminal(`Build: ${issue.title}`);
terminal.sendText('npm run build');
```

### **Configuration Management**

```typescript
export class ConfigurationManager {
  public getSetting<T>(key: string): T | undefined
  public setSetting<T>(key: string, value: T): void
  public getWorkspaceSetting<T>(key: string): T | undefined
  public setWorkspaceSetting<T>(key: string, value: T): void
  
  // Tool configuration
  public getToolConfig(toolName: string): ToolConfig | undefined
  public setToolConfig(toolName: string, config: ToolConfig): void
  
  // MCP server configuration
  public getMCPServerConfig(serverId: string): MCPServerConfig | undefined
  public setMCPServerConfig(serverId: string, config: MCPServerConfig): void
}
```

## 🚀 **Performance Considerations**

### **Caching Strategy**

```typescript
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  
  public async get<T>(key: string): Promise<T | null>
  public async set<T>(key: string, value: T, ttl?: number): Promise<void>
  public async invalidate(pattern: string): Promise<void>
  public async clear(): Promise<void>
}
```

### **Async Processing**

```typescript
export class AsyncProcessor {
  private queue: ProcessingQueue = new ProcessingQueue();
  
  public async processWorkflow(workflow: Workflow): Promise<void> {
    // Process workflow steps asynchronously
    for (const step of workflow.steps) {
      await this.queue.add(step);
    }
  }
  
  public async processInBackground(task: BackgroundTask): Promise<void> {
    // Handle long-running tasks in background
    setImmediate(() => this.executeTask(task));
  }
}
```

## 🔒 **Security Considerations**

### **File System Security**

```typescript
export class SecurityManager {
  public validateFilePath(path: string): boolean {
    // Prevent directory traversal attacks
    return !path.includes('..') && path.startsWith(this.workspaceRoot);
  }
  
  public sanitizeInput(input: string): string {
    // Sanitize user input to prevent injection attacks
    return input.replace(/[<>\"'&]/g, '');
  }
  
  public validateMCPServer(config: MCPServerConfig): boolean {
    // Validate MCP server configuration
    return this.isValidEndpoint(config.endpoint) && 
           this.isValidAuth(config.auth);
  }
}
```

### **Data Privacy**

```typescript
export class PrivacyManager {
  public async encryptSensitiveData(data: any): Promise<string>
  public async decryptSensitiveData(encryptedData: string): Promise<any>
  public async maskLogData(data: any): Promise<any>
  public async anonymizeUserData(data: any): Promise<any>
}
```

This technical architecture provides a robust foundation for the Mira SPARC workflow system, ensuring scalability, maintainability, and extensibility while maintaining security and performance standards.
