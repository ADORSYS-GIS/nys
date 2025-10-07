import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SimpleGraphSPARCWorkflow, WorkflowInput, WorkflowOutput } from './simpleGraphWorkflow';

export interface SPARCWorkflowState {
  issueId: string;
  currentPhase: 'specification' | 'pseudocode' | 'architecture' | 'refinement' | 'completion';
  mode: 'design' | 'build' | 'debug';
  progress: number;
  artifacts: {
    requirements?: string;
    guidelines?: string;
    pseudocode?: string;
    architecture?: string;
    implementation?: string;
    tests?: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class SPARCWorkflowEngine {
  private _nysFolder: vscode.Uri | null = null;
  private _simpleGraphWorkflow: SimpleGraphSPARCWorkflow | null = null;
  private _useGraphOrchestration: boolean = true;

  constructor(private readonly workspaceRoot: vscode.Uri) {
    this.initializeNysFolder();
    this.initializeSimpleGraphWorkflow();
  }

  private async initializeNysFolder(): Promise<void> {
    this._nysFolder = vscode.Uri.joinPath(this.workspaceRoot, '.nys');
    
    try {
      await vscode.workspace.fs.stat(this._nysFolder);
    } catch {
      await vscode.workspace.fs.createDirectory(this._nysFolder);
    }
  }

  private initializeSimpleGraphWorkflow(): void {
    try {
      this._simpleGraphWorkflow = new SimpleGraphSPARCWorkflow(this.workspaceRoot);
      console.log('Simple Graph workflow initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Simple Graph workflow:', error);
      this._useGraphOrchestration = false;
    }
  }

  public async processIssue(
    issueId: string, 
    mode: 'design' | 'build' | 'debug', 
    userInput: string
  ): Promise<SPARCWorkflowState> {
    
    // Use Simple Graph workflow if available and enabled
    if (this._useGraphOrchestration && this._simpleGraphWorkflow) {
      return await this.processIssueWithSimpleGraph(issueId, mode, userInput);
    }
    
    // Fallback to original implementation
    return await this.processIssueLegacy(issueId, mode, userInput);
  }

  private async processIssueWithSimpleGraph(
    issueId: string, 
    mode: 'design' | 'build' | 'debug', 
    userInput: string
  ): Promise<SPARCWorkflowState> {
    try {
      console.log(`[SPARC] Processing issue ${issueId} with Simple Graph workflow`);
      
      // Check if workflow already exists
      const existingState = await this._simpleGraphWorkflow!.loadWorkflowState(issueId);
      
      if (existingState) {
        // Continue existing workflow
        console.log(`[SPARC] Continuing existing workflow for issue ${issueId}`);
        // For now, we'll create a new workflow input to continue
        const workflowInput: WorkflowInput = {
          issueId,
          mode: existingState.currentMode,
          userInput,
          issueTitle: existingState.issueTitle,
          issueDescription: existingState.issueDescription
        };
        
        const output = await this._simpleGraphWorkflow!.executeWorkflow(workflowInput);
        return this.convertGraphStateToSPARCState(output.state);
      } else {
        // Create new workflow
        console.log(`[SPARC] Creating new workflow for issue ${issueId}`);
        const workflowInput: WorkflowInput = {
          issueId,
          mode,
          userInput,
          issueTitle: `Issue ${issueId}`,
          issueDescription: userInput
        };
        
        const output = await this._simpleGraphWorkflow!.executeWorkflow(workflowInput);
        return this.convertGraphStateToSPARCState(output.state);
      }
    } catch (error) {
      console.error(`[SPARC] Simple Graph workflow failed for issue ${issueId}:`, error);
      // Fallback to legacy implementation
      return await this.processIssueLegacy(issueId, mode, userInput);
    }
  }

  private async processIssueLegacy(
    issueId: string, 
    mode: 'design' | 'build' | 'debug', 
    userInput: string
  ): Promise<SPARCWorkflowState> {
    console.log(`[SPARC] Processing issue ${issueId} with legacy workflow`);
    
    // Load or create workflow state
    let state = await this.loadWorkflowState(issueId);
    if (!state) {
      state = this.createInitialState(issueId, mode);
    }

    // Update state based on mode
    state.mode = mode;
    state.updatedAt = new Date();

    // Process based on current mode and phase
    switch (mode) {
      case 'design':
        await this.processDesignPhase(state, userInput);
        break;
      case 'build':
        await this.processBuildPhase(state, userInput);
        break;
      case 'debug':
        await this.processDebugPhase(state, userInput);
        break;
    }

    // Save updated state
    await this.saveWorkflowState(state);

    return state;
  }

  private convertGraphStateToSPARCState(graphState: any): SPARCWorkflowState {
    return {
      issueId: graphState.issueId,
      currentPhase: graphState.currentPhase,
      mode: graphState.currentMode,
      progress: graphState.progress,
      artifacts: graphState.artifacts,
      createdAt: graphState.createdAt,
      updatedAt: graphState.updatedAt
    };
  }

  private createInitialState(issueId: string, mode: 'design' | 'build' | 'debug'): SPARCWorkflowState {
    return {
      issueId,
      currentPhase: 'specification',
      mode,
      progress: 0,
      artifacts: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async processDesignPhase(state: SPARCWorkflowState, userInput: string): Promise<void> {
    switch (state.currentPhase) {
      case 'specification':
        state.artifacts.requirements = await this.generateRequirements(userInput);
        state.currentPhase = 'pseudocode';
        state.progress = 25;
        break;
      case 'pseudocode':
        state.artifacts.pseudocode = await this.generatePseudocode(userInput, state.artifacts.requirements);
        state.currentPhase = 'architecture';
        state.progress = 50;
        break;
      case 'architecture':
        state.artifacts.architecture = await this.generateArchitecture(userInput, state.artifacts);
        state.artifacts.guidelines = await this.generateGuidelines(userInput, state.artifacts);
        state.currentPhase = 'refinement';
        state.progress = 75;
        break;
      case 'refinement':
        state.artifacts.requirements = await this.refineRequirements(state.artifacts.requirements || '', userInput);
        state.currentPhase = 'completion';
        state.progress = 100;
        break;
    }
  }

  private async processBuildPhase(state: SPARCWorkflowState, userInput: string): Promise<void> {
    if (state.currentPhase !== 'completion') {
      // Build phase requires design to be complete
      state.artifacts.notes = (state.artifacts.notes || '') + 
        `\n[${new Date().toISOString()}] Build requested but design incomplete. Current phase: ${state.currentPhase}`;
      return;
    }

    // Generate implementation based on design artifacts
    state.artifacts.implementation = await this.generateImplementation(userInput, state.artifacts);
    state.artifacts.tests = await this.generateTests(userInput, state.artifacts);
    
    state.progress = 100;
  }

  private async processDebugPhase(state: SPARCWorkflowState, userInput: string): Promise<void> {
    // Debug phase can work with any existing artifacts
    const debugNotes = await this.analyzeAndDebug(userInput, state.artifacts);
    state.artifacts.notes = (state.artifacts.notes || '') + 
      `\n[${new Date().toISOString()}] Debug Analysis:\n${debugNotes}`;
  }

  // Artifact generation methods (simplified for demonstration)
  private async generateRequirements(userInput: string): Promise<string> {
    return `# Requirements Specification

## User Input
${userInput}

## Extracted Requirements
- Core functionality: [To be defined based on input analysis]
- Technical constraints: [To be identified]
- Performance requirements: [To be specified]
- Integration points: [To be mapped]

## Acceptance Criteria
- [ ] Feature 1: [Description]
- [ ] Feature 2: [Description]
- [ ] Feature 3: [Description]

*Generated by SPARC Workflow Engine - Design Phase*`;
  }

  private async generatePseudocode(_userInput: string, _requirements?: string): Promise<string> {
    return `# Pseudocode

## Algorithm Overview
Based on requirements analysis, here's the high-level algorithm:

\`\`\`
BEGIN
  // Initialize system components
  INITIALIZE components
  
  // Main processing loop
  FOR each input item DO
    PROCESS item according to requirements
    VALIDATE output
    STORE result
  END FOR
  
  // Cleanup and finalization
  CLEANUP resources
  RETURN results
END
\`\`\`

## Key Functions
- \`processItem()\`: Core processing logic
- \`validateOutput()\`: Result validation
- \`storeResult()\`: Data persistence

*Generated by SPARC Workflow Engine - Pseudocode Phase*`;
  }

  private async generateArchitecture(_userInput: string, _artifacts: any): Promise<string> {
    return `# System Architecture

## Overview
High-level system design based on requirements and pseudocode analysis.

## Components
- **Core Module**: Main processing logic
- **Data Layer**: Data persistence and retrieval
- **Interface Layer**: External API and user interface
- **Validation Layer**: Input/output validation

## Dependencies
- Framework: [To be specified]
- Database: [To be specified]
- External APIs: [To be identified]

## Data Flow
1. Input → Validation Layer
2. Validation → Core Module
3. Core Module → Data Layer
4. Data Layer → Interface Layer
5. Interface Layer → Output

*Generated by SPARC Workflow Engine - Architecture Phase*`;
  }

  private async generateGuidelines(_userInput: string, _artifacts: any): Promise<string> {
    return `# Development Guidelines

## Coding Standards
- Use consistent naming conventions
- Follow SOLID principles
- Implement proper error handling
- Write comprehensive tests

## Architecture Guidelines
- Maintain separation of concerns
- Use dependency injection
- Implement proper logging
- Follow security best practices

## Testing Guidelines
- Unit tests for all functions
- Integration tests for components
- End-to-end tests for workflows
- Performance tests for critical paths

*Generated by SPARC Workflow Engine - Guidelines Phase*`;
  }

  private async refineRequirements(requirements: string, userInput: string): Promise<string> {
    return requirements + `\n\n## Refinements\n[${new Date().toISOString()}] ${userInput}\n\n*Refined based on user feedback*`;
  }

  private async generateImplementation(userInput: string, _artifacts: any): Promise<string> {
    return `# Implementation

## Generated Code Structure
Based on the design artifacts, here's the implementation:

\`\`\`typescript
// Main implementation file
export class ${this.extractClassName(userInput)} {
  constructor() {
    // Initialize based on architecture
  }

  async process(input: any): Promise<any> {
    // Implementation based on pseudocode
    return this.validateAndStore(input);
  }

  private validateAndStore(input: any): any {
    // Validation and storage logic
    return input;
  }
}
\`\`\`

## Configuration Files
- Package configuration
- Environment setup
- Build configuration

*Generated by SPARC Workflow Engine - Build Phase*`;
  }

  private async generateTests(userInput: string, _artifacts: any): Promise<string> {
    return `# Test Suite

## Unit Tests
\`\`\`typescript
describe('${this.extractClassName(userInput)}', () => {
  it('should process input correctly', async () => {
    // Test implementation
  });

  it('should handle errors gracefully', async () => {
    // Error handling tests
  });
});
\`\`\`

## Integration Tests
- Component integration
- API endpoint testing
- Database integration

*Generated by SPARC Workflow Engine - Test Generation*`;
  }

  private async analyzeAndDebug(userInput: string, _artifacts: any): Promise<string> {
    return `## Debug Analysis

**Issue**: ${userInput}

**Analysis**:
- Code quality: [Assessment]
- Performance: [Bottleneck identification]
- Error handling: [Gap analysis]
- Security: [Vulnerability check]

**Recommendations**:
- Fix identified issues
- Optimize performance bottlenecks
- Improve error handling
- Update security measures

**Status**: Ready for fixes
*Generated by SPARC Workflow Engine - Debug Phase*`;
  }

  private extractClassName(input: string): string {
    // Simple class name extraction
    const words = input.split(' ').filter(word => word.length > 0);
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  }

  private async loadWorkflowState(issueId: string): Promise<SPARCWorkflowState | null> {
    if (!this._nysFolder) return null;

    try {
      const stateFile = vscode.Uri.joinPath(this._nysFolder, `${issueId}-workflow.json`);
      const content = await vscode.workspace.fs.readFile(stateFile);
      return JSON.parse(content.toString());
    } catch {
      return null;
    }
  }

  private async saveWorkflowState(state: SPARCWorkflowState): Promise<void> {
    if (!this._nysFolder) return;

    const stateFile = vscode.Uri.joinPath(this._nysFolder, `${state.issueId}-workflow.json`);
    const content = JSON.stringify(state, null, 2);
    await vscode.workspace.fs.writeFile(stateFile, Buffer.from(content, 'utf8'));

    // Also save artifacts as separate files
    await this.saveArtifacts(state);
  }

  private async saveArtifacts(state: SPARCWorkflowState): Promise<void> {
    if (!this._nysFolder) return;

    const issueFolder = vscode.Uri.joinPath(this._nysFolder, state.issueId);
    
    try {
      await vscode.workspace.fs.stat(issueFolder);
    } catch {
      await vscode.workspace.fs.createDirectory(issueFolder);
    }

    // Save each artifact as a separate file
    for (const [key, content] of Object.entries(state.artifacts)) {
      if (content) {
        const fileName = key === 'requirements' ? 'requirements.md' :
                        key === 'guidelines' ? 'guidelines.md' :
                        key === 'pseudocode' ? 'pseudocode.md' :
                        key === 'architecture' ? 'architecture.md' :
                        key === 'implementation' ? 'implementation.md' :
                        key === 'tests' ? 'tests.md' :
                        key === 'notes' ? 'notes.md' : `${key}.md`;
        
        const filePath = vscode.Uri.joinPath(issueFolder, fileName);
        await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf8'));
      }
    }
  }

  /**
   * Get Simple Graph workflow instance
   */
  public getSimpleGraphWorkflow(): SimpleGraphSPARCWorkflow | null {
    return this._simpleGraphWorkflow;
  }

  /**
   * Check if graph orchestration is enabled
   */
  public isGraphOrchestrationEnabled(): boolean {
    return this._useGraphOrchestration && this._simpleGraphWorkflow !== null;
  }

  /**
   * Enable or disable graph orchestration
   */
  public setGraphOrchestrationEnabled(enabled: boolean): void {
    this._useGraphOrchestration = enabled;
    console.log(`[SPARC] Graph orchestration ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get workflow status using LangGraph
   */
  public async getWorkflowStatus(issueId: string): Promise<any> {
    if (this._simpleGraphWorkflow) {
      return await this._simpleGraphWorkflow.getWorkflowStatus(issueId);
    }
    return null;
  }

  /**
   * Get workflow metrics
   */
  public getWorkflowMetrics(): any {
    if (this._simpleGraphWorkflow) {
      return this._simpleGraphWorkflow.getWorkflowMetrics();
    }
    return null;
  }

  /**
   * Reset workflow using LangGraph
   */
  public async resetWorkflow(issueId: string): Promise<void> {
    if (this._simpleGraphWorkflow) {
      await this._simpleGraphWorkflow.resetWorkflow(issueId);
    }
  }
}
