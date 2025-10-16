import * as vscode from 'vscode';
import { WorkflowMonitor } from './workflowMonitor';

export class WorkflowMonitorCommands {
    private monitor: WorkflowMonitor;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.monitor = WorkflowMonitor.getInstance(context);
        this.registerCommands();
    }

    private registerCommands(): void {
        // Show workflow monitor panel
        const showMonitorCommand = vscode.commands.registerCommand('mimie.showWorkflowMonitor', () => {
            this.monitor.showPanel();
        });

        // Start monitoring a workflow session
        const startSessionCommand = vscode.commands.registerCommand('mimie.startWorkflowSession', (workflowType: string, issuePath?: string) => {
            return this.monitor.startSession(workflowType, issuePath);
        });

        // Add step to workflow session
        const addStepCommand = vscode.commands.registerCommand('mimie.addWorkflowStep', (sessionId: string, step: any) => {
            return this.monitor.addStep(sessionId, step);
        });

        // Update workflow step
        const updateStepCommand = vscode.commands.registerCommand('mimie.updateWorkflowStep', (sessionId: string, stepId: string, updates: any) => {
            this.monitor.updateStep(sessionId, stepId, updates);
        });

        // Complete workflow session
        const completeSessionCommand = vscode.commands.registerCommand('mimie.completeWorkflowSession', (sessionId: string, status?: 'completed' | 'failed', error?: string) => {
            this.monitor.completeSession(sessionId, status, error);
        });

        // Add log to workflow session
        const addLogCommand = vscode.commands.registerCommand('mimie.addWorkflowLog', (sessionId: string, message: string, level?: 'info' | 'warn' | 'error') => {
            this.monitor.addLog(sessionId, message, level);
        });

        // Add child step to workflow step
        const addChildStepCommand = vscode.commands.registerCommand('mimie.addWorkflowChildStep', (sessionId: string, parentStepId: string, childStep: any) => {
            return this.monitor.addChildStep(sessionId, parentStepId, childStep);
        });

        // Register all commands
        this.context.subscriptions.push(
            showMonitorCommand,
            startSessionCommand,
            addStepCommand,
            updateStepCommand,
            completeSessionCommand,
            addLogCommand,
            addChildStepCommand
        );
    }

    /**
     * Get the workflow monitor instance for direct access
     */
    public getMonitor(): WorkflowMonitor {
        return this.monitor;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        // Commands are automatically disposed by VSCode
        // No additional cleanup needed
    }
}
