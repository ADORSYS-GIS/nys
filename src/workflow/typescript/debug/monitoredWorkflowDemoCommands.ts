import * as vscode from 'vscode';
import { MonitoredDesignWorkflow } from '../workflows/monitoredDesignWorkflow';

export class MonitoredWorkflowDemoCommands {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommands();
    }

    private registerCommands(): void {
        // Demo command to run a monitored design workflow
        const runMonitoredDesignCommand = vscode.commands.registerCommand('mimie.runMonitoredDesignDemo', async () => {
            try {
                // Get user input
                const userInput = await vscode.window.showInputBox({
                    prompt: 'What would you like to build?',
                    placeHolder: 'e.g., A todo app, A calculator, A weather dashboard',
                    value: 'A simple todo application'
                });

                if (!userInput) {
                    vscode.window.showWarningMessage('No input provided. Demo cancelled.');
                    return;
                }

                // Get current workspace folder for issue path
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                const issuePath = workspaceFolder?.uri.fsPath;

                // Show progress
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Running Monitored Design Workflow",
                    cancellable: true
                }, async (progress, _token) => {
                    progress.report({ message: "Starting workflow..." });

                    // Create and run the monitored workflow
                    const workflow = new MonitoredDesignWorkflow(this.context);
                    
                    const result = await workflow.execute({
                        userInput,
                        issuePath,
                        context: {
                            timestamp: new Date().toISOString(),
                            workspace: workspaceFolder?.name || 'Unknown'
                        }
                    });

                    progress.report({ message: "Workflow completed!" });

                    // Show results
                    const outputChannel = vscode.window.createOutputChannel('Monitored Workflow Results');
                    outputChannel.show();
                    outputChannel.appendLine('=== MONITORED DESIGN WORKFLOW RESULTS ===');
                    outputChannel.appendLine(`Input: ${userInput}`);
                    outputChannel.appendLine(`Session ID: ${workflow.getSessionId()}`);
                    outputChannel.appendLine('');
                    outputChannel.appendLine('=== REQUIREMENTS ===');
                    outputChannel.appendLine(result.requirements);
                    outputChannel.appendLine('');
                    outputChannel.appendLine('=== ARCHITECTURE ===');
                    outputChannel.appendLine(result.architecture);
                    outputChannel.appendLine('');
                    outputChannel.appendLine('=== IMPLEMENTATION ===');
                    outputChannel.appendLine(result.implementation);
                    outputChannel.appendLine('');
                    outputChannel.appendLine('=== FILES CREATED ===');
                    result.files.forEach((file: { path: string; content: string }) => {
                        outputChannel.appendLine(`📄 ${file.path}`);
                        outputChannel.appendLine(file.content);
                        outputChannel.appendLine('---');
                    });

                    vscode.window.showInformationMessage(
                        `Monitored workflow completed! Created ${result.files.length} files. Check the Workflow Monitor and Output panel for details.`,
                        'Open Workflow Monitor'
                    ).then(selection => {
                        if (selection === 'Open Workflow Monitor') {
                            vscode.commands.executeCommand('mimie.showWorkflowMonitor');
                        }
                    });
                });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`Monitored workflow failed: ${errorMessage}`);
                console.error('Monitored workflow error:', error);
            }
        });

        // Command to show workflow monitor
        const showMonitorCommand = vscode.commands.registerCommand('mimie.showWorkflowMonitorDemo', () => {
            vscode.commands.executeCommand('mimie.showWorkflowMonitor');
        });

        // Register commands
        this.context.subscriptions.push(
            runMonitoredDesignCommand,
            showMonitorCommand
        );
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        // Commands are automatically disposed by VSCode
        // No additional cleanup needed
    }
}
