import * as vscode from 'vscode';
import { 
  GraphNodeState, 
  BaseGraphNode,
  SpecificationNode,
  PseudocodeNode,
  ArchitectureNode,
  RefinementNode,
  CompletionNode,
  ImplementationNode,
  TestingNode,
  AnalysisNode,
  FixGenerationNode
} from './graphNodes';
import { AIOrchestrator, WorkflowDecision } from './aiOrchestrator';

/**
 * Simple Graph Workflow for SPARC Orchestration
 * 
 * This class implements a simplified graph-based workflow that orchestrates
 * the SPARC workflow phases with AI assistance and intelligent decision making.
 * This is a fallback implementation that doesn't rely on LangGraph.
 */

export interface WorkflowInput {
  issueId: string;
  mode: 'design' | 'build' | 'debug';
  userInput: string;
  issueTitle: string;
  issueDescription: string;
}

export interface WorkflowOutput {
  state: GraphNodeState;
  artifacts: any;
  performance: any;
  decisions: any[];
}

export class SimpleGraphSPARCWorkflow {
  private nodes: Map<string, BaseGraphNode>;
  private orchestrator: AIOrchestrator;
  private nysFolder: vscode.Uri | null = null;
  private executionHistory: Map<string, GraphNodeState[]>;
  
  constructor(workspaceRoot: vscode.Uri) {
    this.orchestrator = new AIOrchestrator();
    this.nodes = new Map();
    this.executionHistory = new Map();
    this.initializeNodes();
    this.initializeNysFolder(workspaceRoot);
  }
  
  /**
   * Initialize all workflow nodes
   */
  private initializeNodes(): void {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri || vscode.Uri.file(process.cwd());
    
    // Design mode nodes
    this.nodes.set('specification', new SpecificationNode(workspaceRoot));
    this.nodes.set('pseudocode', new PseudocodeNode(workspaceRoot));
    this.nodes.set('architecture', new ArchitectureNode(workspaceRoot));
    this.nodes.set('refinement', new RefinementNode(workspaceRoot));
    this.nodes.set('completion', new CompletionNode(workspaceRoot));
    
    // Build mode nodes
    this.nodes.set('implementation', new ImplementationNode(workspaceRoot));
    this.nodes.set('testing', new TestingNode(workspaceRoot));
    
    // Debug mode nodes
    this.nodes.set('analysis', new AnalysisNode(workspaceRoot));
    this.nodes.set('fix_generation', new FixGenerationNode(workspaceRoot));
  }
  
  /**
   * Execute the workflow
   */
  async executeWorkflow(input: WorkflowInput): Promise<WorkflowOutput> {
    console.log('[SimpleGraph] Starting workflow execution', input);
    
    try {
      // Create initial state
      const initialState = this.createInitialState(input);
      
      // Save initial state
      await this.saveWorkflowState(initialState);
      
      // Execute the workflow nodes
      const finalState = await this.executeWorkflowNodes(initialState);
      
      // Generate output
      const output = this.generateOutput(finalState);
      
      console.log('[SimpleGraph] Workflow execution completed');
      return output;
    } catch (error) {
      console.error('[SimpleGraph] Workflow execution failed:', error);
      throw error;
    }
  }
  
  /**
   * Execute workflow nodes based on mode and current phase
   */
  private async executeWorkflowNodes(state: GraphNodeState): Promise<GraphNodeState> {
    let currentState = state;
    const maxIterations = 10; // Prevent infinite loops
    let iterations = 0;
    
    while (iterations < maxIterations) {
      console.log(`[SimpleGraph] Iteration ${iterations + 1}, Mode: ${currentState.currentMode}, Phase: ${currentState.currentPhase}`);
      
      // Use AI orchestrator to make decisions
      const decision = await this.orchestrator.orchestrateWorkflow(currentState, currentState.issueDescription);
      
      // Execute the current phase node
      const nodeId = this.getCurrentNodeId(currentState);
      const node = this.nodes.get(nodeId);
      
      if (!node) {
        console.error(`[SimpleGraph] Node ${nodeId} not found`);
        break;
      }
      
      try {
        currentState = await node.execute(currentState);
        console.log(`[SimpleGraph] Node ${nodeId} executed successfully`);
        
        // Save state after each node execution
        await this.saveWorkflowState(currentState);
        
        // Check if workflow is complete
        if (this.isWorkflowComplete(currentState)) {
          console.log('[SimpleGraph] Workflow completed');
          break;
        }
        
        // Move to next phase
        currentState = this.transitionToNextPhase(currentState);
        
      } catch (error) {
        console.error(`[SimpleGraph] Node ${nodeId} failed:`, error);
        // Add error to state
        currentState.metadata.errors.push(error as Error);
        break;
      }
      
      iterations++;
    }
    
    if (iterations >= maxIterations) {
      console.warn('[SimpleGraph] Workflow reached maximum iterations');
    }
    
    return currentState;
  }
  
  /**
   * Get current node ID based on state
   */
  private getCurrentNodeId(state: GraphNodeState): string {
    return state.currentPhase;
  }
  
