/**
 * TypeScript Workflow System - Start Node
 * 
 * Entry point node for the workflow.
 */

import { BaseNode } from './baseNode';
import { WorkflowState, WorkflowStatus, NodeType } from '../types';

export class StartNode extends BaseNode {
    constructor(nodeId: string = 'start') {
        super(nodeId, NodeType.START, 'Workflow entry point');
    }

    async execute(state: WorkflowState): Promise<WorkflowState> {
        const startTime = Date.now();

        try {
            // Update state
            state.status = WorkflowStatus.RUNNING;
            state.currentNode = this.nodeId;
            state.executionPath.push(this.nodeId);
            state.updatedAt = new Date();

            // Log the start
            const result = this.createNodeResult(
                true,
                { message: 'Workflow started successfully' },
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
