/**
 * LangGraph-based Design Orchestration Workflow
 * 
 * This workflow uses LangGraph's StateGraph to handle design mode orchestration,
 * providing proper graph-based execution with conditional routing.
 */

// Note: @langchain/langgraph will be available after npm install
// import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage } from 'langchain/schema';
import { LangGraphWorkflowEngine } from '../langgraphWorkflowEngine';
import { WorkflowConfig, WorkflowState, NodeType, GraphNode } from '../types';
import { ToolRegistry } from '../../toolRegistry';

export class LangGraphDesignWorkflow extends LangGraphWorkflowEngine {
    constructor(toolRegistry: ToolRegistry) {
        const config: WorkflowConfig = {
            workflowName: 'langgraph_design_orchestration',
            modelProvider: 'typescript',
            modelName: 'built-in',
            maxIterations: 10,
            timeoutSeconds: 300,
            enableParallelExecution: false,
            enableRetry: true,
            logLevel: 'INFO',
            metadata: {
                description: 'LangGraph-based design orchestration workflow',
                mode: 'design'
            }
        };

        super(config, toolRegistry);
        this.initializeDesignNodes();
    }

    /**
     * Initialize design-specific nodes
     */
    private initializeDesignNodes(): void {
        // Add design orchestration node
        this.addNode('design_orchestration', {
            id: 'design_orchestration',
            type: NodeType.ASSISTANT,
            description: 'Analyze user prompt and generate design requirements',
            handler: this.designOrchestrationHandler.bind(this)
        });

        // Add requirements generation node
        this.addNode('requirements_generation', {
            id: 'requirements_generation',
            type: NodeType.ASSISTANT,
            description: 'Generate detailed project requirements and specifications',
            handler: this.requirementsGenerationHandler.bind(this)
        });

        // Add file write node
        this.addNode('file_write', {
            id: 'file_write',
            type: NodeType.TOOL,
            description: 'Write generated files to project structure',
            handler: this.fileWriteHandler.bind(this)
        });

        // Add validation node
        this.addNode('validation', {
            id: 'validation',
            type: NodeType.CONDITIONAL,
            description: 'Validate generated design and requirements',
            handler: this.validationHandler.bind(this)
        });

        // Set up design-specific edges
        (this as any).graph.addEdge('start', 'design_orchestration');
        (this as any).graph.addEdge('design_orchestration', 'requirements_generation');
        (this as any).graph.addEdge('requirements_generation', 'validation');
        (this as any).graph.addConditionalEdges('validation', this.designRouteCondition.bind(this));
        (this as any).graph.addEdge('file_write', 'end');

        // Recompile the graph with new nodes
        (this as any).compiledGraph = (this as any).graph.compile();
    }

    /**
     * Design orchestration handler
     */
    private async designOrchestrationHandler(state: WorkflowState): Promise<WorkflowState> {
        console.log('🎨 Design Orchestration: Analyzing user prompt with LLM');
        
        state.currentNode = 'design_orchestration';
        state.executionPath.push('design_orchestration');
        state.updatedAt = new Date();

        try {
            const userInput = state.inputData.user_input || '';
            
            // Use the improved system prompt from base class
            const systemPrompt = (this as any).createAssistantSystemPrompt(state);
            
            // Call LLM for design analysis - ALL responses come from LLM
            const llmResponse = await (this as any).callLLM(systemPrompt, userInput, state);
            
            // Parse LLM response for design analysis
            const designAnalysis = this.parseDesignAnalysis(llmResponse, userInput);
            
            // Update state with design analysis
            state.context.designAnalysis = designAnalysis;
            state.context.designPrompt = userInput;
            state.context.llmDesignAnalysis = llmResponse;
            
            // Add to messages
            const { HumanMessage, AIMessage } = require('langchain/schema');
            state.messages.push(new HumanMessage(userInput));
            state.messages.push(new AIMessage(llmResponse));
            
            // Determine next action based on LLM response
            if (this.isGreetingResponse(llmResponse)) {
                state.context.nextAction = 'complete';
            } else {
                state.context.nextAction = 'generate_requirements';
            }
            
            console.log('✅ Design orchestration completed with LLM analysis');
            
        } catch (error) {
            console.error('❌ Design orchestration error:', error);
            // Even on error, try to get LLM response
            state.context.designAnalysis = {
                error: 'LLM call failed',
                message: 'Failed to analyze your request. Please try again.',
                source: 'error'
            };
            state.context.nextAction = 'complete';
        }
        
        return state;
    }

