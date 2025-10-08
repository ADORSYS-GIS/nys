import * as vscode from 'vscode';
import { GraphNodeState, AgentAction, Decision, ToolCall } from './graphNodes';

/**
 * AI Orchestrator Agent for SPARC Workflow Management
 * 
 * This class manages the overall workflow orchestration, making intelligent
 * decisions about workflow progression, agent coordination, and state management.
 */

export interface OrchestratorConfig {
  maxRetries: number;
  timeoutMs: number;
  enableParallelExecution: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface WorkflowDecision {
  nextNode: string;
  reasoning: string;
  confidence: number;
  alternatives: string[];
  estimatedTime: number;
}

export interface AgentCoordination {
  primaryAgent: string;
  supportingAgents: string[];
  coordinationStrategy: 'sequential' | 'parallel' | 'conditional';
  dependencies: string[];
}

export class AIOrchestrator {
  private config: OrchestratorConfig;
  private decisionHistory: Decision[];
  private performanceMetrics: Map<string, number>;
  private agentCapabilities: Map<string, string[]>;
  
  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      maxRetries: 3,
      timeoutMs: 30000,
      enableParallelExecution: true,
      logLevel: 'info',
      ...config
    };
    
    this.decisionHistory = [];
    this.performanceMetrics = new Map();
    this.agentCapabilities = new Map();
    
