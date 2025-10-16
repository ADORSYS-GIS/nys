import * as vscode from 'vscode';
import { WorkflowFeedbackService } from '../feedback/workflowFeedbackService';
import { ConfidenceAnalysis, WorkflowProgress } from '../feedback/userFeedbackManager';

export interface EnhancedWorkflowStep {
    name: string;
    phase: string;
    estimatedDuration: number;
    execute: () => Promise<any>;
}

export class EnhancedWorkflowExecutor {
    private feedbackService: WorkflowFeedbackService;
    private context: vscode.ExtensionContext;
    private currentProgress: Map<string, WorkflowProgress> = new Map();

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.feedbackService = new WorkflowFeedbackService(context);
    }

    /**
     * Analyze user input before starting workflow
     */
    public async analyzeUserInput(userInput: string, _context?: any): Promise<ConfidenceAnalysis> {
        const analysis = this.feedbackService.analyzeInputConfidence(userInput, _context);
        
        // If input is unclear, show feedback and return early
        if (analysis.isUnclear) {
            await this.showConfidenceFeedback(analysis, userInput);
            return analysis;
        }

        return analysis;
    }

    /**
     * Execute workflow with real-time progress feedback
     */
    public async executeWorkflow(
        workflowName: string,
        steps: EnhancedWorkflowStep[],
        userInput: string
    ): Promise<any> {
        try {
            // Analyze input confidence first
            const _analysis = await this.analyzeUserInput(userInput);
            if (_analysis.isUnclear) {
                throw new Error('User input is unclear. Please provide more specific details.');
            }

            // Show progress panel
            this.feedbackService.showProgressPanel();

            // Initialize progress tracking
            const startTime = Date.now();
            let currentPhase = '';
            let stepIndex = 0;

            // Execute each step with progress updates
            for (const step of steps) {
                stepIndex++;
                
                // Update phase if changed
                if (step.phase !== currentPhase) {
                    currentPhase = step.phase;
                    await this.updatePhaseProgress(currentPhase, stepIndex, steps.length);
                }

                // Execute step with progress tracking
                const result = await this.executeStepWithProgress(step, stepIndex, steps.length);
                
                // Send step completion
                const duration = Date.now() - startTime;
                this.feedbackService.sendStepCompletion(
                    step.phase,
                    step.name,
                    JSON.stringify(result).substring(0, 100) + '...',
                    duration
                );
            }

            // Complete workflow
            await this.completeWorkflow(workflowName, Date.now() - startTime);
            
            return { success: true, message: 'Workflow completed successfully' };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.feedbackService.sendWorkflowError(errorMessage);
            throw error;
        }
    }

    /**
     * Execute a single step with progress updates
     */
    private async executeStepWithProgress(
        step: EnhancedWorkflowStep,
        stepIndex: number,
        totalSteps: number
    ): Promise<any> {
        const stepId = `${step.phase}-${step.name}`;
        
        // Start step
        await this.updateStepProgress(step, 'running', 0, stepIndex, totalSteps);
        
        try {
            // Simulate progress updates during execution
            const progressInterval = setInterval(async () => {
                const progress = Math.min(90, Math.random() * 100);
                await this.updateStepProgress(step, 'running', progress, stepIndex, totalSteps);
            }, 1000);

            // Execute the actual step
            const result = await step.execute();
            
            // Clear progress interval
            clearInterval(progressInterval);
            
            // Complete step
            await this.updateStepProgress(step, 'completed', 100, stepIndex, totalSteps);
            
            return result;

        } catch (error) {
            await this.updateStepProgress(step, 'failed', 0, stepIndex, totalSteps);
            throw error;
        }
    }

    /**
     * Update step progress
     */
    private async updateStepProgress(
        step: EnhancedWorkflowStep,
        status: WorkflowProgress['status'],
        progress: number,
        stepIndex: number,
        totalSteps: number
    ): Promise<void> {
        const progressData: WorkflowProgress = {
            phase: step.phase,
            step: step.name,
            progress,
            status,
            message: this.getStepMessage(step, status, stepIndex, totalSteps),
            estimatedTime: step.estimatedDuration
        };

        this.currentProgress.set(`${step.phase}-${step.name}`, progressData);
        this.feedbackService.sendWorkflowProgress(progressData);
    }

    /**
     * Update phase progress
     */
    private async updatePhaseProgress(phase: string, stepIndex: number, totalSteps: number): Promise<void> {
        const progressData: WorkflowProgress = {
            phase,
            step: `Starting ${phase} phase`,
            progress: 0,
            status: 'running',
            message: `Beginning ${phase.toLowerCase()} phase (Step ${stepIndex}/${totalSteps})`,
            estimatedTime: 30000
        };

        this.feedbackService.sendWorkflowProgress(progressData);
    }

    /**
     * Complete workflow
     */
    private async completeWorkflow(workflowName: string, duration: number): Promise<void> {
        const progressData: WorkflowProgress = {
            phase: 'Completion',
            step: 'Workflow Complete',
            progress: 100,
            status: 'completed',
            message: `${workflowName} completed successfully in ${Math.round(duration / 1000)}s`,
            estimatedTime: 0
        };

        this.feedbackService.sendWorkflowProgress(progressData);
    }

    /**
     * Show confidence feedback to user
     */
    private async showConfidenceFeedback(_analysis: ConfidenceAnalysis, userInput: string): Promise<void> {
        const message = `Your request "${userInput}" needs more details. Please check the feedback panel for specific guidance.`;
        
        await vscode.window.showWarningMessage(
            message,
            'Show Feedback Panel',
            'Dismiss'
        ).then(selection => {
            if (selection === 'Show Feedback Panel') {
                this.feedbackService.showProgressPanel();
            }
        });
    }

    /**
     * Get step message based on status
     */
    private getStepMessage(
        step: EnhancedWorkflowStep,
        status: WorkflowProgress['status'],
        stepIndex: number,
        totalSteps: number
    ): string {
        const baseMessage = `${step.name} (${stepIndex}/${totalSteps})`;
        
        switch (status) {
            case 'pending':
                return `Waiting to start ${baseMessage}`;
            case 'running':
                return `Currently executing ${baseMessage}`;
            case 'completed':
                return `${baseMessage} completed successfully`;
            case 'failed':
                return `${baseMessage} failed`;
            default:
                return baseMessage;
        }
    }

    /**
     * Create SPARC workflow steps
     */
    public createSparcWorkflowSteps(_userInput: string): EnhancedWorkflowStep[] {
        return [
            {
                name: 'Requirements Analysis',
                phase: 'Specification',
                estimatedDuration: 30000,
                execute: async () => {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return { requirements: 'Analyzed user requirements' };
                }
            },
            {
                name: 'Requirements Documentation',
                phase: 'Specification',
                estimatedDuration: 45000,
                execute: async () => {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return { documentation: 'Created requirements document' };
                }
            },
            {
                name: 'System Design',
                phase: 'Architecture',
                estimatedDuration: 60000,
                execute: async () => {
                    await new Promise(resolve => setTimeout(resolve, 4000));
                    return { architecture: 'Designed system architecture' };
                }
            },
            {
                name: 'Pseudocode Generation',
                phase: 'Architecture',
                estimatedDuration: 45000,
                execute: async () => {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return { pseudocode: 'Generated implementation pseudocode' };
                }
            },
            {
                name: 'Design Review',
                phase: 'Completion',
                estimatedDuration: 30000,
                execute: async () => {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return { review: 'Completed design review' };
                }
            }
        ];
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.feedbackService.dispose();
    }
}
