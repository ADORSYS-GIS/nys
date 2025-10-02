/**
 * TypeScript Workflow System - Base Tool
 * 
 * This module provides the base tool interface for the TypeScript workflow system.
 */

import { ToolInput, ToolOutput, ToolDefinition } from './types';

export abstract class BaseTool {
    public readonly name: string;
    public readonly description: string;
    public readonly parameters: Record<string, any>;
    public readonly config: Record<string, any>;

    constructor(
        name: string,
        description: string,
        parameters?: Record<string, any>,
        config: Record<string, any> = {}
    ) {
        this.name = name;
        this.description = description;
        this.parameters = parameters || {};
        this.config = config;
    }

    /**
     * Execute the tool with the given input
     */
    abstract execute(input: ToolInput): Promise<ToolOutput>;

    /**
     * Get the tool definition
     */
    getDefinition(): ToolDefinition {
        return {
            name: this.name,
            description: this.description,
            parameters: this.parameters,
            requiredParameters: this.parameters.required || [],
            optionalParameters: this.parameters.optional || [],
            category: this.config.category || 'general',
            tags: this.config.tags || []
        };
    }

    /**
     * Validate tool input
     */
    validateInput(input: ToolInput): { valid: boolean; error?: string } {
        const required = this.parameters.required || [];
        
        for (const param of required) {
            if (!(param in input)) {
                return {
                    valid: false,
                    error: `Missing required parameter: ${param}`
                };
            }
        }

        return { valid: true };
    }

    /**
     * Get examples for this tool
     */
    getExamples(): Record<string, any> {
        return {};
    }
}
