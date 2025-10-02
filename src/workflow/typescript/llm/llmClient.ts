/**
 * LLM Client
 * 
 * This module provides a client for calling various LLM APIs.
 */

import { LLMConfig, LLMResponse } from './llmConfig';
import { WorkflowMessage } from '../types';

export class LLMClient {
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        this.config = config;
    }

    /**
     * Call the LLM with messages
     */
    async callLLM(messages: WorkflowMessage[]): Promise<LLMResponse> {
        switch (this.config.provider) {
            case 'openai':
                return this.callOpenAI(messages);
            case 'anthropic':
                return this.callAnthropic(messages);
            case 'google':
                return this.callGoogle(messages);
            case 'azure':
                return this.callAzure(messages);
            case 'local':
                return this.callLocal(messages);
            default:
                throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
        }
    }

    /**
     * Call OpenAI API
     */
    private async callOpenAI(messages: WorkflowMessage[]): Promise<LLMResponse> {
        const url = this.config.baseUrl || 'https://api.openai.com/v1/chat/completions';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: this.formatMessagesForOpenAI(messages),
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            content: data.choices[0].message.content,
            toolCalls: this.extractToolCalls(data.choices[0].message),
            usage: data.usage
        };
    }

    /**
     * Call Anthropic API
     */
    private async callAnthropic(messages: WorkflowMessage[]): Promise<LLMResponse> {
        const url = this.config.baseUrl || 'https://api.anthropic.com/v1/messages';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey!,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: this.formatMessagesForAnthropic(messages),
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            content: data.content[0].text,
            usage: {
                promptTokens: data.usage.input_tokens,
                completionTokens: data.usage.output_tokens,
                totalTokens: data.usage.input_tokens + data.usage.output_tokens
            }
        };
    }

    /**
     * Call Google API
     */
    private async callGoogle(messages: WorkflowMessage[]): Promise<LLMResponse> {
        const url = this.config.baseUrl || `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent`;
        
        const response = await fetch(`${url}?key=${this.config.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: this.formatMessagesForGoogle(messages),
                generationConfig: {
                    temperature: this.config.temperature,
                    maxOutputTokens: this.config.maxTokens
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Google API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            content: data.candidates[0].content.parts[0].text,
            usage: {
                promptTokens: data.usageMetadata?.promptTokenCount || 0,
                completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata?.totalTokenCount || 0
            }
        };
    }

    /**
     * Call Azure OpenAI API
     */
    private async callAzure(messages: WorkflowMessage[]): Promise<LLMResponse> {
        const url = this.config.baseUrl || 'https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-12-01-preview';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.config.apiKey!
            },
            body: JSON.stringify({
                messages: this.formatMessagesForOpenAI(messages),
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens
            })
        });

        if (!response.ok) {
            throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            content: data.choices[0].message.content,
            toolCalls: this.extractToolCalls(data.choices[0].message),
            usage: data.usage
        };
    }

    /**
     * Call local LLM (placeholder for local models)
     */
    private async callLocal(messages: WorkflowMessage[]): Promise<LLMResponse> {
        // This is a placeholder for local LLM integration
        // You would implement this based on your local LLM setup
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
            content: `Local LLM response to: ${messages[messages.length - 1]?.content || 'No message'}`,
            usage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0
            }
        };
    }

    /**
     * Format messages for OpenAI API
     */
    private formatMessagesForOpenAI(messages: WorkflowMessage[]): any[] {
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }

    /**
     * Format messages for Anthropic API
     */
    private formatMessagesForAnthropic(messages: WorkflowMessage[]): any[] {
        return messages
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));
    }

    /**
     * Format messages for Google API
     */
    private formatMessagesForGoogle(messages: WorkflowMessage[]): any[] {
        const parts = messages.map(msg => ({
            text: msg.content
        }));

        return [{
            parts: parts
        }];
    }

    /**
     * Extract tool calls from OpenAI response
     */
    private extractToolCalls(message: any): Array<{toolName: string; parameters: Record<string, any>; callId: string}> | undefined {
        if (!message.tool_calls) return undefined;

        return message.tool_calls.map((call: any) => ({
            toolName: call.function.name,
            parameters: JSON.parse(call.function.arguments),
            callId: call.id
        }));
    }
}
