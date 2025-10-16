import * as vscode from 'vscode';
import { EnhancedWorkflowExecutor } from './enhancedWorkflowExecutor';

export class EnhancedWorkflowDemoCommands {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommands();
    }

    private registerCommands(): void {
        // Demo command for enhanced workflow with confidence feedback
        const runEnhancedWorkflowCommand = vscode.commands.registerCommand('mimie.runEnhancedWorkflowDemo', async () => {
            try {
                // Get user input
                const userInput = await vscode.window.showInputBox({
                    prompt: 'What would you like to build? (Try vague requests to see confidence feedback)',
                    placeHolder: 'e.g., "design the calculator function in the issue title" or "create a todo app"',
                    value: 'design the calculator function in the issue title'
                });

                if (!userInput) {
                    vscode.window.showWarningMessage('No input provided. Demo cancelled.');
                    return;
                }

                // Show progress
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Running Enhanced Workflow with Confidence Feedback",
                    cancellable: true
                }, async (progress, _token) => {
                    progress.report({ message: "Starting enhanced workflow..." });

                    // Create enhanced workflow executor
                    const executor = new EnhancedWorkflowExecutor(this.context);
                    
                    // Create SPARC workflow steps
                    const steps = executor.createSparcWorkflowSteps(userInput);
                    
                    // Execute workflow with real-time feedback
                    const result = await executor.executeWorkflow('SPARC Design Workflow', steps, userInput);

                    progress.report({ message: "Enhanced workflow completed!" });

                    // Show results
                    vscode.window.showInformationMessage(
                        `Enhanced workflow completed! Check the Workflow Progress panel for detailed feedback.`,
                        'Open Progress Panel',
                        'Show Results'
                    ).then(selection => {
                        if (selection === 'Open Progress Panel') {
                            vscode.commands.executeCommand('mimie.showWorkflowProgress');
                        } else if (selection === 'Show Results') {
                            this.showResults(result);
                        }
                    });
                });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`Enhanced workflow failed: ${errorMessage}`);
                console.error('Enhanced workflow error:', error);
            }
        });

        // Command to test confidence analysis
        const testConfidenceCommand = vscode.commands.registerCommand('mimie.testConfidenceAnalysis', async () => {
            const testInputs = [
                'design the calculator function in the issue title',
                'create a todo app',
                'build something',
                'help me with coding',
                'Create a Python calculator function that supports basic arithmetic (+, -, *, /) with error handling for division by zero, takes string input like "2 + 3", and returns float results'
            ];

            const selectedInput = await vscode.window.showQuickPick(
                testInputs.map((input, index) => ({
                    label: `Test ${index + 1}`,
                    description: input.substring(0, 50) + '...',
                    detail: input
                })),
                {
                    placeHolder: 'Select a test input to analyze confidence'
                }
            );

            if (selectedInput) {
                const executor = new EnhancedWorkflowExecutor(this.context);
                const analysis = await executor.analyzeUserInput(selectedInput.detail);
                
                const outputChannel = vscode.window.createOutputChannel('Confidence Analysis');
                outputChannel.show();
                outputChannel.appendLine('=== CONFIDENCE ANALYSIS ===');
                outputChannel.appendLine(`Input: ${selectedInput.detail}`);
                outputChannel.appendLine(`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
                outputChannel.appendLine(`Is Unclear: ${analysis.isUnclear}`);
                outputChannel.appendLine(`Missing Information: ${analysis.missingInformation.join(', ')}`);
                outputChannel.appendLine('');
                outputChannel.appendLine('=== USER GUIDANCE ===');
                outputChannel.appendLine(analysis.userGuidance);
            }
        });

        // Command to show workflow progress
        const showProgressCommand = vscode.commands.registerCommand('mimie.showWorkflowProgressDemo', () => {
            vscode.commands.executeCommand('mimie.showWorkflowProgress');
        });

        // Register commands
        this.context.subscriptions.push(
            runEnhancedWorkflowCommand,
            testConfidenceCommand,
            showProgressCommand
        );
    }

    /**
     * Show workflow results
     */
    private showResults(result: any): void {
        const outputChannel = vscode.window.createOutputChannel('Enhanced Workflow Results');
        outputChannel.show();
        outputChannel.appendLine('=== ENHANCED WORKFLOW RESULTS ===');
        outputChannel.appendLine(JSON.stringify(result, null, 2));
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        // Commands are automatically disposed by VSCode
        // No additional cleanup needed
    }
}
