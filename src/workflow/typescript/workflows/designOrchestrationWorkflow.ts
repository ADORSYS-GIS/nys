/**
 * Design Orchestration Workflow
 * 
 * This workflow handles the design mode orchestration, where the user's first prompt
 * is processed to generate project requirements and specifications.
 */

import { WorkflowEngine } from '../workflowEngine';
import { ToolRegistry } from '../toolRegistry';
import { WorkflowConfig } from '../types';
import { DesignOrchestrationNode } from '../nodes/designOrchestrationNode';
import { RequirementsGenerationNode } from '../nodes/requirementsGenerationNode';
import { FileWriteNode } from '../nodes/fileWriteNode';
import { StartNode } from '../nodes/startNode';
import { EndNode } from '../nodes/endNode';

export class DesignOrchestrationWorkflow extends WorkflowEngine {
    constructor(toolRegistry: ToolRegistry) {
        const config: WorkflowConfig = {
            workflowName: 'design_orchestration',
            modelProvider: 'typescript',
            modelName: 'built-in',
            maxIterations: 10,
            timeoutSeconds: 300,
            enableParallelExecution: false,
            enableRetry: true,
            logLevel: 'INFO',
            metadata: {
                description: 'Orchestrates design mode workflow from user prompt to requirements',
                mode: 'design'
            }
        };

        super(config, toolRegistry);
        // Clear default nodes and initialize design-specific nodes
        this.nodes.clear();
        this.initializeDesignNodes();
    }

    private initializeDesignNodes(): void {
        // Add essential start and end nodes
        const startNode = new StartNode();
        const endNode = new EndNode();
        
        // Add specialized design nodes
        const designOrchestrationNode = new DesignOrchestrationNode();
        const requirementsGenerationNode = new RequirementsGenerationNode();
        const fileWriteNode = new FileWriteNode();

        // Register all nodes
        this.addNode('start', startNode);
        this.addNode('end', endNode);
        this.addNode('design_orchestration', designOrchestrationNode);
        this.addNode('requirements_generation', requirementsGenerationNode);
        this.addNode('file_write', fileWriteNode);
        
        console.log('🎨 Design nodes initialized:', Array.from(this.nodes.keys()));
    }

    /**
     * Override the workflow execution to use design-specific flow
     */
    protected async executeWorkflowGraph(state: any): Promise<any> {
        console.log('🎨 Starting design orchestration workflow execution');
        let currentNode = 'start';
        let iterations = 0;

        while (currentNode && iterations < this.config.maxIterations) {
            console.log(`🔄 Executing node: ${currentNode} (iteration ${iterations + 1})`);
            
            const node = this.nodes.get(currentNode);
            if (!node) {
                const error = `Node '${currentNode}' not found. Available nodes: ${Array.from(this.nodes.keys()).join(', ')}`;
                console.error('❌', error);
                throw new Error(error);
            }

            try {
                // Execute node
                state = await node.execute(state);
                state.updatedAt = new Date();
                console.log(`✅ Node ${currentNode} executed successfully`);

                // Check if we've reached the end node
                if (currentNode === 'end') {
                    console.log('🏁 Reached end node, workflow completed');
                    break;
                }

                // Determine next node based on design workflow logic
                const nextNode = this.getDesignNextNode(currentNode, state);
                console.log(`➡️ Next node: ${nextNode}`);
                currentNode = nextNode || 'end';
                iterations++;
            } catch (error) {
                console.error(`❌ Error executing node ${currentNode}:`, error);
                state.status = 'failed';
                state.error = error instanceof Error ? error.message : String(error);
                break;
            }
        }

        if (iterations >= this.config.maxIterations) {
            console.warn('⚠️ Maximum iterations reached in design workflow');
            state.status = 'failed';
            state.error = 'Maximum iterations reached in design workflow';
        }

        // Ensure status is set correctly
        if (state.status === 'running') {
            console.warn('⚠️ Workflow ended with running status, setting to completed');
            state.status = 'completed';
        }
        
        console.log(`🏁 Design orchestration workflow completed. Status: ${state.status}`);
        return state;
    }

    private getDesignNextNode(currentNode: string, _state: any): string | null {
        switch (currentNode) {
            case 'start':
                return 'design_orchestration';
            
            case 'design_orchestration':
                return 'requirements_generation';
            
            case 'requirements_generation':
                return 'file_write';
            
            case 'file_write':
                return 'end';
            
            case 'end':
                return null;
            
            default:
                return 'end';
        }
    }
}
