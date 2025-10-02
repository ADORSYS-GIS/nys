/**
 * LLM Configuration System
 * 
 * This module handles LLM configuration and API key management for the Mira workflow system.
 */

import * as vscode from 'vscode';

export interface LLMConfig {
    provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'local';
    model: string;
    apiKey?: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
}

export interface LLMResponse {
    content: string;
    toolCalls?: Array<{
        toolName: string;
        parameters: Record<string, any>;
        callId: string;
    }>;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export class LLMConfigManager {
    private static instance: LLMConfigManager;
    private config: LLMConfig | null = null;
    private outputChannel: vscode.OutputChannel;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Mira LLM Config');
        this.loadConfig();
    }

    public static getInstance(): LLMConfigManager {
        if (!LLMConfigManager.instance) {
            LLMConfigManager.instance = new LLMConfigManager();
        }
        return LLMConfigManager.instance;
    }

    /**
     * Load LLM configuration from VSCode settings
     */
    private loadConfig(): void {
        const config = vscode.workspace.getConfiguration('mira');
        
        this.config = {
            provider: config.get('llm.provider', 'openai'),
            model: config.get('llm.model', 'gpt-4'),
            apiKey: config.get('llm.apiKey', ''),
            baseUrl: config.get('llm.baseUrl', ''),
            temperature: config.get('llm.temperature', 0.7),
            maxTokens: config.get('llm.maxTokens', 4000),
            timeout: config.get('llm.timeout', 30000)
        };

        this.outputChannel.appendLine(`🔧 LLM Config loaded: ${this.config.provider}/${this.config.model}`);
    }

    /**
     * Get current LLM configuration
     */
    public getConfig(): LLMConfig | null {
        return this.config;
    }

    /**
     * Update LLM configuration
     */
    public async updateConfig(newConfig: Partial<LLMConfig>): Promise<void> {
        const config = vscode.workspace.getConfiguration('mira');
        
        if (newConfig.provider !== undefined) {
            await config.update('llm.provider', newConfig.provider, vscode.ConfigurationTarget.Global);
        }
        if (newConfig.model !== undefined) {
            await config.update('llm.model', newConfig.model, vscode.ConfigurationTarget.Global);
        }
        if (newConfig.apiKey !== undefined) {
            await config.update('llm.apiKey', newConfig.apiKey, vscode.ConfigurationTarget.Global);
        }
        if (newConfig.baseUrl !== undefined) {
            await config.update('llm.baseUrl', newConfig.baseUrl, vscode.ConfigurationTarget.Global);
        }
        if (newConfig.temperature !== undefined) {
            await config.update('llm.temperature', newConfig.temperature, vscode.ConfigurationTarget.Global);
        }
        if (newConfig.maxTokens !== undefined) {
            await config.update('llm.maxTokens', newConfig.maxTokens, vscode.ConfigurationTarget.Global);
        }
        if (newConfig.timeout !== undefined) {
            await config.update('llm.timeout', newConfig.timeout, vscode.ConfigurationTarget.Global);
        }

        // Reload configuration
        this.loadConfig();
        this.outputChannel.appendLine(`✅ LLM Config updated: ${this.config?.provider}/${this.config?.model}`);
    }

    /**
     * Check if LLM is properly configured
     */
    public isConfigured(): boolean {
        if (!this.config) return false;
        
        // Check if API key is provided (except for local models)
        if (this.config.provider !== 'local' && (!this.config.apiKey || this.config.apiKey.trim() === '')) {
            return false;
        }

        return true;
    }

    /**
     * Get API key securely
     */
    public getApiKey(): string | undefined {
        return this.config?.apiKey;
    }

    /**
     * Show configuration status
     */
    public showStatus(): void {
        if (!this.config) {
            vscode.window.showErrorMessage('LLM configuration not loaded');
            return;
        }

        const status = this.isConfigured() ? '✅ Configured' : '❌ Not Configured';
        const message = `LLM Status: ${status}
Provider: ${this.config.provider}
Model: ${this.config.model}
API Key: ${this.config.apiKey ? '***' + this.config.apiKey.slice(-4) : 'Not set'}
Base URL: ${this.config.baseUrl || 'Default'}`;

        vscode.window.showInformationMessage(message);
        this.outputChannel.appendLine(`📊 LLM Status: ${message}`);
    }

    /**
     * Open configuration settings
     */
    public openSettings(): void {
        vscode.commands.executeCommand('workbench.action.openSettings', 'mira.llm');
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.outputChannel.dispose();
    }
}
