/**
 * TypeScript Workflow Commands
 * 
 * This module provides VSCode commands that use the pure TypeScript workflow system,
 * eliminating the need for external Python processes.
 */

import * as vscode from 'vscode';
import { TypeScriptWorkflowManager, WorkflowRequest } from './typescriptWorkflowManager';

export class TypeScriptWorkflowCommands {
    private workflowManager: TypeScriptWorkflowManager;

    constructor(context: vscode.ExtensionContext) {
        this.workflowManager = new TypeScriptWorkflowManager();
        this.registerCommands(context);
    }

    private registerCommands(context: vscode.ExtensionContext): void {
        // Calculator workflow command
        const calculatorCommand = vscode.commands.registerCommand(
            'mira-workflow.calculator',
            this.executeCalculatorWorkflow.bind(this)
        );

        // Multi-tool workflow command
        const multiToolCommand = vscode.commands.registerCommand(
            'mira-workflow.multiTool',
            this.executeMultiToolWorkflow.bind(this)
        );

        // Custom workflow command
        const customCommand = vscode.commands.registerCommand(
            'mira-workflow.custom',
            this.executeCustomWorkflow.bind(this)
        );

        // Show status command
        const statusCommand = vscode.commands.registerCommand(
            'mira-workflow.showStatus',
            this.showWorkflowStatus.bind(this)
        );

        // Show output command
        const outputCommand = vscode.commands.registerCommand(
            'mira-workflow.showOutput',
            this.showOutput.bind(this)
        );

        // Debug design workflow command
        const debugDesignCommand = vscode.commands.registerCommand(
            'mira-workflow.debugDesign',
            this.debugDesignWorkflow.bind(this)
        );

        // Add commands to context
        context.subscriptions.push(
            calculatorCommand,
            multiToolCommand,
            customCommand,
            statusCommand,
            outputCommand,
            debugDesignCommand
        );
    }

    /**
     * Execute calculator workflow
     */
    private async executeCalculatorWorkflow(): Promise<void> {
        const expression = await vscode.window.showInputBox({
            prompt: 'Enter mathematical expression to calculate',
            placeHolder: 'e.g., 2 + 3 * 4, (10 - 5) / 2, 2^8',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Please enter a mathematical expression';
                }
                return null;
            }
        });

        if (!expression) {
            return;
        }

        try {
            this.workflowManager.showOutput();
            this.workflowManager.showOutput(); // Show output channel
            
            const result = await this.workflowManager.executeCalculator(expression);
            
            if (result.success) {
                const message = `Calculation result: ${result.result}`;
                vscode.window.showInformationMessage(message);
                this.workflowManager.showOutput();
            } else {
                vscode.window.showErrorMessage(`Calculation failed: ${result.error}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Workflow execution failed: ${errorMessage}`);
        }
    }

    /**
     * Execute multi-tool workflow
     */
    private async executeMultiToolWorkflow(): Promise<void> {
        const userInput = await vscode.window.showInputBox({
            prompt: 'Enter your request (will use multiple tools)',
            placeHolder: 'e.g., Calculate 5 * 7 and search for Python tutorials',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Please enter your request';
                }
                return null;
            }
        });

        if (!userInput) {
            return;
        }

        try {
            this.workflowManager.showOutput();
            
            const result = await this.workflowManager.executeMultiTool(userInput);
            
            if (result.success) {
                vscode.window.showInformationMessage('Multi-tool workflow completed successfully');
            } else {
                vscode.window.showErrorMessage(`Multi-tool workflow failed: ${result.error}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Workflow execution failed: ${errorMessage}`);
        }
    }

    /**
     * Execute custom workflow
     */
    private async executeCustomWorkflow(): Promise<void> {
        const userInput = await vscode.window.showInputBox({
            prompt: 'Enter your custom request',
            placeHolder: 'Describe what you want to accomplish...',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Please enter your request';
                }
                return null;
            }
        });

        if (!userInput) {
            return;
        }

        try {
            this.workflowManager.showOutput();
            
            const result = await this.workflowManager.executeCustom(userInput);
            
            if (result.success) {
                vscode.window.showInformationMessage('Custom workflow completed successfully');
            } else {
                vscode.window.showErrorMessage(`Custom workflow failed: ${result.error}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Workflow execution failed: ${errorMessage}`);
        }
    }

    /**
     * Show workflow status
     */
    private showWorkflowStatus(): void {
        const status = this.workflowManager.getStatus();
        
        const statusMessage = `✅ Mira Workflow System Active
Available workflows: ${status.availableWorkflows.join(', ')}
Available tools: ${status.availableTools.join(', ')}
Total tools: ${status.toolRegistryStats.totalTools}`;
        
        vscode.window.showInformationMessage(statusMessage);
        this.workflowManager.showOutput();
    }

    /**
     * Show output channel
     */
    private showOutput(): void {
        this.workflowManager.showOutput();
    }

    /**
     * Debug design workflow
     */
    private async debugDesignWorkflow(): Promise<void> {
        try {
            vscode.window.showInformationMessage('🔍 Testing design workflow...');
            
            const request = {
                workflowType: 'design_orchestration',
                input: {
                    user_input: 'Create a simple todo app',
                    issue_id: 'debug-test',
                    issue_title: 'Debug Test',
                    issue_description: 'Testing the design workflow',
                    mode: 'design',
                    project_path: '/tmp'
                },
                config: {
                    maxIterations: 5,
                    timeoutSeconds: 60,
                    enableRetry: true
                }
            };

            const result = await this.workflowManager.executeWorkflow(request);
            
            if (result.success) {
                vscode.window.showInformationMessage(`✅ Design workflow test successful! Duration: ${result.duration}s`);
            } else {
                vscode.window.showErrorMessage(`❌ Design workflow test failed: ${result.error}`);
            }
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`❌ Debug test failed: ${errorMessage}`);
        }
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.workflowManager.dispose();
    }
}
