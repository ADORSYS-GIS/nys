/**
 * TypeScript Workflow System - Tool Registry
 * 
 * This module provides tool registration and management for the TypeScript workflow system.
 */

import { BaseTool } from './baseTool';
import { ToolDefinition } from './types';

export class ToolRegistry {
    private tools: Map<string, BaseTool> = new Map();

    /**
     * Register a tool in the registry
     */
    registerTool(tool: BaseTool): void {
        this.tools.set(tool.name, tool);
    }

    /**
     * Get a tool by name
     */
    getTool(name: string): BaseTool | undefined {
        return this.tools.get(name);
    }

    /**
     * List all registered tool names
     */
    listTools(): string[] {
        return Array.from(this.tools.keys());
    }

    /**
     * Get definitions for all registered tools
     */
    getToolDefinitions(): ToolDefinition[] {
        return Array.from(this.tools.values()).map(tool => tool.getDefinition());
    }

    /**
     * Unregister a tool
     */
    unregisterTool(name: string): boolean {
        return this.tools.delete(name);
    }

    /**
     * Clear all registered tools
     */
    clear(): void {
        this.tools.clear();
    }

    /**
     * Get tools by category
     */
    getToolsByCategory(category: string): BaseTool[] {
        return Array.from(this.tools.values()).filter(
            tool => tool.config.category === category
        );
    }

    /**
     * Get tools by tag
     */
    getToolsByTag(tag: string): BaseTool[] {
        return Array.from(this.tools.values()).filter(
            tool => tool.config.tags && tool.config.tags.includes(tag)
        );
    }

    /**
     * Validate a tool call
     */
    validateToolCall(toolName: string, parameters: Record<string, any>): { valid: boolean; error?: string } {
        const tool = this.getTool(toolName);
        if (!tool) {
            return { valid: false, error: `Tool '${toolName}' not found` };
        }

        return tool.validateInput(parameters);
    }

    /**
     * Execute a tool safely
     */
    async executeToolSafely(
        toolName: string,
        parameters: Record<string, any>,
        timeout: number = 30000
    ): Promise<{ success: boolean; result?: any; error?: string }> {
        const tool = this.getTool(toolName);
        if (!tool) {
            return {
                success: false,
                error: `Tool '${toolName}' not found`
            };
        }

        // Validate the tool call
        const validation = this.validateToolCall(toolName, parameters);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            };
        }

        try {
            // Execute with timeout
            const result = await Promise.race([
                tool.execute(parameters),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Tool execution timeout')), timeout)
                )
            ]);

            return {
                success: result.success,
                result: result.result,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get registry statistics
     */
    getRegistryStats(): Record<string, any> {
        const categories: Record<string, number> = {};
        const tags: Record<string, number> = {};

        for (const tool of this.tools.values()) {
            // Count by category
            const category = tool.config.category || 'general';
            categories[category] = (categories[category] || 0) + 1;

            // Count by tags
            if (tool.config.tags) {
                for (const tag of tool.config.tags) {
                    tags[tag] = (tags[tag] || 0) + 1;
                }
            }
        }

        return {
            totalTools: this.tools.size,
            categories,
            tags
        };
    }
}
