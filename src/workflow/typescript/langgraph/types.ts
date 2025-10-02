/**
 * LangGraph-based Workflow Types
 * 
 * This module defines the state schema and types for LangGraph workflows.
 */

import { BaseMessage } from 'langchain/schema';

/**
 * Workflow State Schema for LangGraph
 * This defines the state that flows through the graph
 */
export interface WorkflowState {
    // Core workflow information
    workflowId: string;
    sessionId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
    
    // Current execution context
    currentNode?: string;
    previousNode?: string;
    executionPath: string[];
    
    // Data flow
    inputData: Record<string, any>;
    outputData: Record<string, any>;
    intermediateResults: Record<string, any>;
    
    // Message history
    messages: BaseMessage[];
    
    // Context and tools
    context: Record<string, any>;
    availableTools: string[];
    toolResults: Record<string, any>;
    pendingToolCalls: ToolCall[];
    
    // MCP integration
    mcpServers: string[];
    mcpContext: Record<string, any>;
    
    // Metadata and timing
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, any>;
    
    // Error handling
    error?: string;
    retryCount: number;
    maxRetries: number;
    
    // Human-in-the-loop
    humanInput?: string;
    requiresHumanInput: boolean;
}

/**
 * Tool call definition
 */
export interface ToolCall {
    callId: string;
    toolName: string;
    parameters: Record<string, any>;
    result?: any;
    error?: string;
}

/**
 * Node execution result
 */
export interface NodeResult {
    nodeId: string;
    success: boolean;
    output: Record<string, any>;
    error?: string;
    executionTime: number;
    metadata: Record<string, any>;
    nextNodes?: string[];
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
    workflowName: string;
    modelProvider: string;
    modelName: string;
    maxIterations: number;
    timeoutSeconds: number;
    enableParallelExecution: boolean;
    enableRetry: boolean;
    logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    metadata: Record<string, any>;
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
    workflowId: string;
    status: string;
    outputData: Record<string, any>;
    executionPath: string[];
    durationSeconds: number;
    error?: string;
    metadata: Record<string, any>;
}

/**
 * Node types for different workflow steps
 */
export enum NodeType {
    START = 'start',
    ASSISTANT = 'assistant',
    TOOL = 'tool',
    CONDITIONAL = 'conditional',
    HUMAN_INPUT = 'human_input',
    END = 'end'
}

/**
 * Edge conditions for conditional routing
 */
export interface EdgeCondition {
    condition: string;
    nextNode: string;
}

/**
 * Graph node definition
 */
export interface GraphNode {
    id: string;
    type: NodeType;
    description: string;
    handler: (state: WorkflowState) => Promise<WorkflowState>;
    conditions?: EdgeCondition[];
}

/**
 * Graph edge definition
 */
export interface GraphEdge {
    from: string;
    to: string;
    condition?: string;
}
