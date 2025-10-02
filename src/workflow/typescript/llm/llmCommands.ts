/**
 * LLM Commands
 * 
 * This module provides VSCode commands for managing LLM configuration.
 */

import * as vscode from 'vscode';
import { LLMConfigManager } from './llmConfig';

export class LLMCommands {
    private llmConfigManager: LLMConfigManager;

    constructor(context: vscode.ExtensionContext) {
        this.llmConfigManager = LLMConfigManager.getInstance();
        this.registerCommands(context);
    }

    private registerCommands(context: vscode.ExtensionContext): void {
        // Configure API key command
        const configureCommand = vscode.commands.registerCommand(
            'mira-llm.configure',
            this.configureApiKey.bind(this)
        );

        // Show status command
        const statusCommand = vscode.commands.registerCommand(
            'mira-llm.showStatus',
            this.showStatus.bind(this)
        );

        // Open settings command
        const settingsCommand = vscode.commands.registerCommand(
            'mira-llm.openSettings',
            this.openSettings.bind(this)
        );

        // Add commands to context
        context.subscriptions.push(
            configureCommand,
            statusCommand,
            settingsCommand
        );
    }

    /**
     * Configure API key interactively
     */
    private async configureApiKey(): Promise<void> {
        try {
            // Get current config
            const currentConfig = this.llmConfigManager.getConfig();
            
            // Select provider
            const provider = await vscode.window.showQuickPick(
                [
                    { label: 'OpenAI', value: 'openai', description: 'GPT-4, GPT-3.5, etc.' },
                    { label: 'Anthropic', value: 'anthropic', description: 'Claude-3, Claude-2, etc.' },
                    { label: 'Google', value: 'google', description: 'Gemini Pro, etc.' },
                    { label: 'Azure OpenAI', value: 'azure', description: 'Azure OpenAI Service' },
                    { label: 'Local', value: 'local', description: 'Local LLM (no API key needed)' }
                ],
                {
                    placeHolder: 'Select LLM provider',
                    title: 'Configure LLM Provider'
                }
            );

            if (!provider) return;

            // Get model name
            const model = await vscode.window.showInputBox({
                prompt: 'Enter model name',
                placeHolder: this.getDefaultModel(provider.value),
                value: currentConfig?.model || this.getDefaultModel(provider.value),
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Model name is required';
                    }
                    return null;
                }
            });

            if (!model) return;

            // Get API key (skip for local)
            let apiKey = '';
            if (provider.value !== 'local') {
                const apiKeyInput = await vscode.window.showInputBox({
                    prompt: 'Enter API key',
                    placeHolder: 'sk-... or your API key',
                    password: true,
                    validateInput: (value) => {
                        if (!value || value.trim().length === 0) {
                            return 'API key is required';
                        }
                        return null;
                    }
                });

                if (!apiKeyInput) return;
                apiKey = apiKeyInput;
            }

            // Get base URL (optional)
            const baseUrl = await vscode.window.showInputBox({
                prompt: 'Enter custom base URL (optional)',
                placeHolder: 'Leave empty for default',
                value: currentConfig?.baseUrl || ''
            });

            // Get temperature
            const temperatureStr = await vscode.window.showInputBox({
                prompt: 'Enter temperature (0-2)',
                placeHolder: '0.7',
                value: currentConfig?.temperature?.toString() || '0.7',
                validateInput: (value) => {
                    const num = parseFloat(value);
                    if (isNaN(num) || num < 0 || num > 2) {
                        return 'Temperature must be a number between 0 and 2';
                    }
                    return null;
                }
            });

            if (!temperatureStr) return;

            // Get max tokens
            const maxTokensStr = await vscode.window.showInputBox({
                prompt: 'Enter max tokens',
                placeHolder: '4000',
                value: currentConfig?.maxTokens?.toString() || '4000',
                validateInput: (value) => {
                    const num = parseInt(value);
                    if (isNaN(num) || num < 1 || num > 100000) {
                        return 'Max tokens must be a number between 1 and 100000';
                    }
                    return null;
                }
            });

            if (!maxTokensStr) return;

            // Update configuration
            await this.llmConfigManager.updateConfig({
                provider: provider.value as any,
                model: model,
                apiKey: apiKey,
                baseUrl: baseUrl || undefined,
                temperature: parseFloat(temperatureStr),
                maxTokens: parseInt(maxTokensStr)
            });

            vscode.window.showInformationMessage(`✅ LLM configuration updated: ${provider.label}/${model}`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`❌ Failed to configure LLM: ${errorMessage}`);
        }
    }

    /**
     * Show LLM status
     */
    private showStatus(): void {
        this.llmConfigManager.showStatus();
    }

    /**
     * Open LLM settings
     */
    private openSettings(): void {
        this.llmConfigManager.openSettings();
    }

    /**
     * Get default model for provider
     */
    private getDefaultModel(provider: string): string {
        switch (provider) {
            case 'openai':
                return 'gpt-4';
            case 'anthropic':
                return 'claude-3-sonnet-20240229';
            case 'google':
                return 'gemini-pro';
            case 'azure':
                return 'gpt-4';
            case 'local':
                return 'local-model';
            default:
                return 'gpt-4';
        }
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.llmConfigManager.dispose();
    }
}
