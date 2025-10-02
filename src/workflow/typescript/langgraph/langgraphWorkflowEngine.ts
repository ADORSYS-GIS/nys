/**
 * LangGraph-based Workflow Engine
 * 
 * This module provides a proper LangGraph implementation for workflow orchestration,
 * replacing the manual graph construction with LangGraph's StateGraph.
 */

// Note: @langchain/langgraph will be available after npm install
// import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from 'langchain/schema';
import { WorkflowState, WorkflowConfig, WorkflowResult, NodeType, GraphNode } from './types';
import { ToolRegistry } from '../toolRegistry';
import { ModelProviderFactory } from '../../../modelProviders/modelProviderFactory';
import { ModelProviderInterface } from '../../../modelProviders/modelProviderInterface';

// Temporary types until @langchain/langgraph is installed
class StateGraph<_T> {
    public edges: any[] = [];
    
    constructor(_config: any) {}
    addNode(_name: string, _handler: any) {}
    addEdge(_from: string, _to: string) {}
    addConditionalEdges(_from: string, _condition: any) {}
    compile() { return this; }
    invoke(state: any, _config?: any) { return Promise.resolve(state); }
}
const END = 'END';
const START = 'START';

export class LangGraphWorkflowEngine {
    private config: WorkflowConfig;
    private toolRegistry: ToolRegistry;
    private graph: StateGraph<WorkflowState>;
    private compiledGraph: any;
    private nodes: Map<string, GraphNode> = new Map();
    private modelProvider: ModelProviderInterface;

    constructor(config: WorkflowConfig, toolRegistry: ToolRegistry) {
        this.config = config;
        this.toolRegistry = toolRegistry;
        this.modelProvider = ModelProviderFactory.getProvider();
        this.graph = new StateGraph<WorkflowState>({
            channels: {
                workflowId: { value: (x: string, y?: string) => y ?? x },
                sessionId: { value: (x: string, y?: string) => y ?? x },
                status: { value: (x: string, y?: string) => y ?? x },
                currentNode: { value: (x: string, y?: string) => y ?? x },
                previousNode: { value: (x: string, y?: string) => y ?? x },
                executionPath: { value: (x: string[], y?: string[]) => y ?? x },
                inputData: { value: (x: Record<string, any>, y?: Record<string, any>) => ({ ...x, ...y }) },
                outputData: { value: (x: Record<string, any>, y?: Record<string, any>) => ({ ...x, ...y }) },
                intermediateResults: { value: (x: Record<string, any>, y?: Record<string, any>) => ({ ...x, ...y }) },
                messages: { value: (x: BaseMessage[], y?: BaseMessage[]) => [...x, ...(y ?? [])] },
                context: { value: (x: Record<string, any>, y?: Record<string, any>) => ({ ...x, ...y }) },
                availableTools: { value: (x: string[], y?: string[]) => y ?? x },
                toolResults: { value: (x: Record<string, any>, y?: Record<string, any>) => ({ ...x, ...y }) },
                pendingToolCalls: { value: (x: any[], y?: any[]) => y ?? x },
                mcpServers: { value: (x: string[], y?: string[]) => y ?? x },
                mcpContext: { value: (x: Record<string, any>, y?: Record<string, any>) => ({ ...x, ...y }) },
                createdAt: { value: (x: Date, y?: Date) => y ?? x },
                updatedAt: { value: (x: Date, y?: Date) => y ?? x },
                metadata: { value: (x: Record<string, any>, y?: Record<string, any>) => ({ ...x, ...y }) },
                error: { value: (x: string, y?: string) => y ?? x },
                retryCount: { value: (x: number, y?: number) => y ?? x },
                maxRetries: { value: (x: number, y?: number) => y ?? x },
                humanInput: { value: (x: string, y?: string) => y ?? x },
                requiresHumanInput: { value: (x: boolean, y?: boolean) => y ?? x }
            }
        });
        this.initializeDefaultNodes();
    }

