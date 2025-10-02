import * as vscode from 'vscode';
import { getMergedConfig, hasExternalOverride } from '../config/configLoader';
import { ModelProviderInterface } from './modelProviderInterface';
import { OpenAiProvider } from './openAiProvider';
// import { AnthropicProvider } from './anthropicProvider';
// import { GeminiProvider } from './geminiProvider';

/**
 * Factory for creating model providers
 */
export class ModelProviderFactory {
  /**
   * Get the configured model provider
   */
  static getProvider(): ModelProviderInterface {
    const merged = (getMergedConfig('mcpClient') || {}) as any;
    const settings = !hasExternalOverride() ? vscode.workspace.getConfiguration('mcpClient') : undefined;
    const providerName = String(merged.modelProvider ?? (settings ? settings.get<string>('modelProvider', 'openai') : 'openai'));
    const modelName = String(merged.modelName ?? (settings ? settings.get<string>('modelName', '') : ''));

    // Create provider based on configuration
    switch (providerName.toLowerCase()) {
      case 'anthropic':
      case 'claude':
        // Fallback to OpenAI if Anthropic not available
        console.warn('Anthropic provider not available, falling back to OpenAI');
        return new OpenAiProvider(modelName || 'gpt-4');

      case 'gemini':
      case 'google':
        // Fallback to OpenAI if Gemini not available
        console.warn('Gemini provider not available, falling back to OpenAI');
        return new OpenAiProvider(modelName || 'gpt-4');

      case 'openai':
      default:
        return new OpenAiProvider(modelName || 'gpt-4');
    }
  }
}
