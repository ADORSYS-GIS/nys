/**
 * TypeScript Workflow System - Base Node
 * 
 * This module provides the base node interface for the TypeScript workflow system.
 */

import { WorkflowState, NodeResult, NodeType } from '../types';

export abstract class BaseNode {
    public readonly nodeId: string;
    public readonly nodeType: NodeType;
    public readonly description: string;
    protected readonly config: Record<string, any>;

    constructor(
        nodeId: string,
        nodeType: NodeType,
        description: string = '',
        config: Record<string, any> = {}
    ) {
        this.nodeId = nodeId;
        this.nodeType = nodeType;
        this.description = description;
        this.config = config;
    }

    /**
     * Execute the node logic and return updated state
     */
    abstract execute(state: WorkflowState): Promise<WorkflowState>;

    /**
     * Create a standardized node result
     */
    protected createNodeResult(
        success: boolean,
        output: Record<string, any>,
        error?: string,
        executionTime: number = 0,
        metadata: Record<string, any> = {}
    ): NodeResult {
        return {
            nodeId: this.nodeId,
            nodeType: this.nodeType,
            success,
            output,
            error,
            executionTime,
            metadata
        };
    }
}
