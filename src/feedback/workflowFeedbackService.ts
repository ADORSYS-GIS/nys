import * as vscode from 'vscode';
import { UserFeedbackManager, ConfidenceAnalysis, WorkflowProgress } from '../feedback/userFeedbackManager';
import * as path from 'path';

export class WorkflowFeedbackService {
    private feedbackManager: UserFeedbackManager;
    private progressPanel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.feedbackManager = UserFeedbackManager.getInstance(context);
        this.registerCommands();
    }

    private registerCommands(): void {
        // Command to show workflow progress panel
        const showProgressCommand = vscode.commands.registerCommand('mimie.showWorkflowProgress', () => {
            this.showProgressPanel();
        });

        // Command to analyze user input confidence
        const analyzeInputCommand = vscode.commands.registerCommand('mimie.analyzeInputConfidence', (userInput: string) => {
            return this.analyzeInputConfidence(userInput);
        });

        // Command to send workflow progress
        const sendProgressCommand = vscode.commands.registerCommand('mimie.sendWorkflowProgress', (progress: WorkflowProgress) => {
            this.sendWorkflowProgress(progress);
        });

        // Command to send step completion
        const sendStepCompletionCommand = vscode.commands.registerCommand('mimie.sendStepCompletion', (phase: string, step: string, result: string, duration: number) => {
            this.sendStepCompletion(phase, step, result, duration);
        });

        // Command to send workflow error
        const sendWorkflowErrorCommand = vscode.commands.registerCommand('mimie.sendWorkflowError', (error: string, phase?: string, step?: string) => {
            this.sendWorkflowError(error, phase, step);
        });

        this.context.subscriptions.push(
            showProgressCommand,
            analyzeInputCommand,
            sendProgressCommand,
            sendStepCompletionCommand,
            sendWorkflowErrorCommand
        );
    }

    /**
     * Analyze user input for confidence and clarity
     */
    public analyzeInputConfidence(userInput: string, context?: any): ConfidenceAnalysis {
        const analysis = this.feedbackManager.analyzeInputClarity(userInput, context);
        
        // Send feedback to webview if confidence is low
        if (analysis.isUnclear) {
            this.feedbackManager.sendConfidenceFeedback(analysis, userInput);
        }

        return analysis;
    }

    /**
     * Send workflow progress update
     */
    public sendWorkflowProgress(progress: WorkflowProgress): void {
        this.feedbackManager.sendWorkflowProgress(progress);
    }

    /**
     * Send step completion notification
     */
    public sendStepCompletion(phase: string, step: string, result: string, duration: number): void {
        this.feedbackManager.sendStepCompletion(phase, step, result, duration);
    }

    /**
     * Send workflow error notification
     */
    public sendWorkflowError(error: string, phase?: string, step?: string): void {
        this.feedbackManager.sendWorkflowError(error, phase, step);
    }

    /**
     * Show the workflow progress panel
     */
    public showProgressPanel(): void {
        if (this.progressPanel) {
            this.progressPanel.reveal();
            return;
        }

        this.progressPanel = vscode.window.createWebviewPanel(
            'miraWorkflowProgress',
            'Mira Workflow Progress',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(this.context.extensionPath)]
            }
        );

        this.progressPanel.webview.html = this.getWebviewContent();
        
        // Set the webview panel reference in feedback manager
        this.feedbackManager.setWebviewPanel(this.progressPanel);

        this.progressPanel.onDidDispose(() => {
            this.progressPanel = undefined;
        });
    }

    /**
     * Get webview HTML content
     */
    private getWebviewContent(): string {
        const htmlPath = vscode.Uri.file(
            path.join(this.context.extensionPath, 'src', 'webview', 'workflowProgress.html')
        );
        
        // For now, return the HTML content directly
        // In production, you'd read from the file
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mira Workflow Progress</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 16px;
            line-height: 1.4;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: var(--vscode-badge-background);
        }
        .status-indicator.active {
            background-color: #007acc;
            animation: pulse 2s infinite;
        }
        .status-indicator.completed {
            background-color: #28a745;
        }
        .status-indicator.failed {
            background-color: #dc3545;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .confidence-feedback {
            background-color: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 20px;
            display: none;
        }
        .confidence-feedback.show {
            display: block;
        }
        .feedback-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-weight: bold;
            color: var(--vscode-inputValidation-warningForeground);
        }
        .feedback-content {
            color: var(--vscode-foreground);
        }
        .feedback-content h3 {
            margin-top: 0;
            color: var(--vscode-textLink-foreground);
        }
        .feedback-content ul {
            margin: 8px 0;
            padding-left: 20px;
        }
        .feedback-content li {
            margin-bottom: 4px;
        }
        .workflow-progress {
            margin-bottom: 20px;
        }
        .phase-section {
            margin-bottom: 24px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            overflow: hidden;
        }
        .phase-header {
            background-color: var(--vscode-panel-background);
            padding: 12px 16px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .step-item {
            padding: 12px 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .step-item:last-child {
            border-bottom: none;
        }
        .step-icon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: white;
        }
        .step-icon.pending {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }
        .step-icon.running {
            background-color: #007acc;
            animation: pulse 2s infinite;
        }
        .step-icon.completed {
            background-color: #28a745;
        }
        .step-icon.failed {
            background-color: #dc3545;
        }
        .step-content {
            flex: 1;
        }
        .step-name {
            font-weight: 500;
            margin-bottom: 4px;
        }
        .step-message {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
        }
        .step-progress {
            width: 100%;
            height: 4px;
            background-color: var(--vscode-progressBar-background);
            border-radius: 2px;
            overflow: hidden;
        }
        .step-progress-bar {
            height: 100%;
            background-color: var(--vscode-progressBar-background);
            transition: width 0.3s ease;
        }
        .step-progress-bar.running {
            background-color: #007acc;
        }
        .step-progress-bar.completed {
            background-color: #28a745;
        }
        .step-progress-bar.failed {
            background-color: #dc3545;
        }
        .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 40px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">
            <span class="status-indicator" id="statusIndicator"></span>
            🔄 Mira Workflow Progress
        </div>
    </div>

    <div class="confidence-feedback" id="confidenceFeedback">
        <div class="feedback-header">
            🤔 Request Needs More Details
        </div>
        <div class="feedback-content" id="feedbackContent">
            <!-- Confidence feedback content will be inserted here -->
        </div>
    </div>

    <div class="workflow-progress" id="workflowProgress">
        <div class="empty-state">
            No workflow in progress. Start a workflow to see real-time progress.
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentProgress = [];
        let startTime = Date.now();

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'confidence_feedback':
                    showConfidenceFeedback(message.data);
                    break;
                case 'workflow_progress':
                    updateWorkflowProgress(message.data);
                    break;
                case 'step_completion':
                    handleStepCompletion(message.data);
                    break;
                case 'workflow_error':
                    showWorkflowError(message.data);
                    break;
            }
        });

        function showConfidenceFeedback(data) {
            const feedbackDiv = document.getElementById('confidenceFeedback');
            const contentDiv = document.getElementById('feedbackContent');
            
            contentDiv.innerHTML = data.analysis.userGuidance;
            feedbackDiv.classList.add('show');
            
            // Auto-hide after 30 seconds
            setTimeout(() => {
                feedbackDiv.classList.remove('show');
            }, 30000);
        }

        function updateWorkflowProgress(data) {
            const progress = data.progress;
            const progressContainer = document.getElementById('workflowProgress');
            
            // Update status indicator
            const statusIndicator = document.getElementById('statusIndicator');
            statusIndicator.className = \`status-indicator \${progress.status}\`;
            
            // Update or create progress display
            updateProgressDisplay(progress);
        }

        function updateProgressDisplay(progress) {
            const progressContainer = document.getElementById('workflowProgress');
            
            // Find existing phase or create new one
            let phaseDiv = document.querySelector(\`[data-phase="\${progress.phase}"]\`);
            if (!phaseDiv) {
                phaseDiv = createPhaseSection(progress.phase);
                progressContainer.appendChild(phaseDiv);
            }
            
            // Find existing step or create new one
            let stepDiv = phaseDiv.querySelector(\`[data-step="\${progress.step}"]\`);
            if (!stepDiv) {
                stepDiv = createStepItem(progress);
                phaseDiv.appendChild(stepDiv);
            }
            
            // Update step
            updateStepItem(stepDiv, progress);
        }

        function createPhaseSection(phase) {
            const phaseDiv = document.createElement('div');
            phaseDiv.className = 'phase-section';
            phaseDiv.setAttribute('data-phase', phase);
            
            const header = document.createElement('div');
            header.className = 'phase-header';
            header.textContent = phase;
            
            phaseDiv.appendChild(header);
            return phaseDiv;
        }

        function createStepItem(progress) {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step-item';
            stepDiv.setAttribute('data-step', progress.step);
            
            const icon = document.createElement('div');
            icon.className = \`step-icon \${progress.status}\`;
            icon.textContent = getStepIcon(progress.status);
            
            const content = document.createElement('div');
            content.className = 'step-content';
            
            const name = document.createElement('div');
            name.className = 'step-name';
            name.textContent = progress.step;
            
            const message = document.createElement('div');
            message.className = 'step-message';
            message.textContent = progress.message;
            
            const progressBar = document.createElement('div');
            progressBar.className = 'step-progress';
            
            const progressBarFill = document.createElement('div');
            progressBarFill.className = \`step-progress-bar \${progress.status}\`;
            progressBarFill.style.width = \`\${progress.progress}%\`;
            
            progressBar.appendChild(progressBarFill);
            content.appendChild(name);
            content.appendChild(message);
            content.appendChild(progressBar);
            
            stepDiv.appendChild(icon);
            stepDiv.appendChild(content);
            
            return stepDiv;
        }

        function updateStepItem(stepDiv, progress) {
            const icon = stepDiv.querySelector('.step-icon');
            const message = stepDiv.querySelector('.step-message');
            const progressBar = stepDiv.querySelector('.step-progress-bar');
            
            icon.className = \`step-icon \${progress.status}\`;
            icon.textContent = getStepIcon(progress.status);
            message.textContent = progress.message;
            progressBar.className = \`step-progress-bar \${progress.status}\`;
            progressBar.style.width = \`\${progress.progress}%\`;
        }

        function getStepIcon(status) {
            switch (status) {
                case 'pending': return '⏳';
                case 'running': return '🔄';
                case 'completed': return '✅';
                case 'failed': return '❌';
                default: return '⏳';
            }
        }

        function handleStepCompletion(data) {
            // Update the completed step
            const stepDiv = document.querySelector(\`[data-step="\${data.step}"]\`);
            if (stepDiv) {
                const icon = stepDiv.querySelector('.step-icon');
                const message = stepDiv.querySelector('.step-message');
                
                icon.className = 'step-icon completed';
                icon.textContent = '✅';
                message.textContent = \`\${data.step} completed in \${data.duration}ms\`;
            }
        }

        function showWorkflowError(data) {
            // Update status indicator
            const statusIndicator = document.getElementById('statusIndicator');
            statusIndicator.className = 'status-indicator failed';
        }
    </script>
</body>
</html>
        `;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        if (this.progressPanel) {
            this.progressPanel.dispose();
        }
        this.feedbackManager.dispose();
    }
}
