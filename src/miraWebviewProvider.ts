import * as vscode from 'vscode';
import { EnhancedWorkflowExecutor } from './feedback/enhancedWorkflowExecutor';

export class MiraWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _webviewPanel?: vscode.WebviewPanel;
    private _workflowExecutor?: EnhancedWorkflowExecutor;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this.getWebviewContent();

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'runWorkflow':
                        this.runWorkflowFromWebview(message.userInput);
                        break;
                    case 'showProgress':
                        this.showProgress();
                        break;
                    case 'configureAI':
                        vscode.commands.executeCommand('mira.refreshOpenAIKey');
                        break;
                    case 'openMainPanel':
                        this.showMira();
                        break;
                }
            },
            undefined,
            []
        );

        // Auto-open main panel when sidebar is first shown
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible && !this._webviewPanel) {
                // Small delay to ensure smooth UX
                setTimeout(() => {
                    this.showMira();
                }, 100);
            }
        });
    }

    public showMira(): void {
        if (this._webviewPanel) {
            this._webviewPanel.reveal();
            return;
        }

        this._webviewPanel = vscode.window.createWebviewPanel(
            'miraMain',
            'Mira - AI Coding Assistant',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [this._extensionUri],
                retainContextWhenHidden: true
            }
        );

        this._webviewPanel.webview.html = this.getMainWebviewContent();

        this._webviewPanel.onDidDispose(() => {
            this._webviewPanel = undefined;
        });
    }

    public runWorkflow(): void {
        vscode.window.showInputBox({
            prompt: 'What would you like to build?',
            placeHolder: 'e.g., Create a Python calculator function that supports basic arithmetic',
            value: 'Create a simple todo application'
        }).then(userInput => {
            if (userInput) {
                this.runWorkflowFromInput(userInput);
            }
        });
    }

    public showProgress(): void {
        if (this._webviewPanel) {
            this._webviewPanel.reveal();
        } else {
            this.showMira();
        }
    }

    private async runWorkflowFromWebview(userInput: string): Promise<void> {
        await this.runWorkflowFromInput(userInput);
    }

    private async runWorkflowFromInput(userInput: string): Promise<void> {
        try {
            // Initialize workflow executor
            if (!this._workflowExecutor) {
                this._workflowExecutor = new EnhancedWorkflowExecutor(vscode.workspace.workspaceFolders?.[0]?.uri ? 
                    { extensionUri: vscode.workspace.workspaceFolders[0].uri } as vscode.ExtensionContext : 
                    { extensionUri: this._extensionUri } as vscode.ExtensionContext);
            }

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Mira Workflow",
                cancellable: true
            }, async (progress, _token) => {
                progress.report({ message: "Starting workflow..." });

                // Create workflow steps
                const steps = this._workflowExecutor!.createSparcWorkflowSteps(userInput);
                
                // Execute workflow
                const result = await this._workflowExecutor!.executeWorkflow('Mira SPARC Workflow', steps, userInput);

                progress.report({ message: "Workflow completed!" });

                // Show results
                vscode.window.showInformationMessage(
                    'Workflow completed successfully! Check the progress panel for details.',
                    'Show Results'
                ).then(selection => {
                    if (selection === 'Show Results') {
                        this.showProgress();
                    }
                });
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Workflow failed: ${errorMessage}`);
            console.error('Mira workflow error:', error);
        }
    }

    private getWebviewContent(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mira</title>
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
            text-align: center;
            margin-bottom: 20px;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 8px;
        }
        
        .subtitle {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .input-section {
            margin-bottom: 20px;
        }
        
        .input-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .input-field {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            box-sizing: border-box;
        }
        
        .input-field:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .button {
            width: 100%;
            padding: 10px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            margin-bottom: 8px;
        }
        
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .status {
            margin-top: 16px;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            text-align: center;
        }
        
        .status.success {
            background-color: var(--vscode-inputValidation-infoBackground);
            color: var(--vscode-inputValidation-infoForeground);
        }
        
        .status.error {
            background-color: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
        }
        
        .examples {
            margin-top: 20px;
            padding: 12px;
            background-color: var(--vscode-input-background);
            border-radius: 4px;
        }
        
        .examples-title {
            font-weight: 500;
            margin-bottom: 8px;
        }
        
        .example-item {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
            cursor: pointer;
            padding: 4px;
            border-radius: 2px;
        }
        
        .example-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🚀 Mira</div>
        <div class="subtitle">AI-Powered Coding Assistant</div>
    </div>
    
    <div class="input-section">
        <label class="input-label" for="userInput">What would you like to build?</label>
        <textarea 
            id="userInput" 
            class="input-field" 
            rows="3" 
            placeholder="e.g., Create a Python calculator function that supports basic arithmetic (+, -, *, /) with error handling for division by zero"
        ></textarea>
    </div>
    
    <button class="button" onclick="openMainPanel()">🚀 Open Mira Panel</button>
    <button class="button secondary" onclick="runWorkflow()">Run Workflow</button>
    <button class="button secondary" onclick="showProgress()">Show Progress</button>
    <button class="button secondary" onclick="configureAI()">Configure AI</button>
    
    <div id="status" class="status" style="display: none;"></div>
    
    <div class="examples">
        <div class="examples-title">💡 Example Requests:</div>
        <div class="example-item" onclick="setExample('Create a Python calculator function that supports basic arithmetic (+, -, *, /) with error handling for division by zero')">
            • Python calculator with error handling
        </div>
        <div class="example-item" onclick="setExample('Build a React todo application with add, edit, delete, and mark complete functionality')">
            • React todo application
        </div>
        <div class="example-item" onclick="setExample('Create a Node.js API server with Express that handles user authentication and CRUD operations')">
            • Node.js API with authentication
        </div>
        <div class="example-item" onclick="setExample('Design a TypeScript class for managing a shopping cart with add, remove, and calculate total methods')">
            • TypeScript shopping cart class
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function runWorkflow() {
            const userInput = document.getElementById('userInput').value.trim();
            if (!userInput) {
                showStatus('Please enter what you would like to build', 'error');
                return;
            }
            
            showStatus('Starting workflow...', 'success');
            vscode.postMessage({
                command: 'runWorkflow',
                userInput: userInput
            });
        }
        
        function showProgress() {
            vscode.postMessage({
                command: 'showProgress'
            });
        }
        
        function configureAI() {
            vscode.postMessage({
                command: 'configureAI'
            });
        }
        
        function openMainPanel() {
            vscode.postMessage({
                command: 'openMainPanel'
            });
        }
        
        function setExample(text) {
            document.getElementById('userInput').value = text;
        }
        
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = \`status \${type}\`;
            status.style.display = 'block';
            
            setTimeout(() => {
                status.style.display = 'none';
            }, 5000);
        }
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'workflowComplete':
                    showStatus('Workflow completed successfully!', 'success');
                    break;
                case 'workflowError':
                    showStatus(\`Workflow failed: \${message.error}\`, 'error');
                    break;
            }
        });
    </script>
</body>
</html>
        `;
    }

    private getMainWebviewContent(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mira - AI Coding Assistant</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 8px;
        }
        
        .subtitle {
            font-size: 16px;
            color: var(--vscode-descriptionForeground);
        }
        
        .main-content {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: var(--vscode-input-background);
            border-radius: 8px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 12px;
        }
        
        .input-group {
            margin-bottom: 16px;
        }
        
        .input-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .input-field {
            width: 100%;
            padding: 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            box-sizing: border-box;
            resize: vertical;
        }
        
        .input-field:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .button {
            padding: 12px 24px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            margin-right: 12px;
            margin-bottom: 8px;
        }
        
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 20px;
        }
        
        .feature {
            padding: 16px;
            background-color: var(--vscode-editor-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .feature-icon {
            font-size: 24px;
            margin-bottom: 8px;
        }
        
        .feature-title {
            font-weight: bold;
            margin-bottom: 4px;
        }
        
        .feature-description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .status {
            margin-top: 16px;
            padding: 12px;
            border-radius: 6px;
            font-size: 14px;
            text-align: center;
        }
        
        .status.success {
            background-color: var(--vscode-inputValidation-infoBackground);
            color: var(--vscode-inputValidation-infoForeground);
        }
        
        .status.error {
            background-color: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
        }
        
        .examples {
            margin-top: 20px;
        }
        
        .examples-title {
            font-weight: 500;
            margin-bottom: 12px;
        }
        
        .example-item {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .example-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🚀 Mira</div>
        <div class="subtitle">AI-Powered Coding Assistant with SPARC Workflow</div>
    </div>
    
    <div class="main-content">
        <div class="section">
            <div class="section-title">🎯 Start Building</div>
            <div class="input-group">
                <label class="input-label" for="userInput">What would you like to build?</label>
                <textarea 
                    id="userInput" 
                    class="input-field" 
                    rows="4" 
                    placeholder="Describe your project in detail. Be specific about programming language, functionality, and requirements."
                ></textarea>
            </div>
            <button class="button" onclick="runWorkflow()">Run SPARC Workflow</button>
            <button class="button secondary" onclick="showProgress()">Show Progress</button>
            <button class="button secondary" onclick="configureAI()">Configure AI</button>
            
            <div id="status" class="status" style="display: none;"></div>
        </div>
        
        <div class="section">
            <div class="section-title">💡 Example Projects</div>
            <div class="examples">
                <div class="example-item" onclick="setExample('Create a Python calculator function that supports basic arithmetic (+, -, *, /) with error handling for division by zero, takes string input like \"2 + 3\", and returns float results')">
                    <strong>Python Calculator:</strong> Basic arithmetic with error handling
                </div>
                <div class="example-item" onclick="setExample('Build a React todo application with TypeScript that includes add, edit, delete, and mark complete functionality, with local storage persistence and responsive design')">
                    <strong>React Todo App:</strong> Full CRUD operations with TypeScript
                </div>
                <div class="example-item" onclick="setExample('Create a Node.js API server with Express and TypeScript that handles user authentication, CRUD operations for a blog system, and includes input validation and error handling')">
                    <strong>Node.js API:</strong> Authentication and blog CRUD operations
                </div>
                <div class="example-item" onclick="setExample('Design a TypeScript class for managing a shopping cart with add item, remove item, update quantity, calculate total, and apply discount methods, including proper error handling')">
                    <strong>Shopping Cart Class:</strong> TypeScript class with business logic
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">✨ Features</div>
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-title">Issue-Driven</div>
                    <div class="feature-description">Organize development around specific issues and requirements</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">🤖</div>
                    <div class="feature-title">AI-Powered</div>
                    <div class="feature-description">Intelligent code generation and analysis</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">🔧</div>
                    <div class="feature-title">Full Build</div>
                    <div class="feature-description">Complete build and execution pipeline</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <div class="feature-title">Comprehensive</div>
                    <div class="feature-description">Detailed reporting and progress tracking</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function runWorkflow() {
            const userInput = document.getElementById('userInput').value.trim();
            if (!userInput) {
                showStatus('Please describe what you would like to build', 'error');
                return;
            }
            
            showStatus('Starting SPARC workflow...', 'success');
            vscode.postMessage({
                command: 'runWorkflow',
                userInput: userInput
            });
        }
        
        function showProgress() {
            vscode.postMessage({
                command: 'showProgress'
            });
        }
        
        function configureAI() {
            vscode.postMessage({
                command: 'configureAI'
            });
        }
        
        function openMainPanel() {
            vscode.postMessage({
                command: 'openMainPanel'
            });
        }
        
        function setExample(text) {
            document.getElementById('userInput').value = text;
        }
        
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = \`status \${type}\`;
            status.style.display = 'block';
            
            setTimeout(() => {
                status.style.display = 'none';
            }, 5000);
        }
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'workflowComplete':
                    showStatus('SPARC workflow completed successfully!', 'success');
                    break;
                case 'workflowError':
                    showStatus(\`Workflow failed: \${message.error}\`, 'error');
                    break;
            }
        });
    </script>
</body>
</html>
        `;
    }
}
