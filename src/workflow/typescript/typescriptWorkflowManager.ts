/**
 * TypeScript Workflow Manager
 * 
 * This module provides a pure TypeScript workflow system that integrates
 * directly with the VSCode extension without external processes.
 */

import * as vscode from 'vscode';
import { WorkflowEngine } from './workflowEngine';
import { ToolRegistry } from './toolRegistry';
import { WorkflowConfig, WorkflowResult, WorkflowMessage } from './types';
import { WorkflowResult as LangGraphWorkflowResult } from './langgraph/types';
import { CalculatorTool } from './tools/calculatorTool';
import { WebSearchTool } from './tools/webSearchTool';
import { DesignOrchestrationWorkflow } from './workflows/designOrchestrationWorkflow';
import { BuildGenerationWorkflow } from './workflows/buildGenerationWorkflow';
import { LangGraphDesignWorkflow } from './langgraph/workflows/langgraphDesignWorkflow';
import { LangGraphWorkflowEngine } from './langgraph/langgraphWorkflowEngine';

export interface WorkflowRequest {
    workflowType: string;
    input: Record<string, any>;
    config?: Record<string, any>;
}

export interface WorkflowResponse {
    success: boolean;
    result?: any;
    error?: string;
    executionPath?: string[];
    duration?: number;
}

export class TypeScriptWorkflowManager {
    private workflows: Map<string, WorkflowEngine | LangGraphWorkflowEngine> = new Map();
    private toolRegistry: ToolRegistry;
    private outputChannel: vscode.OutputChannel;
    private isInitialized = false;

    constructor() {
        this.toolRegistry = new ToolRegistry();
        this.outputChannel = vscode.window.createOutputChannel('Mira Workflow');
        this.initialize();
    }

    /**
     * Initialize the workflow manager
     */
    private initialize(): void {
        if (this.isInitialized) {
            return;
        }

        this.outputChannel.appendLine('🚀 Initializing Mira Workflow Manager...');

        // Register built-in tools
        this.registerBuiltinTools();

        // Pre-initialize common workflows
        this.initializeWorkflows();

        this.isInitialized = true;
        this.outputChannel.appendLine('✅ Mira Workflow Manager initialized successfully');
    }

    /**
     * Register built-in tools
     */
    private registerBuiltinTools(): void {
        this.outputChannel.appendLine('📦 Registering built-in tools...');

        // Register calculator tool
        const calculator = new CalculatorTool();
        this.toolRegistry.registerTool(calculator);

        // Register web search tool
        const webSearch = new WebSearchTool();
        this.toolRegistry.registerTool(webSearch);

        this.outputChannel.appendLine(`✅ Registered ${this.toolRegistry.listTools().length} tools`);
    }

    /**
     * Initialize common workflow types
     */
    private initializeWorkflows(): void {
        this.outputChannel.appendLine('🔧 Initializing workflows...');

        // Calculator workflow
        const calculatorConfig: WorkflowConfig = {
            workflowName: 'calculator',
            modelProvider: 'typescript',
            modelName: 'built-in',
            maxIterations: 5,
            timeoutSeconds: 60,
            enableParallelExecution: false,
            enableRetry: true,
            logLevel: 'INFO',
            metadata: {}
        };
        const calculatorWorkflow = new WorkflowEngine(calculatorConfig, this.toolRegistry);
        this.workflows.set('calculator', calculatorWorkflow);

        // Multi-tool workflow
        const multiToolConfig: WorkflowConfig = {
            workflowName: 'multi_tool',
            modelProvider: 'typescript',
            modelName: 'built-in',
            maxIterations: 8,
            timeoutSeconds: 120,
            enableParallelExecution: false,
            enableRetry: true,
            logLevel: 'INFO',
            metadata: {}
        };
        const multiToolWorkflow = new WorkflowEngine(multiToolConfig, this.toolRegistry);
        this.workflows.set('multi_tool', multiToolWorkflow);

        // Design orchestration workflow - using LangGraph system
        const designOrchestrationWorkflow = new LangGraphDesignWorkflow(this.toolRegistry);
        this.workflows.set('design_orchestration', designOrchestrationWorkflow);

        // Build generation workflow
        const buildGenerationWorkflow = new BuildGenerationWorkflow(this.toolRegistry);
        this.workflows.set('build_generation', buildGenerationWorkflow);

        this.outputChannel.appendLine(`✅ Initialized ${this.workflows.size} workflow types`);
    }