    /**
     * Requirements generation handler
     */
    private async requirementsGenerationHandler(state: WorkflowState): Promise<WorkflowState> {
        console.log('📋 Requirements Generation: Creating detailed specifications');
        
        state.currentNode = 'requirements_generation';
        state.executionPath.push('requirements_generation');
        state.updatedAt = new Date();

        const analysis = state.context.designAnalysis;
        
        // Check if this is a greeting response from LLM
        if (this.isGreetingResponse(state.context.llmDesignAnalysis || '')) {
            console.log('👋 LLM detected greeting, skipping requirements generation');
            state.context.requirements = {
                isGreeting: true,
                message: 'This was a greeting, no requirements generated.'
            };
            state.context.nextAction = 'complete';
            return state;
        }
        
        // Generate requirements using LLM - ALL responses come from LLM
        try {
            const systemPrompt = this.createRequirementsGenerationPrompt();
            const userInput = `Generate detailed requirements for: ${state.context.designPrompt || 'the project'}`;
            
            const llmResponse = await (this as any).callLLM(systemPrompt, userInput, state);
            
            // Parse LLM response for requirements
            state.context.requirements = this.parseRequirementsFromLLM(llmResponse, analysis);
            
        } catch (error) {
            console.error('❌ LLM requirements generation failed:', error);
            // Even fallback should use LLM if possible
            state.context.requirements = {
                error: 'Failed to generate requirements',
                message: 'LLM requirements generation failed. Please try again.',
                source: 'error'
            };
        }

        state.context.nextAction = 'validate_requirements';
        
        return state;
    }

    /**
     * File write handler
     */
    private async fileWriteHandler(state: WorkflowState): Promise<WorkflowState> {
        console.log('📝 File Write: Writing generated files');
        
        state.currentNode = 'file_write';
        state.executionPath.push('file_write');
        state.updatedAt = new Date();

        const requirements = state.context.requirements;
        
        // Skip file generation for greetings or errors
        if (requirements && (requirements.isGreeting || requirements.error)) {
            console.log('👋 Skipping file generation for greeting or error');
            state.outputData.generatedFiles = [];
            state.context.nextAction = 'complete';
            return state;
        }
        
        // Generate files
        state.outputData.generatedFiles = [
            {
                path: 'requirements.md',
                content: this.generateRequirementsMarkdown(requirements)
            },
            {
                path: 'project-structure.md',
                content: this.generateProjectStructure(requirements)
            },
            {
                path: 'design-spec.md',
                content: this.generateDesignSpec(requirements)
            }
        ];

        state.context.nextAction = 'complete';
        
        return state;
    }

    /**
     * Validation handler
     */
    private async validationHandler(state: WorkflowState): Promise<WorkflowState> {
        console.log('✅ Validation: Validating generated design');
        
        state.currentNode = 'validation';
        state.executionPath.push('validation');
        state.updatedAt = new Date();

        const requirements = state.context.requirements;
        const isValid = this.validateRequirements(requirements);
        
        if (isValid) {
            state.context.nextAction = 'write_files';
        } else {
            state.context.nextAction = 'regenerate_requirements';
            state.context.validationErrors = this.getValidationErrors(requirements);
        }
        
        return state;
    }

    /**
     * Design route condition
     */
    private designRouteCondition(state: WorkflowState): string {
        const nextAction = state.context.nextAction;
        
        switch (nextAction) {
            case 'write_files':
                return 'file_write';
            case 'regenerate_requirements':
                return 'requirements_generation';
            case 'complete':
            default:
                return 'end';
        }
    }

    // Helper methods for design analysis
    private analyzeProjectType(input: string): string {
        if (input.toLowerCase().includes('todo') || input.toLowerCase().includes('task')) {
            return 'task-management';
        } else if (input.toLowerCase().includes('blog') || input.toLowerCase().includes('cms')) {
            return 'content-management';
        } else if (input.toLowerCase().includes('ecommerce') || input.toLowerCase().includes('shop')) {
            return 'e-commerce';
        } else {
            return 'web-application';
        }
    }

