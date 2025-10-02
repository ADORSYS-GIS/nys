/**
 * LangGraph Workflow Commands
 * 
 * This module provides VSCode commands for the LangGraph-based workflow system,
 * including debugging, visualization, and execution capabilities.
 */

import * as vscode from 'vscode';
import { LangGraphWorkflowEngine } from './langgraphWorkflowEngine';
import { LangGraphDesignWorkflow } from './workflows/langgraphDesignWorkflow';
import { LangGraphVisualizer } from './debug/langgraphVisualizer';
import { SimpleWorkflowVisualizer } from './debug/simpleWorkflowVisualizer';
import { ToolRegistry } from '../toolRegistry';
import { CalculatorTool } from '../tools/calculatorTool';
import { WebSearchTool } from '../tools/webSearchTool';

export class LangGraphWorkflowCommands {
    private workflowManager: Map<string, LangGraphWorkflowEngine> = new Map();
    private visualizer: LangGraphVisualizer;
    private simpleVisualizer: SimpleWorkflowVisualizer;
    private toolRegistry: ToolRegistry;

    constructor(context: vscode.ExtensionContext) {
        this.visualizer = new LangGraphVisualizer();
        this.simpleVisualizer = new SimpleWorkflowVisualizer();
        this.toolRegistry = new ToolRegistry();
        this.initializeTools();
        this.initializeWorkflows();
        this.registerCommands(context);
    }

    /**
     * Initialize tools for the workflow system
     */
    private initializeTools(): void {
        this.toolRegistry.registerTool(new CalculatorTool());
        this.toolRegistry.registerTool(new WebSearchTool());
        console.log(`🔧 Initialized ${this.toolRegistry.listTools().length} tools for LangGraph workflows`);
    }

    /**
     * Initialize LangGraph workflows
     */
    private initializeWorkflows(): void {
        // Design orchestration workflow
        const designWorkflow = new LangGraphDesignWorkflow(this.toolRegistry);
        this.workflowManager.set('design_orchestration', designWorkflow);
        
        console.log(`✅ Initialized ${this.workflowManager.size} LangGraph workflows`);
    }

    /**
     * Register VSCode commands
     */
    private registerCommands(context: vscode.ExtensionContext): void {
        // LangGraph workflow execution commands
        const executeDesignCommand = vscode.commands.registerCommand(
            'langgraph-workflow.executeDesign',
            this.executeDesignWorkflow.bind(this)
        );

        const visualizeWorkflowCommand = vscode.commands.registerCommand(
            'langgraph-workflow.visualize',
            this.visualizeWorkflow.bind(this)
        );

        const debugWorkflowCommand = vscode.commands.registerCommand(
            'langgraph-workflow.debug',
            this.debugWorkflow.bind(this)
        );

        const showGraphStructureCommand = vscode.commands.registerCommand(
            'langgraph-workflow.showGraphStructure',
            this.showGraphStructure.bind(this)
        );

        const testLangGraphCommand = vscode.commands.registerCommand(
            'langgraph-workflow.test',
            this.testLangGraphWorkflow.bind(this)
        );

        const showSimpleVisualizationCommand = vscode.commands.registerCommand(
            'langgraph-workflow.showSimpleVisualization',
            this.showSimpleVisualization.bind(this)
        );

        // Add commands to context
        context.subscriptions.push(
            executeDesignCommand,
            visualizeWorkflowCommand,
            debugWorkflowCommand,
            showGraphStructureCommand,
            testLangGraphCommand,
            showSimpleVisualizationCommand
        );
    }

