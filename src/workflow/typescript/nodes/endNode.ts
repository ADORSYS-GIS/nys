/**
 * TypeScript Workflow System - End Node
 * 
 * Workflow termination node.
 */

import { BaseNode } from './baseNode';
import { WorkflowState, WorkflowStatus, NodeType } from '../types';

export class EndNode extends BaseNode {
    constructor(nodeId: string = 'end') {
        super(nodeId, NodeType.END, 'Workflow termination');
    }

    async execute(state: WorkflowState): Promise<WorkflowState> {
        const startTime = Date.now();

        try {
            // Update state
            state.currentNode = this.nodeId;
            state.executionPath.push(this.nodeId);
            state.status = WorkflowStatus.COMPLETED;
            state.updatedAt = new Date();

            // Prepare final output
            const finalOutput = {
                workflowId: state.workflowId,
                status: state.status,
                executionPath: state.executionPath,
                messages: state.messages,
                toolResults: state.toolResults,
                intermediateResults: state.intermediateResults,
                metadata: state.metadata
            };

            state.outputData = finalOutput;

            const result = this.createNodeResult(
                true,
                finalOutput,
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
}