    private assessComplexity(input: string): 'simple' | 'medium' | 'complex' {
        const words = input.toLowerCase().split(' ');
        const complexKeywords = ['advanced', 'complex', 'enterprise', 'scalable', 'microservices'];
        const simpleKeywords = ['simple', 'basic', 'minimal', 'starter'];
        
        if (complexKeywords.some(keyword => words.includes(keyword))) {
            return 'complex';
        } else if (simpleKeywords.some(keyword => words.includes(keyword))) {
            return 'simple';
        } else {
            return 'medium';
        }
    }

    private identifyTechnologies(input: string): string[] {
        const technologies: string[] = [];
        
        if (input.toLowerCase().includes('react')) technologies.push('React');
        if (input.toLowerCase().includes('vue')) technologies.push('Vue.js');
        if (input.toLowerCase().includes('angular')) technologies.push('Angular');
        if (input.toLowerCase().includes('node')) technologies.push('Node.js');
        if (input.toLowerCase().includes('python')) technologies.push('Python');
        if (input.toLowerCase().includes('typescript')) technologies.push('TypeScript');
        if (input.toLowerCase().includes('database') || input.toLowerCase().includes('db')) {
            technologies.push('Database');
        }
        
        return technologies.length > 0 ? technologies : ['React', 'Node.js', 'TypeScript'];
    }

    private extractFeatures(input: string): string[] {
        const features: string[] = [];
        
        if (input.toLowerCase().includes('auth') || input.toLowerCase().includes('login')) {
            features.push('Authentication');
        }
        if (input.toLowerCase().includes('search')) {
            features.push('Search');
        }
        if (input.toLowerCase().includes('api')) {
            features.push('API Integration');
        }
        if (input.toLowerCase().includes('responsive') || input.toLowerCase().includes('mobile')) {
            features.push('Responsive Design');
        }
        
        return features.length > 0 ? features : ['Basic CRUD Operations'];
    }

    private generateFunctionalRequirements(analysis: any): string[] {
        return [
            `User can create, read, update, and delete ${analysis.projectType || 'application'} items`,
            'User can search and filter content',
            'User can manage their profile and preferences'
        ];
    }

    private generateNonFunctionalRequirements(_analysis: any): string[] {
        return [
            'Application should load within 2 seconds',
            'Application should be responsive on mobile devices',
            'Application should handle up to 1000 concurrent users'
        ];
    }

    private generateTechnicalRequirements(analysis: any): string[] {
        return [
            `Built with ${(analysis.technologies || ['React', 'Node.js']).join(', ')}`,
            'Follows RESTful API design principles',
            'Implements proper error handling and logging',
            'Includes unit and integration tests'
        ];
    }

    private generateUserStories(_analysis: any): string[] {
        return [
            'As a user, I want to create new items so that I can manage my content',
            'As a user, I want to search for items so that I can find what I need quickly',
            'As a user, I want to edit items so that I can keep my content up to date'
        ];
    }

    private validateRequirements(requirements: any): boolean {
        // Simple validation - check if all required sections exist
        return !!(requirements.functional && requirements.nonFunctional && requirements.technical);
    }

    private getValidationErrors(requirements: any): string[] {
        const errors: string[] = [];
        
        if (!requirements.functional) errors.push('Missing functional requirements');
        if (!requirements.nonFunctional) errors.push('Missing non-functional requirements');
        if (!requirements.technical) errors.push('Missing technical requirements');
        
        return errors;
    }

    private generateRequirementsMarkdown(requirements: any): string {
        return `# Project Requirements

## Functional Requirements
${(requirements.functional || []).map((req: string) => `- ${req}`).join('\n')}

## Non-Functional Requirements
${(requirements.nonFunctional || []).map((req: string) => `- ${req}`).join('\n')}

## Technical Requirements
${(requirements.technical || []).map((req: string) => `- ${req}`).join('\n')}

## User Stories
${(requirements.userStories || []).map((story: string) => `- ${story}`).join('\n')}
`;
    }