  /**
   * Check if workflow is complete
   */
  private isWorkflowComplete(state: GraphNodeState): boolean {
    // Complete if progress is 100% or if we've reached the end of a mode
    if (state.progress >= 100) {
      return true;
    }
    
    // Complete if we've finished all phases in a mode
    if (state.currentMode === 'design' && state.currentPhase === 'completion') {
      return true;
    }
    
    if (state.currentMode === 'build' && state.currentPhase === 'testing') {
      return true;
    }
    
    if (state.currentMode === 'debug' && state.currentPhase === 'fix_generation') {
      return true;
    }
    
    return false;
  }
  
  /**
   * Transition to next phase
   */
  private transitionToNextPhase(state: GraphNodeState): GraphNodeState {
    const transitions: { [key: string]: string } = {
      // Design mode transitions
      'specification': 'pseudocode',
      'pseudocode': 'architecture',
      'architecture': 'refinement',
      'refinement': 'completion',
      'completion': 'implementation', // Move to build mode
      
      // Build mode transitions
      'implementation': 'testing',
      'testing': 'analysis', // Move to debug mode
      
      // Debug mode transitions
      'analysis': 'fix_generation',
      'fix_generation': 'specification' // Loop back to design
    };
    
    const nextPhase = transitions[state.currentPhase];
    if (nextPhase) {
      state.currentPhase = nextPhase;
      
      // Update mode if transitioning between modes
      if (state.currentPhase === 'implementation') {
        state.currentMode = 'build';
      } else if (state.currentPhase === 'analysis') {
        state.currentMode = 'debug';
      } else if (state.currentPhase === 'specification' && state.currentMode === 'debug') {
        state.currentMode = 'design';
      }
      
      state.updatedAt = new Date();
      
      // Add transition to metadata
      state.metadata.transitions.push({
        from: state.currentPhase,
        to: nextPhase,
        condition: 'automatic',
        timestamp: new Date(),
        success: true
      });
    }
    
    return state;
  }
  
  /**
   * Create initial state from input
   */
  private createInitialState(input: WorkflowInput): GraphNodeState {
    const now = new Date();
    
    return {
      issueId: input.issueId,
      currentMode: input.mode,
      currentPhase: this.getInitialPhase(input.mode),
      progress: 0,
      issueTitle: input.issueTitle,
      issueDescription: input.issueDescription,
      userInput: input.userInput,
      artifacts: {},
      aiContext: {
        currentAgent: 'orchestration-agent',
        agentHistory: [],
        toolCalls: [],
        decisions: []
      },
      memory: {
        chatHistory: [],
        context: {},
        retrievedContext: []
      },
      metadata: {
        transitions: [],
        errors: [],
        performance: {
          executionTime: 0,
          nodeExecutionTimes: new Map(),
          toolUsageCounts: new Map(),
          errorRates: new Map(),
          successRate: 0
        }
      },
      createdAt: now,
      updatedAt: now
    };
  }
  
  /**
   * Get initial phase based on mode
   */
  private getInitialPhase(mode: 'design' | 'build' | 'debug'): string {
    switch (mode) {
      case 'design':
        return 'specification';
      case 'build':
        return 'implementation';
      case 'debug':
        return 'analysis';
      default:
        return 'specification';
    }
  }
  
  /**
   * Generate output from final state
   */
  private generateOutput(state: GraphNodeState): WorkflowOutput {
    return {
      state,
      artifacts: state.artifacts,
      performance: {
        executionTime: Date.now() - state.createdAt.getTime(),
        progress: state.progress,
        nodeCount: state.aiContext.agentHistory.length,
        successRate: this.calculateSuccessRate(state)
      },
      decisions: state.aiContext.decisions
    };
  }
  
  /**
   * Calculate success rate from agent history
   */
  private calculateSuccessRate(state: GraphNodeState): number {
    const actions = state.aiContext.agentHistory;
    if (actions.length === 0) return 0;
    
    const successfulActions = actions.filter(action => action.success).length;
    return successfulActions / actions.length;
  }
  
  /**
   * Initialize .nys folder for persistence
   */
  private async initializeNysFolder(workspaceRoot: vscode.Uri): Promise<void> {
    this.nysFolder = vscode.Uri.joinPath(workspaceRoot, '.nys');
    
    try {
      await vscode.workspace.fs.createDirectory(this.nysFolder);
      console.log('[SimpleGraph] .nys folder initialized');
    } catch (error) {
      console.error('[SimpleGraph] Failed to initialize .nys folder:', error);
    }
  }
  
  /**
   * Save workflow state to persistence layer
   */
  private async saveWorkflowState(state: GraphNodeState): Promise<void> {
    if (!this.nysFolder) return;
    
    try {
      const statePath = vscode.Uri.joinPath(this.nysFolder, `${state.issueId}-state.json`);
      const stateContent = JSON.stringify(state, null, 2);
      await vscode.workspace.fs.writeFile(statePath, Buffer.from(stateContent, 'utf8'));
      
      // Save artifacts separately
      await this.saveArtifacts(state);
      
      // Add to execution history
      if (!this.executionHistory.has(state.issueId)) {
        this.executionHistory.set(state.issueId, []);
      }
      this.executionHistory.get(state.issueId)!.push(state);
      
      console.log(`[SimpleGraph] State saved for issue ${state.issueId}`);
    } catch (error) {
      console.error('[SimpleGraph] Failed to save state:', error);
    }
  }
  
