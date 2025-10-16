import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface WorkflowExecutionStep {
    id: string;
    name: string;
    type: 'start' | 'node' | 'tool' | 'llm' | 'end' | 'error';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: number;
    endTime?: number;
    duration?: number;
    input?: any;
    output?: any;
    error?: string;
    children?: WorkflowExecutionStep[];
    expanded?: boolean;
    metadata?: Record<string, any>;
}

export interface WorkflowSession {
    id: string;
    issueTitle: string;
    issuePath: string;
    workflowType: string;
    status: 'running' | 'completed' | 'failed' | 'paused';
    startTime: number;
    endTime?: number;
    steps: WorkflowExecutionStep[];
    currentStep?: string;
    logs: string[];
    expanded?: boolean;
}

export class WorkflowMonitor {
    private static instance: WorkflowMonitor;
    private sessions: Map<string, WorkflowSession> = new Map();
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private updateInterval: NodeJS.Timeout | undefined;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.startAutoUpdate();
    }

    public static getInstance(context: vscode.ExtensionContext): WorkflowMonitor {
        if (!WorkflowMonitor.instance) {
            WorkflowMonitor.instance = new WorkflowMonitor(context);
        }
        return WorkflowMonitor.instance;
    }

    /**
     * Start a new workflow session
     */
    public startSession(workflowType: string, issuePath?: string): string {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const issueTitle = this.extractIssueTitle(issuePath);
        
        const session: WorkflowSession = {
            id: sessionId,
            issueTitle,
            issuePath: issuePath || '',
            workflowType,
            status: 'running',
            startTime: Date.now(),
            steps: [],
            logs: [`🚀 Started ${workflowType} workflow at ${new Date().toISOString()}`]
        };

        this.sessions.set(sessionId, session);
        this.updatePanel();
        
        console.log(`📊 Started workflow session: ${sessionId} for issue: ${issueTitle}`);
        return sessionId;
    }

    /**
     * Add a step to the workflow execution
     */
    public addStep(sessionId: string, step: Omit<WorkflowExecutionStep, 'id'>): string {
        const session = this.sessions.get(sessionId);
        if (!session) {
            console.warn(`⚠️ Session ${sessionId} not found`);
            return '';
        }

        const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullStep: WorkflowExecutionStep = {
            ...step,
            id: stepId,
            startTime: step.startTime || Date.now(),
            expanded: false
        };

        session.steps.push(fullStep);
        session.currentStep = stepId;
        session.logs.push(`📝 Added step: ${fullStep.name} (${fullStep.type})`);
        
        this.updatePanel();
        return stepId;
    }

    /**
     * Update step status and output
     */
    public updateStep(sessionId: string, stepId: string, updates: Partial<WorkflowExecutionStep>): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const step = session.steps.find(s => s.id === stepId);
        if (!step) return;

        Object.assign(step, updates);
        
        if (updates.status === 'completed' || updates.status === 'failed') {
            step.endTime = Date.now();
            step.duration = step.endTime - (step.startTime || step.endTime);
            session.logs.push(`✅ Step ${step.name} ${updates.status} in ${step.duration}ms`);
        }

        this.updatePanel();
    }

    /**
     * Add a child step to an existing step
     */
    public addChildStep(sessionId: string, parentStepId: string, childStep: Omit<WorkflowExecutionStep, 'id'>): string {
        const session = this.sessions.get(sessionId);
        if (!session) return '';

        const parentStep = session.steps.find(s => s.id === parentStepId);
        if (!parentStep) return '';

        const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullStep: WorkflowExecutionStep = {
            ...childStep,
            id: stepId,
            startTime: childStep.startTime || Date.now(),
            expanded: false
        };

        if (!parentStep.children) {
            parentStep.children = [];
        }
        parentStep.children.push(fullStep);
        
        session.logs.push(`🔗 Added child step: ${fullStep.name} to ${parentStep.name}`);
        this.updatePanel();
        return stepId;
    }

    /**
     * Complete a workflow session
     */
    public completeSession(sessionId: string, status: 'completed' | 'failed' = 'completed', error?: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.status = status;
        session.endTime = Date.now();
        session.currentStep = undefined;
        
        if (error) {
            session.logs.push(`❌ Workflow failed: ${error}`);
        } else {
            session.logs.push(`🎉 Workflow completed successfully`);
        }

        this.updatePanel();
    }

    /**
     * Add log entry to session
     */
    public addLog(sessionId: string, message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        session.logs.push(logEntry);
        
        this.updatePanel();
    }

    /**
     * Show the monitoring panel
     */
    public showPanel(): void {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'workflowMonitor',
            'Workflow Monitor',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'webview'))]
            }
        );

        this.panel.webview.html = this.getWebviewContent();
        
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'toggleSession':
                        this.toggleSessionExpansion(message.sessionId);
                        break;
                    case 'toggleStep':
                        this.toggleStepExpansion(message.sessionId, message.stepId);
                        break;
                    case 'clearSession':
                        this.clearSession(message.sessionId);
                        break;
                    case 'exportSession':
                        this.exportSession(message.sessionId);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        this.updatePanel();
    }

    /**
     * Extract issue title from .nys folder
     */
    private extractIssueTitle(issuePath?: string): string {
        if (!issuePath) return 'Untitled Issue';

        try {
            // Look for .nys folder in the issue path
            const nysPath = path.join(issuePath, '.nys');
            if (fs.existsSync(nysPath)) {
                // Look for markdown files that might contain the issue title
                const files = fs.readdirSync(nysPath);
                const mdFiles = files.filter(f => f.endsWith('.md'));
                
                for (const file of mdFiles) {
                    const content = fs.readFileSync(path.join(nysPath, file), 'utf8');
                    const titleMatch = content.match(/^#\s+(.+)$/m);
                    if (titleMatch) {
                        return titleMatch[1].trim();
                    }
                }
            }

            // Fallback to folder name
            return path.basename(issuePath);
        } catch (error) {
            console.warn('Failed to extract issue title:', error);
            return path.basename(issuePath);
        }
    }

    /**
     * Toggle session expansion
     */
    private toggleSessionExpansion(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.expanded = !session.expanded;
            this.updatePanel();
        }
    }

    /**
     * Toggle step expansion
     */
    private toggleStepExpansion(sessionId: string, stepId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const step = this.findStepRecursive(session.steps, stepId);
        if (step) {
            step.expanded = !step.expanded;
            this.updatePanel();
        }
    }

    /**
     * Find step recursively in the step tree
     */
    private findStepRecursive(steps: WorkflowExecutionStep[], stepId: string): WorkflowExecutionStep | undefined {
        for (const step of steps) {
            if (step.id === stepId) return step;
            if (step.children) {
                const found = this.findStepRecursive(step.children, stepId);
                if (found) return found;
            }
        }
        return undefined;
    }

    /**
     * Clear a session
     */
    private clearSession(sessionId: string): void {
        this.sessions.delete(sessionId);
        this.updatePanel();
    }

    /**
     * Export session data
     */
    private exportSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const exportData = {
            session,
            exportTime: new Date().toISOString(),
            version: '1.0'
        };

        const fileName = `workflow-session-${sessionId}-${Date.now()}.json`;
        const filePath = path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
        vscode.window.showInformationMessage(`Session exported to ${fileName}`);
    }

    /**
     * Start auto-update interval
     */
    private startAutoUpdate(): void {
        this.updateInterval = setInterval(() => {
            if (this.panel) {
                this.updatePanel();
            }
        }, 1000); // Update every second
    }

    /**
     * Update the webview panel
     */
    private updatePanel(): void {
        if (!this.panel) return;

        this.panel.webview.postMessage({
            command: 'updateData',
            sessions: Array.from(this.sessions.values())
        });
    }

    /**
     * Get webview HTML content
     */
    private getWebviewContent(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workflow Monitor</title>
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
        }
        
        .controls {
            display: flex;
            gap: 10px;
        }
        
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .session {
            margin-bottom: 16px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            overflow: hidden;
        }
        
        .session-header {
            background-color: var(--vscode-panel-background);
            padding: 12px 16px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .session-header:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .session-title {
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .session-status {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
        }
        
        .status-running { background-color: #007acc; color: white; }
        .status-completed { background-color: #28a745; color: white; }
        .status-failed { background-color: #dc3545; color: white; }
        .status-paused { background-color: #ffc107; color: black; }
        
        .session-content {
            padding: 16px;
            background-color: var(--vscode-editor-background);
        }
        
        .step {
            margin-bottom: 8px;
            border-left: 3px solid var(--vscode-panel-border);
            padding-left: 12px;
        }
        
        .step-header {
            cursor: pointer;
            padding: 6px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .step-header:hover {
            background-color: var(--vscode-list-hoverBackground);
            margin: 0 -12px;
            padding: 6px 12px;
        }
        
        .step-name {
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .step-type {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 10px;
        }
        
        .step-duration {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
        
        .step-content {
            margin-top: 8px;
            padding: 8px;
            background-color: var(--vscode-input-background);
            border-radius: 4px;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
        }
        
        .step-children {
            margin-left: 16px;
            margin-top: 8px;
        }
        
        .logs {
            margin-top: 16px;
            max-height: 200px;
            overflow-y: auto;
            background-color: var(--vscode-terminal-background);
            border-radius: 4px;
            padding: 8px;
        }
        
        .log-entry {
            font-family: var(--vscode-editor-font-family);
            font-size: 11px;
            margin-bottom: 2px;
            word-break: break-all;
        }
        
        .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 40px;
        }
        
        .expand-icon {
            transition: transform 0.2s;
        }
        
        .expanded .expand-icon {
            transform: rotate(90deg);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">🔍 Workflow Monitor</div>
        <div class="controls">
            <button onclick="clearAllSessions()">Clear All</button>
            <button onclick="exportAllSessions()">Export All</button>
        </div>
    </div>
    
    <div id="sessions-container">
        <div class="empty-state">
            No workflow sessions running. Start a workflow to see monitoring data.
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateData':
                    updateSessions(message.sessions);
                    break;
            }
        });
        
        function updateSessions(sessions) {
            const container = document.getElementById('sessions-container');
            
            if (sessions.length === 0) {
                container.innerHTML = '<div class="empty-state">No workflow sessions running. Start a workflow to see monitoring data.</div>';
                return;
            }
            
            container.innerHTML = sessions.map(session => renderSession(session)).join('');
        }
        
        function renderSession(session) {
            const statusClass = \`status-\${session.status}\`;
            const expandedClass = session.expanded ? 'expanded' : '';
            
            return \`
                <div class="session">
                    <div class="session-header \${expandedClass}" onclick="toggleSession('\${session.id}')">
                        <div class="session-title">
                            <span class="expand-icon">▶</span>
                            <span>\${session.issueTitle}</span>
                            <span class="step-type">\${session.workflowType}</span>
                        </div>
                        <div class="session-status \${statusClass}">\${session.status}</div>
                    </div>
                    \${session.expanded ? \`
                        <div class="session-content">
                            <div><strong>Session ID:</strong> \${session.id}</div>
                            <div><strong>Issue Path:</strong> \${session.issuePath}</div>
                            <div><strong>Started:</strong> \${new Date(session.startTime).toLocaleString()}</div>
                            \${session.endTime ? \`<div><strong>Ended:</strong> \${new Date(session.endTime).toLocaleString()}</div>\` : ''}
                            \${session.currentStep ? \`<div><strong>Current Step:</strong> \${session.currentStep}</div>\` : ''}
                            
                            <div style="margin-top: 16px;">
                                <strong>Execution Steps:</strong>
                                \${session.steps.map(step => renderStep(step, session.id)).join('')}
                            </div>
                            
                            <div class="logs">
                                <strong>Logs:</strong>
                                \${session.logs.map(log => \`<div class="log-entry">\${log}</div>\`).join('')}
                            </div>
                            
                            <div style="margin-top: 16px; display: flex; gap: 8px;">
                                <button onclick="clearSession('\${session.id}')">Clear Session</button>
                                <button onclick="exportSession('\${session.id}')">Export Session</button>
                            </div>
                        </div>
                    \` : ''}
                </div>
            \`;
        }
        
        function renderStep(step, sessionId) {
            const expandedClass = step.expanded ? 'expanded' : '';
            const hasChildren = step.children && step.children.length > 0;
            
            return \`
                <div class="step">
                    <div class="step-header \${expandedClass}" onclick="toggleStep('\${sessionId}', '\${step.id}')">
                        <div class="step-name">
                            \${hasChildren ? '<span class="expand-icon">▶</span>' : ''}
                            <span>\${step.name}</span>
                            <span class="step-type">\${step.type}</span>
                            <span class="step-duration">\${step.duration ? \`(\${step.duration}ms)\` : ''}</span>
                        </div>
                        <div class="session-status status-\${step.status}">\${step.status}</div>
                    </div>
                    \${step.expanded ? \`
                        <div class="step-content">
                            \${step.input ? \`<div><strong>Input:</strong> <pre>\${JSON.stringify(step.input, null, 2)}</pre></div>\` : ''}
                            \${step.output ? \`<div><strong>Output:</strong> <pre>\${JSON.stringify(step.output, null, 2)}</pre></div>\` : ''}
                            \${step.error ? \`<div><strong>Error:</strong> <span style="color: var(--vscode-errorForeground)">\${step.error}</span></div>\` : ''}
                            \${step.metadata ? \`<div><strong>Metadata:</strong> <pre>\${JSON.stringify(step.metadata, null, 2)}</pre></div>\` : ''}
                        </div>
                        \${hasChildren ? \`
                            <div class="step-children">
                                \${step.children.map(child => renderStep(child, sessionId)).join('')}
                            </div>
                        \` : ''}
                    \` : ''}
                </div>
            \`;
        }
        
        function toggleSession(sessionId) {
            vscode.postMessage({
                command: 'toggleSession',
                sessionId: sessionId
            });
        }
        
        function toggleStep(sessionId, stepId) {
            vscode.postMessage({
                command: 'toggleStep',
                sessionId: sessionId,
                stepId: stepId
            });
        }
        
        function clearSession(sessionId) {
            vscode.postMessage({
                command: 'clearSession',
                sessionId: sessionId
            });
        }
        
        function exportSession(sessionId) {
            vscode.postMessage({
                command: 'exportSession',
                sessionId: sessionId
            });
        }
        
        function clearAllSessions() {
            // Implementation for clearing all sessions
            console.log('Clear all sessions requested');
        }
        
        function exportAllSessions() {
            // Implementation for exporting all sessions
            console.log('Export all sessions requested');
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
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.panel) {
            this.panel.dispose();
        }
    }
}
