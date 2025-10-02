/**
 * TypeScript Workflow System - Workflow Engine
 * 
 * This module provides the core workflow execution engine for the TypeScript workflow system.
 */

import { 
    WorkflowState, 
    WorkflowResult, 
    WorkflowStatus, 
    WorkflowConfig, 
    WorkflowMessage,
    NodeType,
    ToolCall
} from './types';
import { ToolRegistry } from './toolRegistry';
import { BaseNode } from './nodes/baseNode';
import { StartNode } from './nodes/startNode';
import { AssistantNode } from './nodes/assistantNode';
import { ToolNode } from './nodes/toolNode';
import { EndNode } from './nodes/endNode';

export class WorkflowEngine {
    protected config: WorkflowConfig;
    protected toolRegistry: ToolRegistry;
    protected nodes: Map<string, BaseNode> = new Map();
    private isRunning = false;

    constructor(config: WorkflowConfig, toolRegistry: ToolRegistry) {
        this.config = config;
        this.toolRegistry = toolRegistry;
        this.initializeDefaultNodes();
    }

    /**
     * Initialize default workflow nodes
     */
    private initializeDefaultNodes(): void {
        // Create default nodes
        const startNode = new StartNode();
        const assistantNode = new AssistantNode(this.config);
        const toolNode = new ToolNode(this.toolRegistry);
        const endNode = new EndNode();

        // Register nodes
        this.nodes.set('start', startNode);
        this.nodes.set('assistant', assistantNode);
        this.nodes.set('tool', toolNode);
        this.nodes.set('end', endNode);
    }

    /**
     * Execute a workflow
     */
    async execute(inputData: Record<string, any>, initialMessages?: WorkflowMessage[]): Promise<WorkflowResult> {
        if (this.isRunning) {
            throw new Error('Workflow is already running');
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            // Initialize workflow state
            const state: WorkflowState = {
                workflowId: `workflow_${Date.now()}`,
                sessionId: `session_${Date.now()}`,
                status: WorkflowStatus.PENDING,
                executionPath: [],
                inputData,
                outputData: {},
                intermediateResults: {},
                messages: initialMessages || [],
                context: {},
                availableTools: this.toolRegistry.listTools(),
                toolResults: {},
                mcpServers: [],
                mcpContext: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: {},
                retryCount: 0,
                maxRetries: this.config.enableRetry ? 3 : 0
            };

            // Execute workflow graph
            const finalState = await this.executeWorkflowGraph(state);

            // Create result
            const duration = (Date.now() - startTime) / 1000;
            const result: WorkflowResult = {
                workflowId: finalState.workflowId,
                status: finalState.status,
                outputData: finalState.outputData,
                executionPath: finalState.executionPath,
                durationSeconds: duration,
                error: finalState.error,
                metadata: finalState.metadata
            };

            return result;

        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Execute the workflow graph
     */
    protected async executeWorkflowGraph(state: WorkflowState): Promise<WorkflowState> {
        let currentNode = 'start';
        let iterations = 0;

        while (currentNode && currentNode !== 'end' && iterations < this.config.maxIterations) {
            const node = this.nodes.get(currentNode);
            if (!node) {
                throw new Error(`Node '${currentNode}' not found`);
            }

            // Execute node
            state = await node.execute(state);
            state.updatedAt = new Date();

            // Determine next node
            const nextNode = this.getNextNode(currentNode, state);
            currentNode = nextNode || 'end';
            iterations++;
        }

        if (iterations >= this.config.maxIterations) {
            state.status = WorkflowStatus.FAILED;
            state.error = 'Maximum iterations reached';
        }

        return state;
    }

    /**
     * Determine the next node to execute
     */
    private getNextNode(currentNode: string, state: WorkflowState): string | null {
        switch (currentNode) {
            case 'start':
                return 'assistant';
            
            case 'assistant':
                const nextAction = state.context.nextAction;
                if (nextAction === 'execute_tools') {
                    return 'tool';
                } else if (nextAction === 'complete') {
                    return 'end';
                }
                return 'end'; // Default fallback
            
            case 'tool':
                const toolNextAction = state.context.nextAction;
                if (toolNextAction === 'return_to_assistant') {
                    return 'assistant';
                } else if (toolNextAction === 'complete') {
                    return 'end';
                }
                return 'end'; // Default fallback
            
            case 'end':
                return null; // Workflow complete
            
            default:
                return 'end'; // Unknown node, end workflow
        }
    }

    /**
     * Add a custom node to the workflow
     */
    addNode(nodeId: string, node: BaseNode): void {
        this.nodes.set(nodeId, node);
    }

    /**
     * Get workflow information
     */
    getWorkflowInfo(): Record<string, any> {
        return {
            workflowName: this.config.workflowName,
            config: {
                modelProvider: this.config.modelProvider,
                modelName: this.config.modelName,
                maxIterations: this.config.maxIterations,
                timeoutSeconds: this.config.timeoutSeconds,
                enableParallelExecution: this.config.enableParallelExecution,
                enableRetry: this.config.enableRetry
            },
            nodes: Array.from(this.nodes.keys()),
            availableTools: this.toolRegistry.listTools(),
            isRunning: this.isRunning
        };
    }

    /**
     * Check if workflow is running
     */
    isWorkflowRunning(): boolean {
        return this.isRunning;
    }
}