    this.initializeAgentCapabilities();
  }
  
  /**
   * Main orchestration method that manages the entire workflow
   */
  async orchestrateWorkflow(
    state: GraphNodeState,
    userInput: string
  ): Promise<GraphNodeState> {
    this.log('info', 'Starting workflow orchestration', { 
      issueId: state.issueId, 
      mode: state.currentMode,
      phase: state.currentPhase 
    });
    
    try {
      // Analyze current state and user input
      const analysis = await this.analyzeWorkflowState(state, userInput);
      
      // Make intelligent decision about next steps
      const decision = await this.makeWorkflowDecision(state, analysis);
      
      // Coordinate agents based on decision
      const coordination = await this.coordinateAgents(state, decision);
      
      // Execute the coordinated workflow
      const result = await this.executeCoordinatedWorkflow(state, coordination);
      
      // Update performance metrics
      this.updatePerformanceMetrics(decision, result);
      
      this.log('info', 'Workflow orchestration completed', { 
        decision: decision.nextNode,
        confidence: decision.confidence 
      });
      
      return result;
    } catch (error) {
      this.log('error', 'Workflow orchestration failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Analyze the current workflow state and user input
   */
  private async analyzeWorkflowState(
    _state: GraphNodeState,
    userInput: string
  ): Promise<any> {
    this.log('debug', 'Analyzing workflow state', { 
      mode: _state.currentMode,
      phase: _state.currentPhase,
      progress: _state.progress 
    });
    
    const analysis = {
      currentState: {
        mode: _state.currentMode,
        phase: _state.currentPhase,
        progress: _state.progress,
        artifacts: Object.keys(_state.artifacts).filter(key => _state.artifacts[key as keyof typeof _state.artifacts])
      },
      userInput: {
        type: this.classifyUserInput(userInput),
        intent: this.extractIntent(userInput),
        complexity: this.assessComplexity(userInput),
        urgency: this.assessUrgency(userInput)
      },
      workflowContext: {
        issueType: this.classifyIssueType(_state.issueDescription),
        technicalComplexity: this.assessTechnicalComplexity(_state.artifacts),
        dependencies: this.identifyDependencies(_state.artifacts),
        risks: this.identifyRisks(_state)
      },
      performance: {
        executionTime: this.calculateExecutionTime(_state),
        resourceUsage: this.assessResourceUsage(_state),
        qualityMetrics: this.assessQuality(_state.artifacts)
      }
    };
    
    this.log('debug', 'Workflow analysis completed', analysis);
    return analysis;
  }
  
  /**
   * Make intelligent decision about workflow progression
   */
  private async makeWorkflowDecision(
    state: GraphNodeState,
    analysis: any
  ): Promise<WorkflowDecision> {
    this.log('debug', 'Making workflow decision', { analysis });
    
    const decision = await this.decideNextNode(state, analysis);
    
    // Record decision for learning
    const decisionRecord: Decision = {
      id: `decision-${Date.now()}`,
      decision: decision.nextNode,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      timestamp: new Date(),
      context: { state, analysis }
    };
    
    this.decisionHistory.push(decisionRecord);
    
    this.log('info', 'Workflow decision made', decision);
    return decision;
  }
  
  /**
   * Decide the next node in the workflow
   */
  private async decideNextNode(
    _state: GraphNodeState,
    analysis: any
  ): Promise<WorkflowDecision> {
    const { currentState, userInput, workflowContext } = analysis;
    
    // Decision logic based on current mode and phase
    if (currentState.mode === 'design') {
      return this.decideDesignNode(currentState, userInput, workflowContext);
    } else if (currentState.mode === 'build') {
      return this.decideBuildNode(currentState, userInput, workflowContext);
    } else if (currentState.mode === 'debug') {
      return this.decideDebugNode(currentState, userInput, workflowContext);
    }
    
    // Default decision
    return {
      nextNode: 'specification',
      reasoning: 'Starting with specification phase for new workflow',
      confidence: 0.8,
      alternatives: ['pseudocode', 'architecture'],
      estimatedTime: 300000 // 5 minutes
    };
  }
  
  /**
   * Decide next node for design mode
   */
  private decideDesignNode(
    _currentState: any,
    _userInput: any,
    _workflowContext: any
  ): WorkflowDecision {
    const { phase, progress, artifacts } = _currentState;
    
    if (phase === 'specification' || !artifacts.includes('requirements')) {
      return {
        nextNode: 'specification',
        reasoning: 'Requirements specification needed to start design process',
        confidence: 0.9,
        alternatives: ['pseudocode'],
        estimatedTime: 300000
      };
    }
    
    if (phase === 'pseudocode' || !artifacts.includes('pseudocode')) {
      return {
        nextNode: 'pseudocode',
        reasoning: 'Pseudocode needed to define implementation approach',
        confidence: 0.85,
        alternatives: ['architecture'],
        estimatedTime: 240000
      };
    }
    
    if (phase === 'architecture' || !artifacts.includes('architecture')) {
      return {
        nextNode: 'architecture',
        reasoning: 'System architecture needed to define technical structure',
        confidence: 0.9,
        alternatives: ['refinement'],
        estimatedTime: 360000
      };
    }
    
    if (phase === 'refinement' || !artifacts.includes('guidelines')) {
      return {
        nextNode: 'refinement',
        reasoning: 'Requirements refinement needed based on architecture',
        confidence: 0.8,
        alternatives: ['completion'],
        estimatedTime: 180000
      };
    }
    
    return {
      nextNode: 'completion',
      reasoning: 'Design phase ready for completion',
      confidence: 0.95,
      alternatives: ['implementation'],
      estimatedTime: 120000
    };
  }
  
  /**
   * Decide next node for build mode
   */
  private decideBuildNode(
    currentState: any,
    _userInput: any,
    _workflowContext: any
  ): WorkflowDecision {
    const { phase, artifacts } = currentState;
    
    if (phase === 'implementation' || !artifacts.includes('implementation')) {
      return {
        nextNode: 'implementation',
        reasoning: 'Code implementation needed to build the solution',
        confidence: 0.9,
        alternatives: ['testing'],
        estimatedTime: 600000
      };
    }
    
    if (phase === 'testing' || !artifacts.includes('tests')) {
      return {
        nextNode: 'testing',
        reasoning: 'Test suite needed to ensure code quality',
        confidence: 0.85,
        alternatives: ['documentation'],
        estimatedTime: 300000
      };
    }
    
    return {
      nextNode: 'documentation',
      reasoning: 'Documentation needed to complete build phase',
      confidence: 0.8,
      alternatives: ['analysis'],
      estimatedTime: 240000
    };
  }
  
  /**
   * Decide next node for debug mode
   */
  private decideDebugNode(
    currentState: any,
    _userInput: any,
    _workflowContext: any
  ): WorkflowDecision {
    const { phase, artifacts } = currentState;
    
    if (phase === 'analysis' || !artifacts.includes('notes')) {
      return {
        nextNode: 'analysis',
        reasoning: 'Code analysis needed to identify issues',
        confidence: 0.9,
        alternatives: ['fix_generation'],
        estimatedTime: 300000
      };
    }
    
    return {
      nextNode: 'fix_generation',
      reasoning: 'Fix generation needed to resolve identified issues',
      confidence: 0.85,
      alternatives: ['specification'],
      estimatedTime: 240000
    };
  }
  
  /**
   * Coordinate agents based on workflow decision
   */
  private async coordinateAgents(
    state: GraphNodeState,
    decision: WorkflowDecision
  ): Promise<AgentCoordination> {
    this.log('debug', 'Coordinating agents', { decision });
    
    const coordination: AgentCoordination = {
      primaryAgent: this.selectPrimaryAgent(decision.nextNode),
      supportingAgents: this.selectSupportingAgents(decision.nextNode),
      coordinationStrategy: this.determineCoordinationStrategy(decision),
      dependencies: this.identifyDependencies(state.artifacts)
    };
    
    this.log('info', 'Agent coordination planned', coordination);
    return coordination;
  }
  
  /**
   * Select primary agent for the next node
   */
  private selectPrimaryAgent(nodeId: string): string {
    const agentMapping: { [key: string]: string } = {
      'specification': 'design-agent',
      'pseudocode': 'design-agent',
      'architecture': 'design-agent',
      'refinement': 'design-agent',
      'completion': 'design-agent',
      'implementation': 'build-agent',
      'testing': 'build-agent',
      'documentation': 'build-agent',
      'analysis': 'debug-agent',
      'fix_generation': 'debug-agent'
    };
    
    return agentMapping[nodeId] || 'orchestration-agent';
  }
  
  /**
   * Select supporting agents for the next node
   */
  private selectSupportingAgents(nodeId: string): string[] {
    const supportingAgents: { [key: string]: string[] } = {
      'specification': ['orchestration-agent'],
      'pseudocode': ['orchestration-agent'],
      'architecture': ['orchestration-agent'],
      'refinement': ['orchestration-agent'],
      'completion': ['orchestration-agent'],
      'implementation': ['orchestration-agent', 'debug-agent'],
      'testing': ['orchestration-agent', 'debug-agent'],
      'documentation': ['orchestration-agent'],
      'analysis': ['orchestration-agent', 'build-agent'],
      'fix_generation': ['orchestration-agent', 'build-agent']
    };
    
    return supportingAgents[nodeId] || ['orchestration-agent'];
  }
  
  /**
   * Determine coordination strategy
   */
  private determineCoordinationStrategy(decision: WorkflowDecision): 'sequential' | 'parallel' | 'conditional' {
    // Simple strategy based on confidence and complexity
    if (decision.confidence > 0.8) {
      return 'sequential';
    } else if (decision.confidence > 0.6) {
      return 'conditional';
    } else {
      return 'parallel';
    }
  }
  
  /**
   * Execute coordinated workflow
   */
  private async executeCoordinatedWorkflow(
    state: GraphNodeState,
    coordination: AgentCoordination
  ): Promise<GraphNodeState> {
    this.log('debug', 'Executing coordinated workflow', { coordination });
    
    try {
      // Execute primary agent
      const primaryResult = await this.executeAgent(
        coordination.primaryAgent,
        state,
        'primary'
      );
      
      // Execute supporting agents if needed
      if (coordination.coordinationStrategy === 'parallel') {
        const supportingResults = await Promise.all(
          coordination.supportingAgents.map(agent =>
            this.executeAgent(agent, state, 'supporting')
          )
        );
        
        // Merge results
        return this.mergeAgentResults(primaryResult, supportingResults);
      }
      
      return primaryResult;
    } catch (error) {
      this.log('error', 'Coordinated workflow execution failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Execute a specific agent
   */
  private async executeAgent(
    agentId: string,
    state: GraphNodeState,
    role: 'primary' | 'supporting'
  ): Promise<GraphNodeState> {
    this.log('debug', 'Executing agent', { agentId, role });
    
    // Simulate agent execution
    // In a real implementation, this would call the actual agent
    const startTime = Date.now();
    
    try {
      // Add agent action to state
      const action: AgentAction = {
        id: `action-${Date.now()}`,
        agentId,
        action: 'execute_workflow_node',
        input: JSON.stringify(state),
        output: 'Agent execution completed',
        timestamp: new Date(),
        success: true
      };
      
      state.aiContext.agentHistory.push(action);
      state.updatedAt = new Date();
      
      const executionTime = Date.now() - startTime;
      this.performanceMetrics.set(`${agentId}-${role}`, executionTime);
      
      this.log('info', 'Agent execution completed', { 
        agentId, 
        role, 
        executionTime 
      });
      
      return state;
    } catch (error) {
      this.log('error', 'Agent execution failed', { agentId, role, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Merge results from multiple agents
   */
  private mergeAgentResults(
    primaryResult: GraphNodeState,
    supportingResults: GraphNodeState[]
  ): GraphNodeState {
    // Merge agent histories
    const allActions = [
      ...primaryResult.aiContext.agentHistory,
      ...supportingResults.flatMap(result => result.aiContext.agentHistory)
    ];
    
    primaryResult.aiContext.agentHistory = allActions;
    primaryResult.updatedAt = new Date();
    
    return primaryResult;
  }
  
  /**
   * Utility methods for analysis
   */
  
  private classifyUserInput(input: string): string {
    if (input.toLowerCase().includes('create') || input.toLowerCase().includes('build')) {
      return 'creation';
    } else if (input.toLowerCase().includes('fix') || input.toLowerCase().includes('debug')) {
      return 'debugging';
    } else if (input.toLowerCase().includes('test') || input.toLowerCase().includes('verify')) {
      return 'testing';
    } else if (input.toLowerCase().includes('document') || input.toLowerCase().includes('explain')) {
      return 'documentation';
    }
    return 'general';
  }
  
  private extractIntent(input: string): string {
    // Simple intent extraction
    const words = input.toLowerCase().split(' ');
    const intentKeywords: { [key: string]: string } = {
      'create': 'creation',
      'build': 'creation',
      'implement': 'creation',
      'fix': 'debugging',
      'debug': 'debugging',
      'test': 'testing',
      'verify': 'testing',
      'document': 'documentation',
      'explain': 'documentation'
    };
    
    for (const word of words) {
      if (intentKeywords[word]) {
        return intentKeywords[word];
      }
    }
    
    return 'general';
  }
  
  private assessComplexity(input: string): 'low' | 'medium' | 'high' {
    const wordCount = input.split(' ').length;
    const hasTechnicalTerms = /(api|database|algorithm|architecture|framework)/i.test(input);
    
    if (wordCount > 50 || hasTechnicalTerms) {
      return 'high';
    } else if (wordCount > 20) {
      return 'medium';
    }
    return 'low';
  }
  
  private assessUrgency(input: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'priority'];
    const hasUrgentKeywords = urgentKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
    
    return hasUrgentKeywords ? 'high' : 'medium';
  }
  
  private classifyIssueType(description: string): string {
    if (/bug|error|issue|problem/i.test(description)) {
      return 'bug';
    } else if (/feature|enhancement|improvement/i.test(description)) {
      return 'feature';
    } else if (/documentation|doc|guide/i.test(description)) {
      return 'documentation';
    }
    return 'general';
  }
  
  private assessTechnicalComplexity(artifacts: any): 'low' | 'medium' | 'high' {
    const artifactCount = Object.keys(artifacts).filter(key => artifacts[key]).length;
    
    if (artifactCount > 4) {
      return 'high';
    } else if (artifactCount > 2) {
      return 'medium';
    }
    return 'low';
  }
  
  private identifyDependencies(artifacts: any): string[] {
    const dependencies: string[] = [];
    
    if (artifacts.requirements && !artifacts.pseudocode) {
      dependencies.push('pseudocode');
    }
    if (artifacts.pseudocode && !artifacts.architecture) {
      dependencies.push('architecture');
    }
    if (artifacts.architecture && !artifacts.implementation) {
      dependencies.push('implementation');
    }
    
    return dependencies;
  }
  
  private identifyRisks(state: GraphNodeState): string[] {
    const risks: string[] = [];
    
    if (state.progress < 20 && state.currentMode === 'design') {
      risks.push('insufficient_requirements');
    }
    
    if (state.aiContext.agentHistory.length > 10) {
      risks.push('workflow_complexity');
    }
    
    if (state.metadata.errors.length > 0) {
      risks.push('existing_errors');
    }
    
    return risks;
  }
  
  private calculateExecutionTime(state: GraphNodeState): number {
    const startTime = state.createdAt.getTime();
    const currentTime = Date.now();
    return currentTime - startTime;
  }
  
  private assessResourceUsage(state: GraphNodeState): 'low' | 'medium' | 'high' {
    const actionCount = state.aiContext.agentHistory.length;
    const toolCallCount = state.aiContext.toolCalls.length;
    
    if (actionCount > 20 || toolCallCount > 10) {
      return 'high';
    } else if (actionCount > 10 || toolCallCount > 5) {
      return 'medium';
    }
    return 'low';
  }
  
  private assessQuality(artifacts: any): 'low' | 'medium' | 'high' {
    const artifactCount = Object.keys(artifacts).filter(key => artifacts[key]).length;
    const averageLength = Object.values(artifacts)
      .filter(content => content)
      .reduce((sum: number, content: unknown) => sum + (content as string).length, 0) / artifactCount;
    
    if (artifactCount > 3 && averageLength > 1000) {
      return 'high';
    } else if (artifactCount > 2 && averageLength > 500) {
      return 'medium';
    }
    return 'low';
  }
  
  /**
   * Initialize agent capabilities
   */
  private initializeAgentCapabilities(): void {
    this.agentCapabilities.set('design-agent', [
      'requirements_analysis',
      'architecture_design',
      'specification_generation',
      'pseudocode_creation'
    ]);
    
    this.agentCapabilities.set('build-agent', [
      'code_generation',
      'test_creation',
      'documentation_generation',
      'implementation'
    ]);
    
    this.agentCapabilities.set('debug-agent', [
      'code_analysis',
      'issue_detection',
      'fix_generation',
      'performance_optimization'
    ]);
    
    this.agentCapabilities.set('orchestration-agent', [
      'workflow_coordination',
      'state_management',
      'decision_making',
      'agent_coordination'
    ]);
  }
  
  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(decision: WorkflowDecision, result: GraphNodeState): void {
    const executionTime = Date.now() - result.createdAt.getTime();
    this.performanceMetrics.set('total_execution_time', executionTime);
    this.performanceMetrics.set('decision_confidence', decision.confidence);
    this.performanceMetrics.set('workflow_progress', result.progress);
  }
  
  /**
   * Logging utility
   */
  private log(level: string, message: string, data?: any): void {
    const levels: { [key: string]: number } = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];
    
    if (messageLevel >= currentLevel) {
      console.log(`[AIOrchestrator:${level.toUpperCase()}] ${message}`, data || '');
    }
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Map<string, number> {
    return new Map(this.performanceMetrics);
  }
  
  /**
   * Get decision history
   */
  getDecisionHistory(): Decision[] {
    return [...this.decisionHistory];
  }
  
  /**
   * Reset orchestrator state
   */
  reset(): void {
    this.decisionHistory = [];
    this.performanceMetrics.clear();
  }
}