    private generateProjectStructure(_requirements: any): string {
        return `# Project Structure

\`\`\`
src/
├── components/          # Reusable UI components
├── pages/              # Application pages
├── services/           # API and business logic
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── tests/              # Test files
\`\`\`
`;
    }

    private generateDesignSpec(_requirements: any): string {
        return `# Design Specification

## Architecture
- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL
- Authentication: JWT-based

## Key Components
- User Management
- Content Management
- Search and Filtering
- Responsive Design
`;
    }

    /**
     * Create system prompt for design analysis
     */
    private createDesignAnalysisPrompt(): string {
        return `You are an expert software architect and designer. Your task is to analyze user requirements and provide a comprehensive design analysis.

For the given user input, analyze and provide:

1. **Project Type**: What kind of application is being requested (web app, mobile app, API, etc.)
2. **Complexity Level**: Simple, Medium, or Complex based on features and scope
3. **Technology Stack**: Recommended technologies based on requirements
4. **Key Features**: Core functionality that needs to be implemented
5. **Architecture Considerations**: High-level architectural decisions
6. **User Experience**: UX considerations and user flows

Respond with a structured analysis that can be used to generate detailed requirements and specifications.

Be thorough but concise. Focus on actionable insights that will guide the development process.`;
    }

    /**
     * Parse LLM response for design analysis
     */
    private parseDesignAnalysis(llmResponse: string, userInput: string): any {
        try {
            // Try to extract structured information from LLM response
            const analysis = {
                projectType: this.extractProjectType(llmResponse, userInput),
                complexity: this.extractComplexity(llmResponse),
                technologies: this.extractTechnologies(llmResponse),
                features: this.extractFeaturesFromLLM(llmResponse),
                architecture: this.extractArchitecture(llmResponse),
                userExperience: this.extractUserExperience(llmResponse),
                rawAnalysis: llmResponse
            };

            return analysis;
        } catch (error) {
            console.error('Failed to parse design analysis:', error);
            return this.fallbackDesignAnalysis(userInput);
        }
    }

    /**
     * Fallback design analysis using heuristics
     */
    private fallbackDesignAnalysis(userInput: string): any {
        return {
            projectType: this.analyzeProjectType(userInput),
            complexity: this.assessComplexity(userInput),
            technologies: this.identifyTechnologies(userInput),
            features: this.extractFeatures(userInput),
            architecture: 'Standard web application architecture',
            userExperience: 'User-friendly interface with responsive design',
            rawAnalysis: 'Heuristic analysis based on input keywords'
        };
    }

    /**
     * Extract project type from LLM response
     */
    private extractProjectType(llmResponse: string, userInput: string): string {
        const response = llmResponse.toLowerCase();
        if (response.includes('mobile') || response.includes('app')) return 'mobile-app';
        if (response.includes('api') || response.includes('backend')) return 'api';
        if (response.includes('desktop') || response.includes('application')) return 'desktop-app';
        return this.analyzeProjectType(userInput);
    }

    /**
     * Extract complexity from LLM response
     */
    private extractComplexity(llmResponse: string): string {
        const response = llmResponse.toLowerCase();
        if (response.includes('complex') || response.includes('enterprise') || response.includes('advanced')) return 'complex';
        if (response.includes('simple') || response.includes('basic') || response.includes('minimal')) return 'simple';
        return 'medium';
    }

    /**
     * Extract technologies from LLM response
     */
    private extractTechnologies(llmResponse: string): string[] {
        const technologies: string[] = [];
        const response = llmResponse.toLowerCase();
        
        // Common technology patterns
        const techPatterns = {
            'React': ['react', 'jsx'],
            'Vue.js': ['vue', 'vuejs'],
            'Angular': ['angular'],
            'Node.js': ['node', 'nodejs'],
            'Python': ['python', 'django', 'flask'],
            'TypeScript': ['typescript', 'ts'],
            'PostgreSQL': ['postgresql', 'postgres'],
            'MongoDB': ['mongodb', 'mongo'],
            'Docker': ['docker', 'containerization'],
            'AWS': ['aws', 'amazon web services']
        };

        for (const [tech, patterns] of Object.entries(techPatterns)) {
            if (patterns.some(pattern => response.includes(pattern))) {
                technologies.push(tech);
            }
        }

        return technologies.length > 0 ? technologies : ['React', 'Node.js', 'TypeScript'];
    }