    /**
     * Execute a workflow
     */
    async executeWorkflow(request: WorkflowRequest): Promise<WorkflowResponse> {
        try {
            this.outputChannel.appendLine(`🔄 Executing workflow: ${request.workflowType}`);
            console.log('📋 Workflow request:', JSON.stringify(request, null, 2));

            let workflow = this.workflows.get(request.workflowType);
            
            if (!workflow) {
                this.outputChannel.appendLine(`⚠️ Workflow '${request.workflowType}' not found, creating custom workflow`);
                // Create custom workflow if not pre-initialized
                workflow = await this.createCustomWorkflow(request.workflowType, request.config);
            } else {
                this.outputChannel.appendLine(`✅ Found existing workflow: ${request.workflowType}`);
            }

            // Prepare input data
            const inputData = {
                ...request.input,
                workflowType: request.workflowType
            };

            // Prepare initial messages
            const initialMessages: WorkflowMessage[] = [];
            if (request.input.user_input) {
                initialMessages.push({
                    role: 'user',
                    content: request.input.user_input
                });
            }

            this.outputChannel.appendLine(`📝 Input data prepared, starting workflow execution...`);
            console.log('📝 Input data:', JSON.stringify(inputData, null, 2));
            console.log('💬 Initial messages:', JSON.stringify(initialMessages, null, 2));

            // Execute workflow
            let result: WorkflowResult;
            if (workflow instanceof LangGraphWorkflowEngine) {
                // Convert WorkflowMessage[] to BaseMessage[] for LangGraph workflows
                const { HumanMessage, AIMessage } = require('langchain/schema');
                const baseMessages = initialMessages.map(msg => {
                    if (msg.role === 'user') {
                        return new HumanMessage(msg.content);
                    } else {
                        return new AIMessage(msg.content);
                    }
                });
                const langGraphResult = await workflow.execute(inputData, baseMessages);
                // Convert LangGraphWorkflowResult to WorkflowResult
                result = this.convertLangGraphResult(langGraphResult);
            } else {
                result = await workflow.execute(inputData, initialMessages);
            }

            this.outputChannel.appendLine(`✅ Workflow completed: ${result.status}`);
            
            // Clean up circular references before logging
            try {
                const cleanResult = this.cleanWorkflowResult(result);
                console.log('📊 Workflow result:', JSON.stringify(cleanResult, null, 2));
            } catch (error) {
                console.log('📊 Workflow result (serialization failed):', result);
            }

            const success = result.status === 'completed';
            this.outputChannel.appendLine(`📊 Success determination: status='${result.status}', success=${success}`);
            
            return {
                success: success,
                result: result.outputData,
                error: result.error,
                executionPath: result.executionPath,
                duration: result.durationSeconds
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(`❌ Workflow execution failed: ${errorMessage}`);
            console.error('❌ Workflow execution error:', error);
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Create a custom workflow
     */
    private async createCustomWorkflow(workflowType: string, config?: Record<string, any>): Promise<WorkflowEngine> {
        const workflowConfig: WorkflowConfig = {
            workflowName: workflowType,
            modelProvider: 'typescript',
            modelName: 'built-in',
            maxIterations: config?.maxIterations || 10,
            timeoutSeconds: config?.timeoutSeconds || 300,
            enableParallelExecution: config?.enableParallelExecution || false,
            enableRetry: config?.enableRetry || true,
            logLevel: config?.logLevel || 'INFO',
            metadata: config?.metadata || {}
        };

        return new WorkflowEngine(workflowConfig, this.toolRegistry);
    }

    /**
     * Execute calculator workflow
     */
    async executeCalculator(expression: string): Promise<WorkflowResponse> {
        return this.executeWorkflow({
            workflowType: 'calculator',
            input: {
                user_input: `Calculate ${expression}`,
                expression: expression
            }
        });
    }

    /**
     * Execute multi-tool workflow
     */
    async executeMultiTool(userInput: string): Promise<WorkflowResponse> {
        return this.executeWorkflow({
            workflowType: 'multi_tool',
            input: {
                user_input: userInput
            }
        });
    }

    /**
     * Execute custom workflow
     */
    async executeCustom(userInput: string, workflowType: string = 'custom'): Promise<WorkflowResponse> {
        return this.executeWorkflow({
            workflowType: workflowType,
            input: {
                user_input: userInput
            }
        });
    }

    /**
     * Get available workflow types
     */
    getAvailableWorkflows(): string[] {
        return Array.from(this.workflows.keys());
    }

    /**
     * Get available tools
     */
    getAvailableTools(): string[] {
        return this.toolRegistry.listTools();
    }

    /**
     * Get workflow manager status
     */
    getStatus(): Record<string, any> {
        return {
            initialized: this.isInitialized,
            availableWorkflows: this.getAvailableWorkflows(),
            availableTools: this.getAvailableTools(),
            toolRegistryStats: this.toolRegistry.getRegistryStats()
        };
    }

    /**
     * Show output channel
     */
    showOutput(): void {
        this.outputChannel.show();
    }

    /**
     * Clean workflow result to remove circular references
     */
    private cleanWorkflowResult(result: any): any {
        const seen = new WeakSet();
        
        const clean = (obj: any): any => {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }
            
            if (seen.has(obj)) {
                return '[Circular Reference]';
            }
            
            seen.add(obj);
            
            if (Array.isArray(obj)) {
                return obj.map(clean);
            }
            
            const cleaned: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cleaned[key] = clean(obj[key]);
                }
            }
            
            return cleaned;
        };
        
        return clean(result);
    }

    /**
     * Convert LangGraphWorkflowResult to WorkflowResult
     */
    private convertLangGraphResult(langGraphResult: LangGraphWorkflowResult): WorkflowResult {
        return {
            workflowId: langGraphResult.workflowId,
            status: langGraphResult.status as any, // Convert string to WorkflowStatus enum
            outputData: langGraphResult.outputData,
            executionPath: langGraphResult.executionPath,
            durationSeconds: langGraphResult.durationSeconds,
            metadata: langGraphResult.metadata,
            error: langGraphResult.error
        };
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.outputChannel.dispose();
    }
}