    /**
     * Execute design workflow
     */
    private async executeDesignWorkflow(): Promise<void> {
        const userInput = await vscode.window.showInputBox({
            prompt: 'Enter your design request',
            placeHolder: 'e.g., Create a simple todo app with authentication',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Please enter your design request';
                }
                return null;
            }
        });

        if (!userInput) {
            return;
        }

        try {
            vscode.window.showInformationMessage('🚀 Executing LangGraph design workflow...');
            
            const workflow = this.workflowManager.get('design_orchestration');
            if (!workflow) {
                throw new Error('Design workflow not found');
            }

            const result = await workflow.execute({
                user_input: userInput,
                mode: 'design',
                project_path: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '/tmp'
            });

            if (result.status === 'completed') {
                const message = `✅ LangGraph design workflow completed successfully! Duration: ${result.durationSeconds.toFixed(2)}s`;
                vscode.window.showInformationMessage(message);
                
                // Show generated files
                if (result.outputData.generatedFiles) {
                    const files = result.outputData.generatedFiles.map((f: any) => f.path).join(', ');
                    vscode.window.showInformationMessage(`📁 Generated files: ${files}`);
                }
            } else {
                vscode.window.showErrorMessage(`❌ Design workflow failed: ${result.error}`);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`❌ Workflow execution failed: ${errorMessage}`);
        }
    }

    /**
     * Visualize workflow execution
     */
    private async visualizeWorkflow(): Promise<void> {
        try {
            const workflow = this.workflowManager.get('design_orchestration');
            if (!workflow) {
                vscode.window.showErrorMessage('No workflow available for visualization');
                return;
            }

            // Execute a sample workflow to get state for visualization
            const result = await workflow.execute({
                user_input: 'Create a sample todo app',
                mode: 'design',
                project_path: '/tmp'
            });

            // Create visualization graph
            const graph = this.visualizer.createWorkflowGraph(workflow, {
                workflowId: result.workflowId,
                sessionId: `session_${Date.now()}`,
                status: result.status as any,
                executionPath: result.executionPath,
                inputData: { user_input: 'Create a sample todo app' },
                outputData: result.outputData,
                intermediateResults: {},
                messages: [],
                context: {},
                availableTools: this.toolRegistry.listTools(),
                toolResults: {},
                pendingToolCalls: [],
                mcpServers: [],
                mcpContext: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: result.metadata,
                retryCount: 0,
                maxRetries: 3,
                requiresHumanInput: false
            });

            this.visualizer.createVisualizationPanel(graph);
            vscode.window.showInformationMessage('📊 LangGraph workflow visualization opened');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`❌ Visualization failed: ${errorMessage}`);
        }
    }

    /**
     * Debug workflow execution
     */
    private async debugWorkflow(): Promise<void> {
        try {
            const workflow = this.workflowManager.get('design_orchestration');
            if (!workflow) {
                vscode.window.showErrorMessage('No workflow available for debugging');
                return;
            }

            // Execute workflow with debugging
            const result = await workflow.execute({
                user_input: 'Debug: Create a simple calculator app',
                mode: 'design',
                project_path: '/tmp'
            });

            // Create state for debugging
            const state = {
                workflowId: result.workflowId,
                sessionId: `session_${Date.now()}`,
                status: result.status as any,
                executionPath: result.executionPath,
                inputData: { user_input: 'Debug: Create a simple calculator app' },
                outputData: result.outputData,
                intermediateResults: {},
                messages: [],
                context: {},
                availableTools: this.toolRegistry.listTools(),
                toolResults: {},
                pendingToolCalls: [],
                mcpServers: [],
                mcpContext: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: result.metadata,
                retryCount: 0,
                maxRetries: 3,
                requiresHumanInput: false
            };

            this.visualizer.logWorkflowExecution(state, result);
            vscode.window.showInformationMessage('🔍 LangGraph workflow debug information logged');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`❌ Debug failed: ${errorMessage}`);
        }
    }

    /**
     * Show graph structure
     */
    private showGraphStructure(): void {
        const workflow = this.workflowManager.get('design_orchestration');
        if (!workflow) {
            vscode.window.showErrorMessage('No workflow available');
            return;
        }

        const structure = workflow.getGraphStructure();
        
        const message = `📊 LangGraph Structure:
Nodes: ${structure.nodes.join(', ')}
Edges: ${structure.edges.length}
Workflow: ${structure.config.workflowName}
Max Iterations: ${structure.config.maxIterations}`;

        vscode.window.showInformationMessage(message);
        this.visualizer.showOutput();
    }

    /**
     * Test LangGraph workflow system
     */
    private async testLangGraphWorkflow(): Promise<void> {
        try {
            vscode.window.showInformationMessage('🧪 Testing LangGraph workflow system...');
            
            const workflow = this.workflowManager.get('design_orchestration');
            if (!workflow) {
                throw new Error('Design workflow not found');
            }

            // Test basic workflow execution
            const result = await workflow.execute({
                user_input: 'Test: Create a simple blog application',
                mode: 'design',
                project_path: '/tmp'
            });

            // Validate result
            const isValid = result.status === 'completed' && 
                           result.executionPath.length > 0 && 
                           result.durationSeconds > 0;

            if (isValid) {
                const message = `✅ LangGraph test passed! 
Status: ${result.status}
Duration: ${result.durationSeconds.toFixed(2)}s
Path: ${result.executionPath.join(' → ')}`;
                vscode.window.showInformationMessage(message);
            } else {
                vscode.window.showErrorMessage(`❌ LangGraph test failed: ${result.error || 'Invalid result'}`);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`❌ LangGraph test failed: ${errorMessage}`);
        }
    }

    /**
     * Get workflow status
     */
    getStatus(): any {
        return {
            availableWorkflows: Array.from(this.workflowManager.keys()),
            availableTools: this.toolRegistry.listTools(),
            toolRegistryStats: {
                totalTools: this.toolRegistry.listTools().length
            }
        };
    }

    /**
     * Show simple workflow visualization
     */
    private async showSimpleVisualization(): Promise<void> {
        try {
            await this.simpleVisualizer.showVisualization();
            vscode.window.showInformationMessage('Simple workflow visualization opened!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show visualization: ${error}`);
        }
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.visualizer.dispose();
        this.workflowManager.clear();
    }
}