  /**
   * Save artifacts to persistence layer
   */
  private async saveArtifacts(state: GraphNodeState): Promise<void> {
    if (!this.nysFolder) return;
    
    try {
      const artifactsDir = vscode.Uri.joinPath(this.nysFolder, state.issueId);
      await vscode.workspace.fs.createDirectory(artifactsDir);
      
      // Save each artifact
      for (const [key, content] of Object.entries(state.artifacts)) {
        if (content) {
          const artifactPath = vscode.Uri.joinPath(artifactsDir, `${key}.md`);
          await vscode.workspace.fs.writeFile(artifactPath, Buffer.from(content, 'utf8'));
        }
      }
      
      console.log(`[SimpleGraph] Artifacts saved for issue ${state.issueId}`);
    } catch (error) {
      console.error('[SimpleGraph] Failed to save artifacts:', error);
    }
  }
  
  /**
   * Load workflow state from persistence layer
   */
  async loadWorkflowState(issueId: string): Promise<GraphNodeState | null> {
    if (!this.nysFolder) return null;
    
    try {
      const statePath = vscode.Uri.joinPath(this.nysFolder, `${issueId}-state.json`);
      const stateContent = await vscode.workspace.fs.readFile(statePath);
      const state = JSON.parse(stateContent.toString());
      
      // Convert dates back to Date objects
      state.createdAt = new Date(state.createdAt);
      state.updatedAt = new Date(state.updatedAt);
      
      // Convert Maps back to Map objects
      if (state.metadata.performance.nodeExecutionTimes) {
        state.metadata.performance.nodeExecutionTimes = new Map(
          Object.entries(state.metadata.performance.nodeExecutionTimes)
        );
      }
      if (state.metadata.performance.toolUsageCounts) {
        state.metadata.performance.toolUsageCounts = new Map(
          Object.entries(state.metadata.performance.toolUsageCounts)
        );
      }
      if (state.metadata.performance.errorRates) {
        state.metadata.performance.errorRates = new Map(
          Object.entries(state.metadata.performance.errorRates)
        );
      }
      
      console.log(`[SimpleGraph] State loaded for issue ${issueId}`);
      return state;
    } catch (error) {
      console.error('[SimpleGraph] Failed to load state:', error);
      return null;
    }
  }
  
  /**
   * Get workflow status
   */
  async getWorkflowStatus(issueId: string): Promise<any> {
    const state = await this.loadWorkflowState(issueId);
    if (!state) return null;
    
    return {
      issueId: state.issueId,
      mode: state.currentMode,
      phase: state.currentPhase,
      progress: state.progress,
      status: this.determineWorkflowStatus(state),
      artifacts: Object.keys(state.artifacts).filter(key => state.artifacts[key as keyof typeof state.artifacts]),
      lastUpdated: state.updatedAt,
      performance: state.metadata.performance
    };
  }
  
  /**
   * Determine workflow status
   */
  private determineWorkflowStatus(state: GraphNodeState): string {
    if (state.progress === 100) {
      return 'completed';
    } else if (state.metadata.errors.length > 0) {
      return 'error';
    } else if (state.progress > 0) {
      return 'in_progress';
    } else {
      return 'pending';
    }
  }
  
  /**
   * Get available nodes
   */
  getAvailableNodes(): string[] {
    return Array.from(this.nodes.keys());
  }
  
  /**
   * Get node by ID
   */
  getNode(nodeId: string): BaseGraphNode | undefined {
    return this.nodes.get(nodeId);
  }
  
  /**
   * Get orchestrator
   */
  getOrchestrator(): AIOrchestrator {
    return this.orchestrator;
  }
  
  /**
   * Reset workflow state
   */
  async resetWorkflow(issueId: string): Promise<void> {
    if (!this.nysFolder) return;
    
    try {
      // Remove state file
      const statePath = vscode.Uri.joinPath(this.nysFolder, `${issueId}-state.json`);
      await vscode.workspace.fs.delete(statePath);
      
      // Remove artifacts directory
      const artifactsDir = vscode.Uri.joinPath(this.nysFolder, issueId);
      await vscode.workspace.fs.delete(artifactsDir, { recursive: true });
      
      // Remove from execution history
      this.executionHistory.delete(issueId);
      
      console.log(`[SimpleGraph] Workflow reset for issue ${issueId}`);
    } catch (error) {
      console.error('[SimpleGraph] Failed to reset workflow:', error);
    }
  }
  
  /**
   * Get workflow metrics
   */
  getWorkflowMetrics(): any {
    return {
      totalNodes: this.nodes.size,
      availableNodes: this.getAvailableNodes(),
      orchestratorMetrics: this.orchestrator.getPerformanceMetrics(),
      decisionHistory: this.orchestrator.getDecisionHistory(),
      executionHistory: Object.fromEntries(this.executionHistory)
    };
  }
}
