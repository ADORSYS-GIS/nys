/**
 * TypeScript Workflow System - Tool Node
 * 
 * Tool execution node.
 */

import { BaseNode } from './baseNode';
import { WorkflowState, WorkflowStatus, NodeType, ToolCall } from '../types';
import { ToolRegistry } from '../toolRegistry';

export class ToolNode extends BaseNode {
    private toolRegistry: ToolRegistry;

    constructor(toolRegistry: ToolRegistry, nodeId: string = 'tool') {
        super(nodeId, NodeType.TOOL, 'Tool execution');
        this.toolRegistry = toolRegistry;
    }

    async execute(state: WorkflowState): Promise<WorkflowState> {
        const startTime = Date.now();

        try {
            // Update state
            state.currentNode = this.nodeId;
            state.executionPath.push(this.nodeId);
            state.updatedAt = new Date();

            // Get pending tool calls
            const pendingCalls = state.context.pendingToolCalls as ToolCall[] || [];
            if (pendingCalls.length === 0) {
                const result = this.createNodeResult(
                    true,
                    { message: 'No tools to execute' },
                    undefined,
                    Date.now() - startTime
                );
                state.intermediateResults[this.nodeId] = result;
                return state;
            }

            // Execute each tool call
            const toolResults: Record<string, any> = {};
            for (const call of pendingCalls) {
                try {
                    const result = await this.executeToolCall(call);
                    toolResults[call.callId] = result;
                } catch (error) {
                    toolResults[call.callId] = {
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                        output: null
                    };
                }
            }

            // Update state with tool results
            state.toolResults = { ...state.toolResults, ...toolResults };
            state.context.pendingToolCalls = [];
            state.context.nextAction = 'return_to_assistant';

            const result = this.createNodeResult(
                true,
                { toolResults: toolResults },
                undefined,
                Date.now() - startTime
            );

            state.intermediateResults[this.nodeId] = result;

            return state;

        } catch (error) {
            state.error = error instanceof Error ? error.message : String(error);
            state.status = WorkflowStatus.FAILED;

            const result = this.createNodeResult(
                false,
                {},
                state.error,
                Date.now() - startTime
            );

            state.intermediateResults[this.nodeId] = result;
            return state;
        }
    }

    private async executeToolCall(call: ToolCall): Promise<any> {
        const toolName = call.toolName;
        const parameters = call.parameters;

        // Get tool from registry
        const tool = this.toolRegistry.getTool(toolName);
        if (!tool) {
            throw new Error(`Tool '${toolName}' not found in registry`);
        }

        // Execute tool
        const result = await tool.execute(parameters);

        return {
            success: result.success,
            output: result.result,
            toolName: toolName,
            parameters: parameters,
            error: result.error,
            metadata: result.metadata
        };
    }
}
