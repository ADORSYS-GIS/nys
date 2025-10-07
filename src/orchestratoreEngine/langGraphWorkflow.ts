import { StateGraph, END, START } from '@langchain/langgraph';
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
 * LangGraph Workflow for SPARC Orchestration
 * 
 * This class implements a graph-based workflow using LangGraph that orchestrates
 * the SPARC workflow phases with AI assistance and intelligent decision making.
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

export class LangGraphSPARCWorkflow {
  private graph: StateGraph<GraphNodeState>;
  private nodes: Map<string, BaseGraphNode>;
  private orchestrator: AIOrchestrator;
  private nysFolder: vscode.Uri | null = null;
  
  constructor(workspaceRoot: vscode.Uri) {
    this.orchestrator = new AIOrchestrator();
    this.nodes = new Map();
    this.initializeNodes();
    this.initializeGraph();
    this.initializeNysFolder(workspaceRoot);
  }
  
  /**
   * Initialize all workflow nodes
   */
  private initializeNodes(): void {
    // Design mode nodes
    this.nodes.set('specification', new SpecificationNode());
    this.nodes.set('pseudocode', new PseudocodeNode());
    this.nodes.set('architecture', new ArchitectureNode());
    this.nodes.set('refinement', new RefinementNode());
    this.nodes.set('completion', new CompletionNode());
    
    // Build mode nodes
    this.nodes.set('implementation', new ImplementationNode());
    this.nodes.set('testing', new TestingNode());
    
    // Debug mode nodes
    this.nodes.set('analysis', new AnalysisNode());
    this.nodes.set('fix_generation', new FixGenerationNode());
  }
  
  /**
   * Initialize the LangGraph workflow
   */
  private initializeGraph(): void {
    // Create the state graph with a simpler state structure
    this.graph = new StateGraph({
      channels: {
        issueId: { value: (x: string) => x },
        currentMode: { value: (x: string) => x },
        currentPhase: { value: (x: string) => x },
        progress: { value: (x: number) => x },
        issueTitle: { value: (x: string) => x },
        issueDescription: { value: (x: string) => x },
        artifacts: { value: (x: any) => x },
        aiContext: { value: (x: any) => x },
        memory: { value: (x: any) => x },
        metadata: { value: (x: any) => x },
        createdAt: { value: (x: Date) => x },
        updatedAt: { value: (x: Date) => x }
      }
    });
    
    // Add nodes to the graph
    this.addNodesToGraph();
    
    // Add edges to the graph
    this.addEdgesToGraph();
    
    // Compile the graph
    this.graph = this.graph.compile();
  }
  
  /**
   * Add nodes to the graph
   */
  private addNodesToGraph(): void {
    // Add all workflow nodes
    this.graph.addNode('specification', this.createNodeHandler('specification'));
    this.graph.addNode('pseudocode', this.createNodeHandler('pseudocode'));
    this.graph.addNode('architecture', this.createNodeHandler('architecture'));
    this.graph.addNode('refinement', this.createNodeHandler('refinement'));
    this.graph.addNode('completion', this.createNodeHandler('completion'));
    this.graph.addNode('implementation', this.createNodeHandler('implementation'));
    this.graph.addNode('testing', this.createNodeHandler('testing'));
    this.graph.addNode('analysis', this.createNodeHandler('analysis'));
    this.graph.addNode('fix_generation', this.createNodeHandler('fix_generation'));
    
    // Add orchestration node
    this.graph.addNode('orchestrate', this.createOrchestrationHandler());
  }
  
  /**
   * Add edges to the graph
   */
  private addEdgesToGraph(): void {
    // Start with orchestration
    this.graph.addEdge(START, 'orchestrate');
    
    // Design mode flow
    this.graph.addEdge('orchestrate', 'specification');
    this.graph.addEdge('specification', 'pseudocode');
    this.graph.addEdge('pseudocode', 'architecture');
    this.graph.addEdge('architecture', 'refinement');
    this.graph.addEdge('refinement', 'completion');
    
    // Build mode flow
    this.graph.addEdge('completion', 'implementation');
    this.graph.addEdge('implementation', 'testing');
    
    // Debug mode flow
    this.graph.addEdge('testing', 'analysis');
    this.graph.addEdge('analysis', 'fix_generation');
    
    // End workflow
    this.graph.addEdge('fix_generation', END);
  }
  
  /**
   * Create a node handler for a specific node
   */
  private createNodeHandler(nodeId: string) {
    return async (state: GraphNodeState): Promise<GraphNodeState> => {
      console.log(`[LangGraph] Executing node: ${nodeId}`);
      
      try {
        const node = this.nodes.get(nodeId);
        if (!node) {
          throw new Error(`Node ${nodeId} not found`);
        }
        
        // Execute the node
        const result = await node.execute(state);
        
        // Save state after each node execution
        await this.saveWorkflowState(result);
        
        console.log(`[LangGraph] Node ${nodeId} completed successfully`);
        return result;
      } catch (error) {
        console.error(`[LangGraph] Node ${nodeId} failed:`, error);
        throw error;
      }
    };
  }
  
  /**
   * Create orchestration handler
   */
  private createOrchestrationHandler() {
    return async (state: GraphNodeState): Promise<GraphNodeState> => {
      console.log('[LangGraph] Executing orchestration');
      
      try {
        // Use AI orchestrator to make intelligent decisions
        const decision = await this.orchestrator.orchestrateWorkflow(
          state,
          state.issueDescription
        );
        
        console.log('[LangGraph] Orchestration completed');
        return decision;
      } catch (error) {
        console.error('[LangGraph] Orchestration failed:', error);
        throw error;
      }
    };
  }
  
  /**
   * Execute the workflow
   */
  async executeWorkflow(input: WorkflowInput): Promise<WorkflowOutput> {
    console.log('[LangGraph] Starting workflow execution', input);
    
    try {
      // Create initial state
      const initialState = this.createInitialState(input);
      
      // Save initial state
      await this.saveWorkflowState(initialState);
      
      // Execute the graph
      const finalState = await this.graph.invoke(initialState);
      
      // Generate output
      const output = this.generateOutput(finalState);
      
      console.log('[LangGraph] Workflow execution completed');
      return output;
    } catch (error) {
      console.error('[LangGraph] Workflow execution failed:', error);
      throw error;
    }
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
      console.log('[LangGraph] .nys folder initialized');
    } catch (error) {
      console.error('[LangGraph] Failed to initialize .nys folder:', error);
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
      
      console.log(`[LangGraph] State saved for issue ${state.issueId}`);
    } catch (error) {
      console.error('[LangGraph] Failed to save state:', error);
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
      
      console.log(`[LangGraph] Artifacts saved for issue ${state.issueId}`);
    } catch (error) {
      console.error('[LangGraph] Failed to save artifacts:', error);
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
      
      console.log(`[LangGraph] State loaded for issue ${issueId}`);
      return state;
    } catch (error) {
      console.error('[LangGraph] Failed to load state:', error);
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
      artifacts: Object.keys(state.artifacts).filter(key => state.artifacts[key]),
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
      
      console.log(`[LangGraph] Workflow reset for issue ${issueId}`);
    } catch (error) {
      console.error('[LangGraph] Failed to reset workflow:', error);
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
      decisionHistory: this.orchestrator.getDecisionHistory()
    };
  }
}