    /**
     * Extract features from LLM response
     */
    private extractFeaturesFromLLM(llmResponse: string): string[] {
        const features: string[] = [];
        const response = llmResponse.toLowerCase();
        
        const featurePatterns = {
            'Authentication': ['auth', 'login', 'signin', 'authentication'],
            'Search': ['search', 'filter', 'query'],
            'API Integration': ['api', 'integration', 'external'],
            'Responsive Design': ['responsive', 'mobile', 'responsive design'],
            'Database': ['database', 'data storage', 'persistence'],
            'Real-time Updates': ['real-time', 'websocket', 'live updates'],
            'File Upload': ['upload', 'file', 'media'],
            'Notifications': ['notification', 'alert', 'message']
        };

        for (const [feature, patterns] of Object.entries(featurePatterns)) {
            if (patterns.some(pattern => response.includes(pattern))) {
                features.push(feature);
            }
        }

        return features.length > 0 ? features : ['Basic CRUD Operations'];
    }

    /**
     * Extract architecture considerations from LLM response
     */
    private extractArchitecture(llmResponse: string): string {
        const response = llmResponse.toLowerCase();
        if (response.includes('microservices')) return 'Microservices architecture';
        if (response.includes('monolith')) return 'Monolithic architecture';
        if (response.includes('serverless')) return 'Serverless architecture';
        return 'Standard web application architecture';
    }

    /**
     * Extract user experience considerations from LLM response
     */
    private extractUserExperience(llmResponse: string): string {
        const response = llmResponse.toLowerCase();
        if (response.includes('user experience') || response.includes('ux')) {
            // Try to extract the UX section
            const uxMatch = llmResponse.match(/user experience[:\s]*(.+?)(?:\n|$)/i);
            if (uxMatch) return uxMatch[1].trim();
        }
        return 'User-friendly interface with responsive design';
    }

    /**
     * Check if LLM response indicates a greeting
     */
    private isGreetingResponse(llmResponse: string): boolean {
        // Check if the LLM response contains greeting indicators
        const greetingIndicators = [
            'hello',
            'hi there',
            'how can i help',
            'greeting',
            'casual conversation',
            'non-design request',
            'just a greeting'
        ];
        
        const lowerResponse = llmResponse.toLowerCase();
        return greetingIndicators.some(indicator => lowerResponse.includes(indicator));
    }

    /**
     * Create requirements generation prompt
     */
    private createRequirementsGenerationPrompt(): string {
        return `You are a software requirements analyst. Generate detailed, structured requirements for the given project.

Your response should be in JSON format with the following structure:
{
  "functional": ["requirement1", "requirement2", ...],
  "nonFunctional": ["requirement1", "requirement2", ...],
  "technical": ["requirement1", "requirement2", ...],
  "userStories": ["As a user, I want...", ...],
  "sections": [
    {
      "title": "Section Title",
      "content": "Detailed content",
      "priority": "high|medium|low"
    }
  ]
}

Be specific, actionable, and comprehensive. Focus on what the system should do, not how it should be implemented.`;
    }

    /**
     * Parse requirements from LLM response
     */
    private parseRequirementsFromLLM(llmResponse: string, analysis: any): any {
        try {
            // Try to parse JSON response
            const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    ...parsed,
                    source: 'llm',
                    analysis: analysis
                };
            }
        } catch (error) {
            console.error('Failed to parse LLM requirements JSON:', error);
        }
        
        // Fallback: extract text content and structure it
        return {
            functional: this.extractFeaturesFromLLM(llmResponse),
            nonFunctional: ['Application should be responsive', 'Application should be secure'],
            technical: ['Built with modern technologies', 'Follows best practices'],
            userStories: ['As a user, I want to use the application effectively'],
            sections: [
                {
                    title: 'LLM Generated Requirements',
                    content: llmResponse,
                    priority: 'high'
                }
            ],
            source: 'llm_fallback',
            analysis: analysis
        };
    }
}
