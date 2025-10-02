/**
 * TypeScript Workflow System - Core Types
 * 
 * This module defines the core types for a pure TypeScript workflow system
 * that integrates directly with the VSCode extension.
 */

export enum WorkflowStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}

export enum NodeType {
    START = "start",
    ASSISTANT = "assistant",
    TOOL = "tool",
    CONDITIONAL = "conditional",
    PARALLEL = "parallel",
    END = "end"
}

export interface WorkflowState {
    workflowId: string;
    sessionId: string;
    status: WorkflowStatus;
    currentNode?: string;
    previousNode?: string;
    executionPath: string[];
    inputData: Record<string, any>;
    outputData: Record<string, any>;
    intermediateResults: Record<string, any>;
    messages: WorkflowMessage[];
    context: Record<string, any>;
    availableTools: string[];
    toolResults: Record<string, any>;
    mcpServers: string[];
    mcpContext: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, any>;
    error?: string;
    retryCount: number;
    maxRetries: number;
}

export interface WorkflowResult {
    workflowId: string;
    status: WorkflowStatus;
    outputData: Record<string, any>;
    executionPath: string[];
    durationSeconds: number;
    error?: string;
    metadata: Record<string, any>;
}

export interface NodeResult {
    nodeId: string;
    nodeType: NodeType;
    success: boolean;
    output: Record<string, any>;
    error?: string;
    executionTime: number;
    metadata: Record<string, any>;
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, any>;
    requiredParameters: string[];
    optionalParameters: string[];
    category: string;
    tags: string[];
}

export interface WorkflowConfig {
    workflowName: string;
    modelProvider: string;
    modelName: string;
    maxIterations: number;
    timeoutSeconds: number;
    enableParallelExecution: boolean;
    enableRetry: boolean;
    logLevel: string;
    metadata: Record<string, any>;
}

export interface WorkflowMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    toolCalls?: ToolCall[];
    toolCallId?: string;
}

export interface ToolCall {
    toolName: string;
    parameters: Record<string, any>;
    callId: string;
}

export interface ToolInput {
    [key: string]: any;
}

export interface ToolOutput {
    success: boolean;
    result: any;
    error?: string;
    metadata: Record<string, any>;
}

export interface McpServerConfig {
    name: string;
    serverType: 'http' | 'websocket' | 'stdio';
    endpoint?: string;
    command?: string;
    args: string[];
    auth?: Record<string, any>;
    capabilities: string[];
    enabled: boolean;
    timeoutSeconds: number;
    retryAttempts: number;
    metadata: Record<string, any>;
}

export interface McpTool {
    name: string;
    description: string;
    parameters: Record<string, any>;
    serverName: string;
    category: string;
    tags: string[];
}

export interface McpRequest {
    method: string;
    params: Record<string, any>;
    requestId?: string;
    timeout?: number;
}

export interface McpResponse {
    requestId: string;
    result?: any;
    error?: Record<string, any>;
    success: boolean;
}
