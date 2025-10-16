import * as vscode from 'vscode';

export interface ConfidenceAnalysis {
    confidence: number; // 0.0 to 1.0
    isUnclear: boolean;
    missingInformation: string[];
    suggestedQuestions: string[];
    userGuidance: string;
}

export interface WorkflowProgress {
    phase: string;
    step: string;
    progress: number; // 0 to 100
    status: 'pending' | 'running' | 'completed' | 'failed';
    message: string;
    estimatedTime?: number;
    details?: string;
}

export class UserFeedbackManager {
    private static instance: UserFeedbackManager;
    private context: vscode.ExtensionContext;
    private webviewPanel: vscode.WebviewPanel | undefined;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context: vscode.ExtensionContext): UserFeedbackManager {
        if (!UserFeedbackManager.instance) {
            UserFeedbackManager.instance = new UserFeedbackManager(context);
        }
        return UserFeedbackManager.instance;
    }

    /**
     * Analyze user input for clarity and confidence
     */
    public analyzeInputClarity(userInput: string, _context?: any): ConfidenceAnalysis {
        const lowerInput = userInput.toLowerCase().trim();
        
        // Check for vague or unclear requests
        const vaguePatterns = [
            /design.*function/i,
            /create.*something/i,
            /build.*app/i,
            /make.*calculator/i,
            /help.*with/i,
            /i need.*but/i
        ];

        const isVague = vaguePatterns.some(pattern => pattern.test(userInput));
        
        // Check for missing critical information
        const missingInfo: string[] = [];
        const suggestedQuestions: string[] = [];

        if (isVague || lowerInput.includes('design the calculator function in the issue title')) {
            missingInfo.push('Specific programming language');
            missingInfo.push('Detailed functionality requirements');
            missingInfo.push('Input/output specifications');
            missingInfo.push('Performance requirements');
            missingInfo.push('Error handling needs');

            suggestedQuestions.push('What programming language should I use? (e.g., Python, JavaScript, TypeScript)');
            suggestedQuestions.push('What specific operations should the calculator support? (e.g., basic arithmetic, scientific functions, memory operations)');
            suggestedQuestions.push('What should be the input format? (e.g., command line, GUI, web interface)');
            suggestedQuestions.push('Are there any specific requirements? (e.g., precision, speed, memory usage)');
            suggestedQuestions.push('Should it handle special cases like division by zero or invalid inputs?');
        }

        // Calculate confidence based on specificity
        let confidence = 1.0;
        if (isVague) confidence -= 0.4;
        if (missingInfo.length > 0) confidence -= (missingInfo.length * 0.1);
        if (userInput.length < 20) confidence -= 0.2;
        if (!userInput.includes('?')) confidence -= 0.1;

        confidence = Math.max(0.0, Math.min(1.0, confidence));

        const isUnclear = confidence < 0.6 || missingInfo.length > 2;

        let userGuidance = '';
        if (isUnclear) {
            userGuidance = this.generateUserGuidance(userInput, missingInfo, suggestedQuestions);
        }

        return {
            confidence,
            isUnclear,
            missingInformation: missingInfo,
            suggestedQuestions,
            userGuidance
        };
    }

    /**
     * Generate helpful guidance for users
     */
    private generateUserGuidance(userInput: string, missingInfo: string[], suggestedQuestions: string[]): string {
        const guidance = `
## 🤔 Your request needs more details!

I understand you want to **${userInput}**, but I need more specific information to provide you with the best solution.

### ❌ Missing Information:
${missingInfo.map(info => `- ${info}`).join('\n')}

### 💡 Please provide more details:

${suggestedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

### 📝 Example of a clear request:
Instead of: "design the calculator function"
Try: "Create a Python calculator function that supports basic arithmetic (+, -, *, /) with error handling for division by zero, takes string input like '2 + 3', and returns float results"

### 🎯 Pro Tips:
- Specify the programming language
- Describe the exact functionality needed
- Mention input/output formats
- Include any special requirements
- Provide examples if possible

**Please refine your request with more details, and I'll create a comprehensive solution for you!**
        `.trim();

        return guidance;
    }

    /**
     * Send confidence feedback to webview
     */
    public async sendConfidenceFeedback(analysis: ConfidenceAnalysis, userInput: string): Promise<void> {
        if (analysis.isUnclear) {
            await this.showFeedbackInWebview({
                type: 'confidence_feedback',
                data: {
                    userInput,
                    analysis,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    /**
     * Send workflow progress to webview
     */
    public async sendWorkflowProgress(progress: WorkflowProgress): Promise<void> {
        await this.showFeedbackInWebview({
            type: 'workflow_progress',
            data: {
                progress,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Send workflow step completion
     */
    public async sendStepCompletion(phase: string, step: string, result: string, duration: number): Promise<void> {
        await this.showFeedbackInWebview({
            type: 'step_completion',
            data: {
                phase,
                step,
                result,
                duration,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Send workflow error
     */
    public async sendWorkflowError(error: string, phase?: string, step?: string): Promise<void> {
        await this.showFeedbackInWebview({
            type: 'workflow_error',
            data: {
                error,
                phase,
                step,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Show feedback in webview
     */
    private async showFeedbackInWebview(message: any): Promise<void> {
        // Try to find existing webview panel
        if (!this.webviewPanel || this.webviewPanel.webview === undefined) {
            // Look for existing Mira webview panels
            const panels = vscode.window.tabGroups.all
                .flatMap(group => group.tabs)
                .filter(tab => tab.label?.includes('Mira') || tab.label?.includes('Issue'))
                .map(tab => tab.input as vscode.WebviewPanel)
                .filter(panel => panel && panel.webview);

            if (panels.length > 0) {
                this.webviewPanel = panels[0];
            } else {
                // Create a new feedback panel if none exists
                this.webviewPanel = vscode.window.createWebviewPanel(
                    'miraFeedback',
                    'Mira Feedback',
                    vscode.ViewColumn.Two,
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true
                    }
                );
            }
        }

        if (this.webviewPanel) {
            this.webviewPanel.webview.postMessage(message);
        }

        // Also show in output channel for debugging
        const outputChannel = vscode.window.createOutputChannel('Mira Feedback');
        outputChannel.appendLine(`[${new Date().toISOString()}] ${JSON.stringify(message, null, 2)}`);
    }

    /**
     * Set the webview panel reference
     */
    public setWebviewPanel(panel: vscode.WebviewPanel): void {
        this.webviewPanel = panel;
    }

    /**
     * Get SPARC workflow progress template
     */
    public getSparcProgressTemplate(): WorkflowProgress[] {
        return [
            {
                phase: 'Specification',
                step: 'Requirements Analysis',
                progress: 0,
                status: 'pending',
                message: 'Analyzing your request and gathering requirements...',
                estimatedTime: 30000
            },
            {
                phase: 'Specification',
                step: 'Requirements Documentation',
                progress: 0,
                status: 'pending',
                message: 'Creating detailed requirements specification...',
                estimatedTime: 45000
            },
            {
                phase: 'Architecture',
                step: 'System Design',
                progress: 0,
                status: 'pending',
                message: 'Designing system architecture and components...',
                estimatedTime: 60000
            },
            {
                phase: 'Architecture',
                step: 'Pseudocode Generation',
                progress: 0,
                status: 'pending',
                message: 'Creating detailed implementation pseudocode...',
                estimatedTime: 45000
            },
            {
                phase: 'Completion',
                step: 'Design Review',
                progress: 0,
                status: 'pending',
                message: 'Reviewing and finalizing design artifacts...',
                estimatedTime: 30000
            }
        ];
    }

    /**
     * Update progress for a specific step
     */
    public updateStepProgress(phase: string, step: string, progress: number, status: WorkflowProgress['status'], message?: string): WorkflowProgress {
        return {
            phase,
            step,
            progress,
            status,
            message: message || this.getDefaultMessage(phase, step, status),
            estimatedTime: this.getEstimatedTime(phase, step)
        };
    }

    private getDefaultMessage(_phase: string, step: string, status: WorkflowProgress['status']): string {
        const statusMessages = {
            pending: `Waiting to start ${step.toLowerCase()}...`,
            running: `Currently working on ${step.toLowerCase()}...`,
            completed: `${step} completed successfully!`,
            failed: `${step} failed. Please check the error details.`
        };
        return statusMessages[status];
    }

    private getEstimatedTime(_phase: string, step: string): number {
        const timeMap: Record<string, Record<string, number>> = {
            'Specification': {
                'Requirements Analysis': 30000,
                'Requirements Documentation': 45000
            },
            'Architecture': {
                'System Design': 60000,
                'Pseudocode Generation': 45000
            },
            'Completion': {
                'Design Review': 30000
            }
        };
        return timeMap[_phase]?.[step] || 30000;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
        }
    }
}