    /**
     * Initialize default workflow nodes
     */
    private initializeDefaultNodes(): void {
        // Add start node
        this.addNode('start', {
            id: 'start',
            type: NodeType.START,
            description: 'Initialize workflow state',
            handler: this.startNodeHandler.bind(this)
        });

        // Add assistant node
        this.addNode('assistant', {
            id: 'assistant',
            type: NodeType.ASSISTANT,
            description: 'Process user input and determine actions',
            handler: this.assistantNodeHandler.bind(this)
        });

        // Add tool node
        this.addNode('tool', {
            id: 'tool',
            type: NodeType.TOOL,
            description: 'Execute tool calls',
            handler: this.toolNodeHandler.bind(this)
        });

        // Add conditional node for routing
        this.addNode('conditional', {
            id: 'conditional',
            type: NodeType.CONDITIONAL,
            description: 'Route to next node based on state',
            handler: this.conditionalNodeHandler.bind(this)
        });

        // Add end node
        this.addNode('end', {
            id: 'end',
            type: NodeType.END,
            description: 'Finalize workflow and return results',
            handler: this.endNodeHandler.bind(this)
        });

        // Set up the graph edges
        this.graph.addEdge(START, 'start');
        this.graph.addEdge('start', 'assistant');
        this.graph.addEdge('assistant', 'conditional');
        this.graph.addConditionalEdges('conditional', this.routeCondition.bind(this));
        this.graph.addEdge('tool', 'conditional');
        this.graph.addEdge('end', END);

        // Compile the graph
        this.compiledGraph = this.graph.compile();
    }

    /**
     * Add a custom node to the workflow
     */
    addNode(nodeId: string, node: GraphNode): void {
        this.nodes.set(nodeId, node);
        this.graph.addNode(nodeId, node.handler);
    }

    /**
     * Add an edge between nodes
     */
    addEdge(from: string, to: string, condition?: string): void {
        if (condition) {
            this.graph.addConditionalEdges(from, condition);
        } else {
            this.graph.addEdge(from, to);
        }
    }

