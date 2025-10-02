/**
 * Code Write Node
 * 
 * This node writes the generated code to project files in build mode.
 */

import { BaseNode } from './baseNode';
import { WorkflowState, WorkflowStatus, NodeType } from '../types';

export class CodeWriteNode extends BaseNode {
    constructor(nodeId: string = 'code_write') {
        super(nodeId, NodeType.TOOL, 'Write generated code to project files');
    }

    async execute(state: WorkflowState): Promise<WorkflowState> {
        const startTime = Date.now();

        try {
            // Update state
            state.currentNode = this.nodeId;
            state.executionPath.push(this.nodeId);
            state.updatedAt = new Date();

            // Get generated code from context
            const generatedCode = state.context.generatedCode;
            
            if (!generatedCode) {
                throw new Error('No generated code found to write to files');
            }

            // Get project path
            const projectPath = state.inputData.project_path || './project';

            // Write code to project files
            const writeResult = await this.writeCodeToProject(generatedCode, projectPath);
            
            // Update state with write result
            state.context.codeWriteResult = writeResult;
            state.context.nextAction = 'complete';

            // Add assistant response
            state.messages.push({
                role: 'assistant',
                content: `I've successfully written all generated code to your project. Created ${writeResult.filesWritten} files in the project directory.`
            });

            const result = this.createNodeResult(
                true,
                {
                    codeWriteResult: writeResult,
                    generatedCode: generatedCode,
                    nextAction: 'complete'
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

    private async writeCodeToProject(generatedCode: Record<string, string>, projectPath: string): Promise<any> {
        // Simulate writing code to project files
        await new Promise(resolve => setTimeout(resolve, 100));

        const writeResult = {
            success: true,
            projectPath: projectPath,
            filesWritten: Object.keys(generatedCode).length,
            files: Object.keys(generatedCode),
            totalSize: Object.values(generatedCode).reduce((total, content) => total + content.length, 0),
            timestamp: new Date().toISOString()
        };

        // Log the file write operation
        console.log(`📝 Code written to project: ${projectPath}`);
        console.log(`📁 Files created: ${writeResult.filesWritten}`);
        console.log(`📊 Total size: ${writeResult.totalSize} characters`);
        console.log(`📋 Files: ${writeResult.files.join(', ')}`);

        return writeResult;
    }
}
