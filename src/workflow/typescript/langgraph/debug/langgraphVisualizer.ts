/**
 * LangGraph Workflow Visualizer
 * 
 * This module provides visualization and debugging capabilities for LangGraph workflows.
 * It can generate Mermaid diagrams, track execution paths, and provide detailed debugging information.
 */

import * as vscode from 'vscode';
import { WorkflowState, WorkflowResult, NodeType } from '../types';
import { LangGraphWorkflowEngine } from '../langgraphWorkflowEngine';

export interface LangGraphNodeInfo {
    id: string;
    type: NodeType;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    executionTime?: number;
    error?: string;
    input?: any;
    output?: any;
    metadata?: Record<string, any>;
    nextNodes?: string[];
}

export interface LangGraphWorkflowGraph {
    nodes: LangGraphNodeInfo[];
    edges: Array<{ from: string; to: string; condition?: string }>;
    executionPath: string[];
    currentState: WorkflowState;
    graphStructure: any;
}

export class LangGraphVisualizer {
    private outputChannel: vscode.OutputChannel;
    private webviewPanel: vscode.WebviewPanel | undefined;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('LangGraph Visualizer');
    }

    /**
     * Generate a Mermaid diagram for the LangGraph workflow
     */
    generateMermaidDiagram(graph: LangGraphWorkflowGraph): string {
        let mermaid = 'graph TD\n';
        
        // Add nodes with status styling
        for (const node of graph.nodes) {
            const nodeId = this.sanitizeNodeId(node.id);
            const statusClass = this.getStatusClass(node.status);
            const label = `${node.id}\\n(${node.type})`;
            
            mermaid += `    ${nodeId}["${label}"]:::${statusClass}\n`;
        }

        // Add edges
        for (const edge of graph.edges) {
            const fromId = this.sanitizeNodeId(edge.from);
            const toId = this.sanitizeNodeId(edge.to);
            const condition = edge.condition ? `|${edge.condition}|` : '';
            
            mermaid += `    ${fromId} -->${condition} ${toId}\n`;
        }

        // Add execution path highlighting
        if (graph.executionPath.length > 0) {
            mermaid += '\n    classDef executed fill:#e1f5fe,stroke:#01579b,stroke-width:2px\n';
            mermaid += '    classDef current fill:#fff3e0,stroke:#e65100,stroke-width:3px\n';
            mermaid += '    classDef failed fill:#ffebee,stroke:#c62828,stroke-width:2px\n';
            mermaid += '    classDef pending fill:#f3e5f5,stroke:#4a148c,stroke-width:1px\n';
        }

        return mermaid;
    }

    /**
     * Create a webview panel to display the LangGraph workflow visualization
     */
    createVisualizationPanel(graph: LangGraphWorkflowGraph): void {
        if (this.webviewPanel) {
            this.webviewPanel.reveal();
            return;
        }

        this.webviewPanel = vscode.window.createWebviewPanel(
            'langgraphVisualizer',
            'LangGraph Workflow Visualization',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        const mermaidDiagram = this.generateMermaidDiagram(graph);
        const html = this.generateWebviewHTML(mermaidDiagram, graph);

        this.webviewPanel.webview.html = html;

        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = undefined;
        });
    }

    /**
     * Generate HTML for the webview panel with LangGraph-specific features
     */
    private generateWebviewHTML(mermaidDiagram: string, graph: LangGraphWorkflowGraph): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LangGraph Workflow Visualization</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            display: flex;
            gap: 20px;
            height: calc(100vh - 40px);
        }
        .diagram-container {
            flex: 1;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 10px;
            background-color: var(--vscode-editor-background);
        }
        .info-panel {
            width: 350px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 10px;
            background-color: var(--vscode-sideBar-background);
            overflow-y: auto;
        }
        .node-info {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            background-color: var(--vscode-editor-background);
        }
        .node-info h4 {
            margin: 0 0 5px 0;
            color: var(--vscode-textLink-foreground);
        }
        .status {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
        .status.completed { background-color: #4caf50; color: white; }
        .status.running { background-color: #ff9800; color: white; }
        .status.failed { background-color: #f44336; color: white; }
        .status.pending { background-color: #9c27b0; color: white; }
        .execution-path {
            margin-top: 20px;
            padding: 10px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            background-color: var(--vscode-editor-background);
        }
        .execution-path h4 {
            margin: 0 0 10px 0;
        }
        .path-step {
            display: inline-block;
            margin: 2px;
            padding: 4px 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 3px;
            font-size: 12px;
        }
        .graph-structure {
            margin-top: 20px;
            padding: 10px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            background-color: var(--vscode-editor-background);
        }
        .graph-structure h4 {
            margin: 0 0 10px 0;
        }
        pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
        }
        .langgraph-badge {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="diagram-container">
            <div class="langgraph-badge">LangGraph StateGraph</div>
            <h3>Workflow Graph</h3>
            <div id="mermaid-diagram"></div>
        </div>
        <div class="info-panel">
            <h3>Node Details</h3>
            <div id="node-details"></div>
            <div class="execution-path">
                <h4>Execution Path</h4>
                <div id="execution-path"></div>
            </div>
            <div class="graph-structure">
                <h4>Graph Structure</h4>
                <div id="graph-structure"></div>
            </div>
        </div>
    </div>

    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'dark',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        });

        const mermaidDiagram = \`${mermaidDiagram}\`;
        const graphData = ${JSON.stringify(graph, null, 2)};

        // Render the diagram
        document.getElementById('mermaid-diagram').innerHTML = mermaidDiagram;
        mermaid.init(undefined, document.getElementById('mermaid-diagram'));

        // Populate node details
        const nodeDetailsContainer = document.getElementById('node-details');
        graphData.nodes.forEach(node => {
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'node-info';
            nodeDiv.innerHTML = \`
                <h4>\${node.id}</h4>
                <div class="status \${node.status}">\${node.status}</div>
                <p><strong>Type:</strong> \${node.type}</p>
                <p><strong>Description:</strong> \${node.description || 'N/A'}</p>
                \${node.executionTime ? \`<p><strong>Execution Time:</strong> \${node.executionTime}ms</p>\` : ''}
                \${node.error ? \`<p><strong>Error:</strong> \${node.error}</p>\` : ''}
                \${node.nextNodes ? \`<p><strong>Next Nodes:</strong> \${node.nextNodes.join(', ')}</p>\` : ''}
                \${node.metadata ? \`<pre>\${JSON.stringify(node.metadata, null, 2)}</pre>\` : ''}
            \`;
            nodeDetailsContainer.appendChild(nodeDiv);
        });

        // Populate execution path
        const pathContainer = document.getElementById('execution-path');
        graphData.executionPath.forEach(step => {
            const stepDiv = document.createElement('span');
            stepDiv.className = 'path-step';
            stepDiv.textContent = step;
            pathContainer.appendChild(stepDiv);
        });

        // Populate graph structure
        const structureContainer = document.getElementById('graph-structure');
        structureContainer.innerHTML = \`
            <p><strong>Nodes:</strong> \${graphData.graphStructure.nodes.join(', ')}</p>
            <p><strong>Edges:</strong> \${graphData.graphStructure.edges.length}</p>
            <p><strong>Config:</strong> \${graphData.graphStructure.config.workflowName}</p>
        \`;
    </script>
</body>
</html>`;
    }

    /**
     * Log detailed LangGraph workflow execution information
     */
    logWorkflowExecution(state: WorkflowState, result?: WorkflowResult): void {
        this.outputChannel.clear();
        this.outputChannel.appendLine('🔍 LangGraph Workflow Execution Debug Information');
        this.outputChannel.appendLine('='.repeat(60));

        // Basic workflow info
        this.outputChannel.appendLine(`Workflow ID: ${state.workflowId}`);
        this.outputChannel.appendLine(`Session ID: ${state.sessionId}`);
        this.outputChannel.appendLine(`Status: ${state.status}`);
        this.outputChannel.appendLine(`Created: ${state.createdAt.toISOString()}`);
        this.outputChannel.appendLine(`Updated: ${state.updatedAt.toISOString()}`);
        this.outputChannel.appendLine('');

        // LangGraph-specific information
        this.outputChannel.appendLine('🔄 LangGraph Execution Path:');
        state.executionPath.forEach((nodeId, index) => {
            this.outputChannel.appendLine(`  ${index + 1}. ${nodeId}`);
        });
        this.outputChannel.appendLine('');

        // Current node info
        if (state.currentNode) {
            this.outputChannel.appendLine(`🎯 Current Node: ${state.currentNode}`);
        }
        if (state.previousNode) {
            this.outputChannel.appendLine(`⬅️ Previous Node: ${state.previousNode}`);
        }
        this.outputChannel.appendLine('');

        // State channels information
        this.outputChannel.appendLine('📊 State Channels:');
        this.outputChannel.appendLine(`  Messages: ${state.messages.length}`);
        this.outputChannel.appendLine(`  Available Tools: ${state.availableTools.length}`);
        this.outputChannel.appendLine(`  Pending Tool Calls: ${state.pendingToolCalls.length}`);
        this.outputChannel.appendLine(`  Tool Results: ${Object.keys(state.toolResults).length}`);
        this.outputChannel.appendLine(`  MCP Servers: ${state.mcpServers.length}`);
        this.outputChannel.appendLine('');

        // Context information
        if (Object.keys(state.context).length > 0) {
            this.outputChannel.appendLine('📝 Context:');
            this.outputChannel.appendLine(JSON.stringify(state.context, null, 2));
            this.outputChannel.appendLine('');
        }

        // Intermediate results
        this.outputChannel.appendLine('📋 Intermediate Results:');
        Object.entries(state.intermediateResults).forEach(([nodeId, result]) => {
            this.outputChannel.appendLine(`  ${nodeId}:`);
            this.outputChannel.appendLine(`    Success: ${result.success}`);
            if (result.executionTime) {
                this.outputChannel.appendLine(`    Execution Time: ${result.executionTime}ms`);
            }
            if (result.error) {
                this.outputChannel.appendLine(`    Error: ${result.error}`);
            }
            if (result.output) {
                this.outputChannel.appendLine(`    Output: ${JSON.stringify(result.output, null, 2)}`);
            }
        });
        this.outputChannel.appendLine('');

        // Tool results
        if (Object.keys(state.toolResults).length > 0) {
            this.outputChannel.appendLine('🔧 Tool Results:');
            Object.entries(state.toolResults).forEach(([callId, result]) => {
                this.outputChannel.appendLine(`  ${callId}: ${JSON.stringify(result, null, 2)}`);
            });
            this.outputChannel.appendLine('');
        }

        // Human-in-the-loop information
        if (state.requiresHumanInput) {
            this.outputChannel.appendLine('👤 Human Input Required:');
            this.outputChannel.appendLine(`  Input: ${state.humanInput || 'Pending'}`);
            this.outputChannel.appendLine('');
        }

        // Error information
        if (state.error) {
            this.outputChannel.appendLine('❌ Error:');
            this.outputChannel.appendLine(state.error);
            this.outputChannel.appendLine('');
        }

        // Final result
        if (result) {
            this.outputChannel.appendLine('🏁 Final Result:');
            this.outputChannel.appendLine(`  Status: ${result.status}`);
            this.outputChannel.appendLine(`  Duration: ${result.durationSeconds}s`);
            if (result.error) {
                this.outputChannel.appendLine(`  Error: ${result.error}`);
            }
            this.outputChannel.appendLine('');
        }

        this.outputChannel.show();
    }

    /**
     * Create a workflow graph from LangGraph engine and current state
     */
    createWorkflowGraph(engine: LangGraphWorkflowEngine, state: WorkflowState): LangGraphWorkflowGraph {
        const nodeInfos: LangGraphNodeInfo[] = [];
        const edges: Array<{ from: string; to: string; condition?: string }> = [];
        const graphStructure = engine.getGraphStructure();

        // Convert nodes to NodeInfo
        for (const nodeId of graphStructure.nodes) {
            const result = state.intermediateResults[nodeId];
            const status = this.determineNodeStatus(nodeId, state, result);
            
            nodeInfos.push({
                id: nodeId,
                type: this.getNodeType(nodeId),
                description: this.getNodeDescription(nodeId),
                status,
                executionTime: result?.executionTime,
                error: result?.error,
                input: state.inputData,
                output: result?.output,
                metadata: result?.metadata,
                nextNodes: result?.nextNodes
            });
        }

        // Create edges from graph structure
        for (const edge of graphStructure.edges) {
            edges.push({
                from: edge.from,
                to: edge.to,
                condition: edge.condition
            });
        }

        return {
            nodes: nodeInfos,
            edges,
            executionPath: state.executionPath,
            currentState: state,
            graphStructure
        };
    }

    /**
     * Determine node status based on execution state
     */
    private determineNodeStatus(nodeId: string, state: WorkflowState, result?: any): LangGraphNodeInfo['status'] {
        if (state.currentNode === nodeId) {
            return 'running';
        }
        
        if (state.executionPath.includes(nodeId)) {
            if (result?.error) {
                return 'failed';
            }
            return 'completed';
        }
        
        return 'pending';
    }

    /**
     * Get node type based on node ID
     */
    private getNodeType(nodeId: string): NodeType {
        if (nodeId === 'start') return NodeType.START;
        if (nodeId === 'end') return NodeType.END;
        if (nodeId === 'assistant' || nodeId.includes('orchestration') || nodeId.includes('generation')) return NodeType.ASSISTANT;
        if (nodeId === 'tool' || nodeId.includes('write')) return NodeType.TOOL;
        if (nodeId === 'conditional' || nodeId === 'validation') return NodeType.CONDITIONAL;
        return NodeType.ASSISTANT;
    }

    /**
     * Get node description based on node ID
     */
    private getNodeDescription(nodeId: string): string {
        const descriptions: Record<string, string> = {
            'start': 'Initialize workflow state',
            'end': 'Finalize workflow and return results',
            'assistant': 'Process user input and determine actions',
            'tool': 'Execute tool calls',
            'conditional': 'Route to next node based on state',
            'design_orchestration': 'Analyze user prompt and generate design requirements',
            'requirements_generation': 'Generate detailed project requirements and specifications',
            'file_write': 'Write generated files to project structure',
            'validation': 'Validate generated design and requirements'
        };
        
        return descriptions[nodeId] || `Process ${nodeId}`;
    }

    /**
     * Get CSS class for node status
     */
    private getStatusClass(status: LangGraphNodeInfo['status']): string {
        switch (status) {
            case 'completed': return 'completed';
            case 'running': return 'running';
            case 'failed': return 'failed';
            case 'pending': return 'pending';
            default: return 'pending';
        }
    }

    /**
     * Sanitize node ID for Mermaid
     */
    private sanitizeNodeId(nodeId: string): string {
        return nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    /**
     * Show the output channel
     */
    showOutput(): void {
        this.outputChannel.show();
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.outputChannel.dispose();
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
        }
    }
}