    /**
     * Execute the workflow
     */
    async execute(inputData: Record<string, any>, initialMessages?: BaseMessage[]): Promise<WorkflowResult> {
        const startTime = Date.now();

        // Initialize workflow state
        const initialState: WorkflowState = {
            workflowId: `workflow_${Date.now()}`,
            sessionId: `session_${Date.now()}`,
            status: 'pending',
            executionPath: [],
            inputData,
            outputData: {},
            intermediateResults: {},
            messages: initialMessages || [],
            context: {},
            availableTools: this.toolRegistry.listTools(),
            toolResults: {},
            pendingToolCalls: [],
            mcpServers: [],
            mcpContext: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {},
            retryCount: 0,
            maxRetries: this.config.enableRetry ? 3 : 0,
            requiresHumanInput: false
        };

        try {
            console.log(`🚀 Starting LangGraph workflow: ${this.config.workflowName}`);
            
            // Execute the compiled graph
            const finalState = await this.compiledGraph.invoke(initialState, {
                configurable: {
                    maxIterations: this.config.maxIterations,
                    timeout: this.config.timeoutSeconds * 1000
                }
            });

            const duration = (Date.now() - startTime) / 1000;
            const result: WorkflowResult = {
                workflowId: finalState.workflowId,
                status: finalState.status,
                outputData: finalState.outputData,
                executionPath: finalState.executionPath,
                durationSeconds: duration,
                error: finalState.error,
                metadata: finalState.metadata
            };

            console.log(`✅ LangGraph workflow completed: ${this.config.workflowName} (${duration}s)`);
            return result;

        } catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            console.error(`❌ LangGraph workflow failed: ${this.config.workflowName}`, error);
            
            return {
                workflowId: initialState.workflowId,
                status: 'failed',
                outputData: {},
                executionPath: initialState.executionPath,
                durationSeconds: duration,
                error: error instanceof Error ? error.message : String(error),
                metadata: initialState.metadata
            };
        }
    }

    /**
     * Start node handler
     */
    private async startNodeHandler(state: WorkflowState): Promise<WorkflowState> {
        console.log('🎬 Start node: Initializing workflow state');
        
        state.status = 'running';
        state.currentNode = 'start';
        state.executionPath.push('start');
        state.updatedAt = new Date();
        
        return state;
    }

    /**
     * Assistant node handler
     */
    private async assistantNodeHandler(state: WorkflowState): Promise<WorkflowState> {
        console.log('🤖 Assistant node: Processing user input with LLM');
        
        state.currentNode = 'assistant';
        state.executionPath.push('assistant');
        state.updatedAt = new Date();

        try {
            const userInput = state.inputData.user_input || 'No input provided';
            
            // Build context from previous messages and state
            const context = this.buildAssistantContext(state);
            
            // Create system prompt for the assistant
            const systemPrompt = this.createAssistantSystemPrompt(state);
            
            // Call the LLM
            const llmResponse = await this.callLLM(systemPrompt, userInput, context);
            
            // Parse the LLM response for tool calls and next actions
            const parsedResponse = this.parseLLMResponse(llmResponse, state);
            
            // Update state with LLM response
            state.messages.push(new HumanMessage(userInput));
            state.messages.push(new AIMessage(llmResponse));
            
            // Set pending tool calls if any
            state.pendingToolCalls = parsedResponse.toolCalls || [];
            
            // Set next action based on LLM response
            state.context.nextAction = parsedResponse.nextAction || 'conditional';
            state.context.llmResponse = llmResponse;
            state.context.assistantReasoning = parsedResponse.reasoning;
            
            console.log(`✅ Assistant processed input. Next action: ${state.context.nextAction}`);
            
        } catch (error) {
            console.error('❌ Assistant node error:', error);
            state.error = error instanceof Error ? error.message : String(error);
            state.context.nextAction = 'end';
        }
        
        return state;
    }

    /**
     * Tool node handler
     */
    private async toolNodeHandler(state: WorkflowState): Promise<WorkflowState> {
        console.log('🔧 Tool node: Executing tool calls');
        
        state.currentNode = 'tool';
        state.executionPath.push('tool');
        state.updatedAt = new Date();

        // Execute pending tool calls
        for (const call of state.pendingToolCalls) {
            try {
                const tool = this.toolRegistry.getTool(call.toolName);
                if (tool) {
                    const result = await tool.execute(call.parameters);
                    state.toolResults[call.callId] = result;
                } else {
                    state.toolResults[call.callId] = {
                        success: false,
                        error: `Tool '${call.toolName}' not found`
                    };
                }
            } catch (error) {
                state.toolResults[call.callId] = {
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        }

        state.pendingToolCalls = [];
        state.context.nextAction = 'return_to_assistant';
        
        return state;
    }

    /**
     * Conditional node handler for routing
     */
    private async conditionalNodeHandler(state: WorkflowState): Promise<WorkflowState> {
        console.log('🔀 Conditional node: Determining next step');
        
        state.currentNode = 'conditional';
        state.executionPath.push('conditional');
        state.updatedAt = new Date();

        // Determine next action based on state
        if (state.pendingToolCalls.length > 0) {
            state.context.nextAction = 'execute_tools';
        } else if (state.requiresHumanInput) {
            state.context.nextAction = 'wait_for_human';
        } else {
            state.context.nextAction = 'complete';
        }
        
        return state;
    }

    /**
     * End node handler
     */
    private async endNodeHandler(state: WorkflowState): Promise<WorkflowState> {
        console.log('🏁 End node: Finalizing workflow');
        
        state.currentNode = 'end';
        state.executionPath.push('end');
        state.status = 'completed';
        state.updatedAt = new Date();
        
        return state;
    }

    /**
     * Route condition for conditional edges
     */
    private routeCondition(state: WorkflowState): string {
        const nextAction = state.context.nextAction;
        
        switch (nextAction) {
            case 'execute_tools':
                return 'tool';
            case 'wait_for_human':
                return 'end'; // For now, end if human input required
            case 'complete':
            default:
                return 'end';
        }
    }

    /**
     * Get the compiled graph for visualization
     */
    getGraph(): any {
        return this.compiledGraph;
    }

    /**
     * Get graph structure for debugging
     */
    getGraphStructure(): any {
        return {
            nodes: Array.from(this.nodes.keys()),
            edges: this.graph.edges,
            config: this.config
        };
    }

    /**
     * Build context for assistant from current state
     */
    private buildAssistantContext(state: WorkflowState): any {
        return {
            workflowName: this.config.workflowName,
            availableTools: state.availableTools,
            previousResults: state.toolResults,
            executionPath: state.executionPath,
            context: state.context,
            mode: state.inputData.mode || 'general'
        };
    }

    /**
     * Create system prompt for the assistant
     */
    private createAssistantSystemPrompt(state: WorkflowState): string {
        const availableTools = state.availableTools.join(', ');
        const mode = state.inputData.mode || 'general';
        
        // Different prompts based on mode
        if (mode === 'design') {
            return `You are an AI assistant working within a LangGraph workflow system for software design.

Current Workflow: ${this.config.workflowName}
Available Tools: ${availableTools}
Mode: ${mode}

Your role is to analyze user input and provide appropriate responses. You must respond naturally and helpfully to ALL user inputs.

For greetings like "hello", "hi", "how are you":
- Respond with a friendly, natural greeting
- Ask how you can help with their software design needs
- Be conversational and helpful

For design requests like "create a todo app", "build a website", "design a system":
- Analyze the request thoroughly
- Provide detailed analysis of what they want to build
- Suggest next steps for implementation

IMPORTANT: Always respond naturally and helpfully. Never give generic or template responses. Make your responses feel personal and engaging.

Your response should be natural conversation, not JSON or structured data. Just respond as a helpful AI assistant would.

Examples:
- User: "hello" → You: "Hello! I'm here to help you with software design. What would you like to build today?"
- User: "create a todo app" → You: "Great! A todo app is a fantastic project. Let me help you design a comprehensive todo application with features like task management, user authentication, and data persistence. What specific features are most important to you?"`;
        }
        
        // General mode prompt
        return `You are an AI assistant working within a LangGraph workflow system.

Current Workflow: ${this.config.workflowName}
Available Tools: ${availableTools}
Mode: ${mode}

Your role is to:
1. Analyze the user's input and understand their intent
2. Determine if any tools need to be called to fulfill the request
3. Provide clear reasoning for your decisions
4. Set the appropriate next action

Available actions:
- execute_tools: If you need to call tools
- conditional: For routing decisions
- complete: If the task is finished
- wait_for_human: If human input is needed

When you need to call tools, respond with a JSON structure like:
{
  "reasoning": "Your reasoning for the decision",
  "toolCalls": [
    {
      "toolName": "tool_name",
      "parameters": {"param": "value"}
    }
  ],
  "nextAction": "execute_tools"
}

Otherwise, respond with:
{
  "reasoning": "Your reasoning",
  "nextAction": "conditional"
}

Be concise but thorough in your analysis.`;
    }

    /**
     * Call the LLM with the given prompt and context
     */
    private async callLLM(systemPrompt: string, userInput: string, context: any): Promise<string> {
        try {
            // Get API key from configuration
            const apiKey = this.getApiKey();
            if (!apiKey) {
                console.warn('⚠️ No API key found, using fallback response');
                return this.getFallbackResponse(userInput);
            }

            // Create request body
            const requestBody = this.modelProvider.createRequestBody(systemPrompt, userInput);
            
            // Add context to the request if supported
            if (requestBody.messages && Array.isArray(requestBody.messages)) {
                requestBody.messages.push({
                    role: 'system',
                    content: `Context: ${JSON.stringify(context, null, 2)}`
                });
            }

            // Make the API call
            const response = await this.makeApiCall(requestBody, apiKey);
            
            // Extract content from response
            return this.modelProvider.extractContent(response);
            
        } catch (error) {
            console.error('LLM call failed:', error);
            console.warn('⚠️ Using fallback response due to LLM failure');
            return this.getFallbackResponse(userInput);
        }
    }

    /**
     * Make API call to the LLM provider
     */
    private async makeApiCall(requestBody: any, apiKey: string): Promise<any> {
        const headers = this.modelProvider.getHeaders(apiKey);
        const baseUrl = (this.modelProvider as any).baseUrl || 'https://api.openai.com/v1/chat/completions';
        
        console.log('🔗 Making LLM API call to:', baseUrl);
        console.log('📝 Request body:', JSON.stringify(requestBody, null, 2));
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API call failed:', response.status, response.statusText, errorText);
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ LLM API call successful');
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('API call timed out after 30 seconds');
            }
            throw error;
        }
    }

    /**
     * Get API key from configuration
     */
    private getApiKey(): string | null {
        // Try multiple sources for API key
        const possibleKeys = [
            process.env.OPENAI_API_KEY,
            process.env.ANTHROPIC_API_KEY,
            process.env.GOOGLE_API_KEY,
            process.env.GEMINI_API_KEY
        ];
        
        const apiKey = possibleKeys.find(key => key && key.trim().length > 0);
        
        if (!apiKey) {
            console.warn('⚠️ No API key found in environment variables');
            console.warn('Please set one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY');
        } else {
            console.log('🔑 API key found:', apiKey.substring(0, 8) + '...');
        }
        
        return apiKey || null;
    }

    /**
     * Get fallback response when LLM is not available
     */
    private getFallbackResponse(userInput: string): string {
        const lowerInput = userInput.toLowerCase().trim();
        
        // Handle greetings
        if (lowerInput === 'hello' || lowerInput === 'hi' || lowerInput === 'hey') {
            return 'Hello! I\'m here to help you with software design. What would you like to build today?';
        }
        
        // Handle design requests
        if (lowerInput.includes('create') || lowerInput.includes('build') || lowerInput.includes('design')) {
            return `I understand you want to build: ${userInput}. This is a great project idea! To provide you with detailed requirements and specifications, I need access to an AI language model. Please configure an API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY) to get full functionality.`;
        }
        
        // Default response
        return `I received your message: "${userInput}". I'm here to help with software design and development. To provide the best assistance, please configure an API key for AI language model access.`;
    }

    /**
     * Parse LLM response to extract tool calls and next actions
     */
    private parseLLMResponse(response: string, state: WorkflowState): any {
        try {
            // Try to parse as JSON first
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    reasoning: parsed.reasoning || 'No reasoning provided',
                    toolCalls: parsed.toolCalls?.map((call: any, index: number) => ({
                        callId: `call_${Date.now()}_${index}`,
                        toolName: call.toolName,
                        parameters: call.parameters
                    })) || [],
                    nextAction: parsed.nextAction || 'conditional'
                };
            }
            
            // Fallback: analyze response for tool mentions
            const toolCalls: any[] = [];
            for (const toolName of state.availableTools) {
                if (response.toLowerCase().includes(toolName.toLowerCase())) {
                    // Simple heuristic: if tool is mentioned, create a basic call
                    toolCalls.push({
                        callId: `call_${Date.now()}_${toolCalls.length}`,
                        toolName,
                        parameters: { query: response }
                    });
                }
            }
            
            return {
                reasoning: response,
                toolCalls,
                nextAction: toolCalls.length > 0 ? 'execute_tools' : 'conditional'
            };
            
        } catch (error) {
            console.error('Failed to parse LLM response:', error);
            return {
                reasoning: response,
                toolCalls: [],
                nextAction: 'conditional'
            };
        }
    }
}
