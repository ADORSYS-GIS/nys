/**
 * Build Generation Workflow
 * 
 * This workflow handles the build mode, where requirements are read and code is generated.
 */

import { WorkflowEngine } from '../workflowEngine';
import { ToolRegistry } from '../toolRegistry';
import { WorkflowConfig } from '../types';
import { RequirementsReadingNode } from '../nodes/requirementsReadingNode';
import { CodeGenerationNode } from '../nodes/codeGenerationNode';
import { CodeWriteNode } from '../nodes/codeWriteNode';

export class BuildGenerationWorkflow extends WorkflowEngine {
    constructor(toolRegistry: ToolRegistry) {
        const config: WorkflowConfig = {
            workflowName: 'build_generation',
            modelProvider: 'typescript',
            modelName: 'built-in',
            maxIterations: 15,
            timeoutSeconds: 600,
            enableParallelExecution: false,
            enableRetry: true,
            logLevel: 'INFO',
            metadata: {
                description: 'Generates code from requirements in build mode',
                mode: 'build'
            }
        };

        super(config, toolRegistry);
        this.initializeBuildNodes();
    }

    private initializeBuildNodes(): void {
        // Add specialized build nodes
        const requirementsReadingNode = new RequirementsReadingNode();
        const codeGenerationNode = new CodeGenerationNode();
        const codeWriteNode = new CodeWriteNode();

        this.addNode('requirements_reading', requirementsReadingNode);
        this.addNode('code_generation', codeGenerationNode);
        this.addNode('code_write', codeWriteNode);
    }

    /**
     * Override the workflow execution to use build-specific flow
     */
    protected async executeWorkflowGraph(state: any): Promise<any> {
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

            // Determine next node based on build workflow logic
            const nextNode = this.getBuildNextNode(currentNode, state);
            currentNode = nextNode || 'end';
            iterations++;
        }

        if (iterations >= this.config.maxIterations) {
            state.status = 'failed';
            state.error = 'Maximum iterations reached in build workflow';
        }

        return state;
    }

    private getBuildNextNode(currentNode: string, _state: any): string | null {
        switch (currentNode) {
            case 'start':
                return 'requirements_reading';
            
            case 'requirements_reading':
                return 'code_generation';
            
            case 'code_generation':
                return 'code_write';
            
            case 'code_write':
                return 'end';
            
            case 'end':
                return null;
            
            default:
                return 'end';
        }
    }
}
