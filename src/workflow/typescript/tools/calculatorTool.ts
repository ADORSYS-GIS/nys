/**
 * TypeScript Calculator Tool
 * 
 * A safe mathematical expression evaluator for the TypeScript workflow system.
 */

import { BaseTool } from '../baseTool';
import { ToolInput, ToolOutput } from '../types';

export class CalculatorTool extends BaseTool {
    constructor() {
        super(
            'calculator',
            'Evaluate mathematical expressions safely',
            {
                type: 'object',
                properties: {
                    expression: {
                        type: 'string',
                        description: 'Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5")'
                    }
                },
                required: ['expression']
            },
            {
                category: 'math',
                tags: ['math', 'calculation', 'arithmetic']
            }
        );
    }

    async execute(input: ToolInput): Promise<ToolOutput> {
        try {
            const expression = input.expression as string;
            
            if (!expression || typeof expression !== 'string') {
                return {
                    success: false,
                    result: null,
                    error: 'Expression must be a non-empty string',
                    metadata: {}
                };
            }

            // Clean the expression
            const cleanExpression = expression.trim();
            
            // Evaluate the expression safely
            const result = this.safeEval(cleanExpression);
            
            return {
                success: true,
                result: result,
                metadata: {
                    expression: cleanExpression,
                    resultType: typeof result
                }
            };
            
        } catch (error) {
            return {
                success: false,
                result: null,
                error: `Calculation failed: ${error instanceof Error ? error.message : String(error)}`,
                metadata: {}
            };
        }
    }

    private safeEval(expression: string): number {
        // Simple safe evaluation for basic arithmetic
        // In production, you might want to use a proper math parser library
        
        // Remove whitespace
        const clean = expression.replace(/\s/g, '');
        
        // Basic validation - only allow numbers, operators, and parentheses
        if (!/^[0-9+\-*/().\s]+$/.test(clean)) {
            throw new Error('Expression contains invalid characters');
        }
        
        // Check for balanced parentheses
        let parenCount = 0;
        for (const char of clean) {
            if (char === '(') parenCount++;
            if (char === ')') parenCount--;
            if (parenCount < 0) throw new Error('Unbalanced parentheses');
        }
        if (parenCount !== 0) throw new Error('Unbalanced parentheses');
        
        try {
            // Use Function constructor for safer evaluation than eval
            // This is still not 100% safe, but better than eval
            const result = new Function('return ' + clean)();
            
            if (typeof result !== 'number' || !isFinite(result)) {
                throw new Error('Invalid result');
            }
            
            return result;
        } catch (error) {
            throw new Error(`Invalid expression: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    getExamples(): Record<string, string> {
        return {
            basic_arithmetic: '2 + 3 * 4',
            division: '10 / 2',
            power: '2 ** 8',
            modulo: '17 % 5',
            negative: '-5 + 3',
            parentheses: '(2 + 3) * 4',
            complex: '2 ** (3 + 1) - 5 * 2'
        };
    }
}
