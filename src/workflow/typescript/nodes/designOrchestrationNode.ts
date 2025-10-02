/**
 * Design Orchestration Node
 * 
 * This node processes the user's first prompt in design mode and orchestrates
 * the workflow to generate project requirements.
 */

import { BaseNode } from './baseNode';
import { WorkflowState, WorkflowStatus, NodeType, WorkflowMessage } from '../types';

export class DesignOrchestrationNode extends BaseNode {
    constructor(nodeId: string = 'design_orchestration') {
        super(nodeId, NodeType.ASSISTANT, 'Design mode orchestration coordinator');
    }

    async execute(state: WorkflowState): Promise<WorkflowState> {
        const startTime = Date.now();

        try {
            // Update state
            state.currentNode = this.nodeId;
            state.executionPath.push(this.nodeId);
            state.updatedAt = new Date();

            // Get user input from the first message
            const userInput = this.extractUserInput(state);
            
            if (!userInput) {
                throw new Error('No user input found for design orchestration');
            }

            // Process the design prompt
            const designAnalysis = await this.analyzeDesignPrompt(userInput);
            
            // Update state with design analysis
            state.context.designAnalysis = designAnalysis;
            state.context.userInput = userInput;
            state.context.nextAction = 'generate_requirements';

            // Add assistant response
            state.messages.push({
                role: 'assistant',
                content: `I understand you want to build: ${designAnalysis.summary}. Let me analyze this and generate detailed requirements.`
            });

            const result = this.createNodeResult(
                true,
                {
                    designAnalysis: designAnalysis,
                    nextAction: 'generate_requirements'
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

    private extractUserInput(state: WorkflowState): string | null {
        // Look for the first user message
        for (const message of state.messages) {
            if (message.role === 'user') {
                return message.content;
            }
        }
        
        // Fallback to input data
        return state.inputData.user_input || null;
    }

    private async analyzeDesignPrompt(userInput: string): Promise<any> {
        // Simulate design analysis - in a real implementation, this would use LLM
        await new Promise(resolve => setTimeout(resolve, 100));

        // Extract key information from the prompt
        const analysis = {
            summary: this.extractSummary(userInput),
            features: this.extractFeatures(userInput),
            technologies: this.extractTechnologies(userInput),
            complexity: this.assessComplexity(userInput),
            estimatedTime: this.estimateTime(userInput),
            requirements: this.generateInitialRequirements(userInput)
        };

        return analysis;
    }

    private extractSummary(userInput: string): string {
        // Simple extraction - in reality, this would use NLP/LLM
        if (userInput.toLowerCase().includes('website')) {
            return 'A website application';
        } else if (userInput.toLowerCase().includes('api')) {
            return 'An API service';
        } else if (userInput.toLowerCase().includes('mobile')) {
            return 'A mobile application';
        } else if (userInput.toLowerCase().includes('desktop')) {
            return 'A desktop application';
        } else {
            return 'A software application';
        }
    }

    private extractFeatures(userInput: string): string[] {
        const features: string[] = [];
        
        if (userInput.toLowerCase().includes('user') && userInput.toLowerCase().includes('auth')) {
            features.push('User authentication');
        }
        if (userInput.toLowerCase().includes('database')) {
            features.push('Database integration');
        }
        if (userInput.toLowerCase().includes('api')) {
            features.push('API endpoints');
        }
        if (userInput.toLowerCase().includes('ui') || userInput.toLowerCase().includes('interface')) {
            features.push('User interface');
        }
        if (userInput.toLowerCase().includes('search')) {
            features.push('Search functionality');
        }
        
        return features.length > 0 ? features : ['Basic functionality'];
    }

    private extractTechnologies(userInput: string): string[] {
        const technologies: string[] = [];
        
        if (userInput.toLowerCase().includes('react')) {
            technologies.push('React');
        }
        if (userInput.toLowerCase().includes('node')) {
            technologies.push('Node.js');
        }
        if (userInput.toLowerCase().includes('typescript')) {
            technologies.push('TypeScript');
        }
        if (userInput.toLowerCase().includes('python')) {
            technologies.push('Python');
        }
        if (userInput.toLowerCase().includes('sql')) {
            technologies.push('SQL Database');
        }
        
        return technologies.length > 0 ? technologies : ['TypeScript', 'Node.js'];
    }

    private assessComplexity(userInput: string): 'low' | 'medium' | 'high' {
        const complexityIndicators = [
            'complex', 'advanced', 'enterprise', 'scalable', 'distributed',
            'microservices', 'real-time', 'machine learning', 'ai'
        ];
        
        const lowComplexityIndicators = [
            'simple', 'basic', 'hello world', 'tutorial', 'example'
        ];
        
        const input = userInput.toLowerCase();
        
        if (complexityIndicators.some(indicator => input.includes(indicator))) {
            return 'high';
        } else if (lowComplexityIndicators.some(indicator => input.includes(indicator))) {
            return 'low';
        } else {
            return 'medium';
        }
    }

    private estimateTime(userInput: string): string {
        const complexity = this.assessComplexity(userInput);
        
        switch (complexity) {
            case 'low':
                return '1-3 days';
            case 'medium':
                return '1-2 weeks';
            case 'high':
                return '1-3 months';
            default:
                return '1-2 weeks';
        }
    }

    private generateInitialRequirements(userInput: string): string[] {
        const requirements: string[] = [];
        
        requirements.push('Project setup and configuration');
        requirements.push('Basic project structure');
        
        if (userInput.toLowerCase().includes('user')) {
            requirements.push('User management system');
        }
        if (userInput.toLowerCase().includes('data')) {
            requirements.push('Data persistence layer');
        }
        if (userInput.toLowerCase().includes('api')) {
            requirements.push('API endpoint implementation');
        }
        if (userInput.toLowerCase().includes('ui')) {
            requirements.push('User interface components');
        }
        
        requirements.push('Testing and validation');
        requirements.push('Documentation');
        
        return requirements;
    }
}
