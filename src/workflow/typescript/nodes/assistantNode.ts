/**
 * TypeScript Workflow System - Assistant Node
 * 
 * Central AI coordinator node.
 */

import { BaseNode } from './baseNode';
import { WorkflowState, WorkflowStatus, NodeType, WorkflowConfig, WorkflowMessage } from '../types';
import { LLMConfigManager } from '../llm/llmConfig';
import { LLMClient } from '../llm/llmClient';

export class AssistantNode extends BaseNode {
    constructor(config: WorkflowConfig, nodeId: string = 'assistant') {
        super(nodeId, NodeType.ASSISTANT, 'AI assistant coordinator', config);
    }

    async execute(state: WorkflowState): Promise<WorkflowState> {
        const startTime = Date.now();

        try {
            // Update state
            state.currentNode = this.nodeId;
            state.executionPath.push(this.nodeId);
            state.updatedAt = new Date();

            // Build conversation context
            const messages = this.buildMessageContext();

            // Call the LLM to get the assistant's response
            const response = await this.processWithLLM(messages, state);

            // Update state with assistant response
            state.messages.push({
                role: 'assistant',
                content: response.content,
                toolCalls: response.toolCalls || []
            });

            // Determine if we need to call tools
            if (response.toolCalls && response.toolCalls.length > 0) {
                state.context.pendingToolCalls = response.toolCalls;
                state.context.nextAction = 'execute_tools';
            } else {
                state.context.nextAction = 'complete';
            }

            const result = this.createNodeResult(
                true,
                {
                    response: response,
                    nextAction: state.context.nextAction
                },
                undefined,
                Date.now() - startTime
            );

            state.intermediateResults[this.nodeId] = result;

            return state;

        } catch (error) {
            state.error = error instanceof Error ? error.message : String(error);
            state.status = WorkflowStatus.FAILED;

            const result = this.createNodeResult(
                false,
                {},
                state.error,
                Date.now() - startTime
            );

            state.intermediateResults[this.nodeId] = result;
            return state;
        }
    }

    private buildMessageContext(): WorkflowMessage[] {
        const messages: WorkflowMessage[] = [];

        // Add system message
        messages.push({
            role: 'system',
            content: this.getSystemPrompt()
        });

        // Add conversation history
        // Note: In a real implementation, this would add the conversation history
        // For now, we'll just add the system message

        return messages;
    }

    private getSystemPrompt(): string {
        return `You are Mira, an AI assistant that helps users accomplish tasks through a workflow system.

You have access to various tools and MCP (Model Context Protocol) servers to help you:
- Execute code and commands
- Search and retrieve information
- Manage files and data
- Integrate with external services

When a user asks you to do something:
1. Understand the request clearly
2. Break it down into steps if needed
3. Use the appropriate tools to accomplish the task
4. Provide clear feedback on progress and results

Always be helpful, accurate, and transparent about what you're doing.`;
    }

    private async processWithLLM(
        messages: WorkflowMessage[],
        state: WorkflowState
    ): Promise<{ content: string; toolCalls?: any[] }> {
        try {
            // Get LLM configuration
            const llmConfigManager = LLMConfigManager.getInstance();
            const llmConfig = llmConfigManager.getConfig();

            if (!llmConfig || !llmConfigManager.isConfigured()) {
                // Fallback to simulated response if LLM is not configured
                return this.getFallbackResponse(state);
            }

            // Create LLM client and call the API
            const llmClient = new LLMClient(llmConfig);
            const response = await llmClient.callLLM(messages);

            return {
                content: response.content,
                toolCalls: response.toolCalls
            };

        } catch (error) {
            // If LLM call fails, fall back to simulated response
            console.error('LLM call failed:', error);
            return this.getFallbackResponse(state);
        }
    }

    /**
     * Fallback response when LLM is not configured or fails
     */
    private getFallbackResponse(state: WorkflowState): { content: string; toolCalls?: any[] } {
        // For demo purposes, return a simple response
        let lastUserMessage: string | undefined;
        for (let i = state.messages.length - 1; i >= 0; i--) {
            if (state.messages[i].role === 'user') {
                lastUserMessage = state.messages[i].content;
                break;
            }
        }

        if (lastUserMessage && lastUserMessage.toLowerCase().includes('calculate')) {
            return {
                content: "I'll help you with that calculation. Let me use the calculator tool.",
                toolCalls: [{
                    toolName: 'calculator',
                    parameters: { expression: '2 + 2' },
                    callId: `calc_${Date.now()}`
                }]
            };
        } else if (lastUserMessage && lastUserMessage.toLowerCase().includes('search')) {
            return {
                content: "I'll search for that information for you.",
                toolCalls: [{
                    toolName: 'web_search',
                    parameters: { query: lastUserMessage, maxResults: 5 },
                    callId: `search_${Date.now()}`
                }]
            };
        } else {
            return {
                content: "I understand your request. How can I help you further?",
                toolCalls: []
            };
        }
    }
}
