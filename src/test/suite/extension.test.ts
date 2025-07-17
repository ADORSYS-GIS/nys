import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Starting tests');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('vscode-mcp-client'));
  });

  test('Should register commands', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('vscode-mcp-client.connect'));
    assert.ok(commands.includes('vscode-mcp-client.executePrompt'));
  });
});
