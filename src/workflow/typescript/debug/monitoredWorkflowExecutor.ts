import * as vscode from 'vscode';
import { WorkflowMonitor } from './workflowMonitor';

export interface MonitoredWorkflowStep {
    name: string;
    type: 'start' | 'node' | 'tool' | 'llm' | 'end' | 'error';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    input?: any;
    output?: any;
    error?: string;
    metadata?: Record<string, any>;
}

export class MonitoredWorkflowExecutor {
    private monitor: WorkflowMonitor;
    private sessionId: string | null = null;

    constructor(context: vscode.ExtensionContext) {
        this.monitor = WorkflowMonitor.getInstance(context);
    }

    /**
     * Start a monitored workflow execution
     */
    public async startWorkflow(workflowType: string, issuePath?: string): Promise<string> {
        this.sessionId = this.monitor.startSession(workflowType, issuePath);
        return this.sessionId;
    }

    /**
     * Execute a step with monitoring
     */
    public async executeStep<T>(
        stepName: string,
        stepType: MonitoredWorkflowStep['type'],
        stepFunction: () => Promise<T>,
        input?: any,
        metadata?: Record<string, any>
    ): Promise<T> {
        if (!this.sessionId) {
            throw new Error('Workflow session not started. Call startWorkflow() first.');
        }

        const stepId = this.monitor.addStep(this.sessionId, {
            name: stepName,
            type: stepType,
            status: 'running',
            input,
            metadata
        });

        try {
            this.monitor.addLog(this.sessionId, `Starting step: ${stepName}`);
            
            const result = await stepFunction();
            
            this.monitor.updateStep(this.sessionId, stepId, {
                status: 'completed',
                output: result
            });
            
            this.monitor.addLog(this.sessionId, `Completed step: ${stepName}`);
            return result;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            this.monitor.updateStep(this.sessionId, stepId, {
                status: 'failed',
                error: errorMessage
            });
            
            this.monitor.addLog(this.sessionId, `Failed step: ${stepName} - ${errorMessage}`, 'error');
            throw error;
        }
    }

    /**
     * Execute a child step (nested within another step)
     */
    public async executeChildStep<T>(
        parentStepId: string,
        stepName: string,
        stepType: MonitoredWorkflowStep['type'],
        stepFunction: () => Promise<T>,
        input?: any,
        metadata?: Record<string, any>
    ): Promise<T> {
        if (!this.sessionId) {
            throw new Error('Workflow session not started. Call startWorkflow() first.');
        }

        const childStepId = this.monitor.addChildStep(this.sessionId, parentStepId, {
            name: stepName,
            type: stepType,
            status: 'running',
            input,
            metadata
        });

        try {
            this.monitor.addLog(this.sessionId, `Starting child step: ${stepName}`);
            
            const result = await stepFunction();
            
            this.monitor.updateStep(this.sessionId, childStepId, {
                status: 'completed',
                output: result
            });
            
            this.monitor.addLog(this.sessionId, `Completed child step: ${stepName}`);
            return result;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            this.monitor.updateStep(this.sessionId, childStepId, {
                status: 'failed',
                error: errorMessage
            });
            
            this.monitor.addLog(this.sessionId, `Failed child step: ${stepName} - ${errorMessage}`, 'error');
            throw error;
        }
    }

    /**
     * Add a log entry to the current session
     */
    public addLog(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        if (this.sessionId) {
            this.monitor.addLog(this.sessionId, message, level);
        }
    }

    /**
     * Complete the workflow session
     */
    public completeWorkflow(status: 'completed' | 'failed' = 'completed', error?: string): void {
        if (this.sessionId) {
            this.monitor.completeSession(this.sessionId, status, error);
            this.sessionId = null;
        }
    }

    /**
     * Get the current session ID
     */
    public getSessionId(): string | null {
        return this.sessionId;
    }

    /**
     * Create a step that can be monitored
     */
    public createMonitoredStep<T>(
        stepName: string,
        stepType: MonitoredWorkflowStep['type'],
        stepFunction: () => Promise<T>
    ) {
        return async (input?: any, metadata?: Record<string, any>): Promise<T> => {
            return this.executeStep(stepName, stepType, stepFunction, input, metadata);
        };
    }

    /**
     * Create a child step that can be monitored
     */
    public createMonitoredChildStep<T>(
        parentStepId: string,
        stepName: string,
        stepType: MonitoredWorkflowStep['type'],
        stepFunction: () => Promise<T>
    ) {
        return async (input?: any, metadata?: Record<string, any>): Promise<T> => {
            return this.executeChildStep(parentStepId, stepName, stepType, stepFunction, input, metadata);
        };
    }
}
