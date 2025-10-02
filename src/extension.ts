import * as vscode from 'vscode';
import { IssueViewProvider } from './issueViewProvider';

export function activate(context: vscode.ExtensionContext) {
  // Register Mira sidebar view provider
  const issueProvider = new IssueViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(IssueViewProvider.viewType, issueProvider)
  );

  // Register basic Mira commands
  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-mcp-client.openIssuePanel', () => {
      const panel = vscode.window.createWebviewPanel(
        'mcpIssuePanel',
        'Mira Issue Manager',
        vscode.ViewColumn.Two,
        { enableScripts: true, retainContextWhenHidden: true }
      );
      panel.webview.html = issueProvider.getHtmlForWebview(panel.webview);
    })
  );

  // Register basic issue management commands
  let createIssueCommand = vscode.commands.registerCommand('vscode-mcp-client.createIssue', async () => {
    const title = await vscode.window.showInputBox({
      prompt: 'Issue Title',
      placeHolder: 'Enter a descriptive title for your issue'
    });
    if (!title) return;

    const description = await vscode.window.showInputBox({
      prompt: 'Issue Description',
      placeHolder: 'Describe the issue, requirements, and design considerations'
    }) || '';

    await issueProvider.createIssue(title, description);
  });

  let switchToDesignModeCommand = vscode.commands.registerCommand('vscode-mcp-client.switchToDesignMode', async () => {
    await issueProvider.switchMode('design');
    vscode.window.showInformationMessage('Switched to Design mode');
  });

  let switchToBuildModeCommand = vscode.commands.registerCommand('vscode-mcp-client.switchToBuildMode', async () => {
    await issueProvider.switchMode('build');
    vscode.window.showInformationMessage('Switched to Build mode');
  });

  let switchToDebugModeCommand = vscode.commands.registerCommand('vscode-mcp-client.switchToDebugMode', async () => {
    await issueProvider.switchMode('debug');
    vscode.window.showInformationMessage('Switched to Debug mode');
  });

  let runBuildCommand = vscode.commands.registerCommand('vscode-mcp-client.runBuild', async () => {
    await issueProvider.runBuild('current');
    vscode.window.showInformationMessage('Build command executed');
  });

  let runTestsCommand = vscode.commands.registerCommand('vscode-mcp-client.runTests', async () => {
    await issueProvider.runTest('current');
    vscode.window.showInformationMessage('Test command executed');
  });

  let collectLogsCommand = vscode.commands.registerCommand('vscode-mcp-client.collectLogs', async () => {
    await issueProvider.collectLogs('current');
    vscode.window.showInformationMessage('Log collection command executed');
  });

  // Add all commands to subscriptions
  context.subscriptions.push(
    createIssueCommand,
    switchToDesignModeCommand,
    switchToBuildModeCommand,
    switchToDebugModeCommand,
    runBuildCommand,
    runTestsCommand,
    collectLogsCommand
  );

  console.log('Mira extension activated successfully!');
}

export function deactivate() {
  console.log('Mira extension deactivated');
}