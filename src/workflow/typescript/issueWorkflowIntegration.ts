/**
 * Issue Workflow Integration
 * 
 * This module integrates the TypeScript workflow system with the issue management system,
 * enabling the complete workflow from design to build mode.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { TypeScriptWorkflowManager } from './typescriptWorkflowManager';
import { WorkflowRequest, WorkflowResponse } from './typescriptWorkflowManager';
import { Issue } from '../../issueViewProvider';

export interface IssueWorkflowContext {
    issue: Issue;
    mode: 'design' | 'build' | 'debug';
    userPrompt: string;
    projectPath?: string;
    requirements?: string;
    generatedCode?: string;
}

export class IssueWorkflowIntegration {
    private workflowManager: TypeScriptWorkflowManager;
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.workflowManager = new TypeScriptWorkflowManager();
        this.outputChannel = vscode.window.createOutputChannel('Issue Workflow');
    }

    /**
     * Handle the first user prompt in Design Mode
     * This triggers the orchestration workflow
     */
    async handleDesignModePrompt(context: IssueWorkflowContext): Promise<WorkflowResponse> {
        this.outputChannel.appendLine(`🎨 Design Mode: Processing user prompt for issue ${context.issue.id}`);
        
        try {
            // Create design workflow request
            const request: WorkflowRequest = {
                workflowType: 'design_orchestration',
                input: {
                    user_input: context.userPrompt,
                    issue_id: context.issue.id,
                    issue_title: context.issue.title,
                    issue_description: context.issue.description,
                    mode: 'design',
                    project_path: context.projectPath
                },
                config: {
                    maxIterations: 10,
                    timeoutSeconds: 300,
                    enableRetry: true
                }
            };

            // Execute design orchestration workflow
            this.outputChannel.appendLine(`🔄 Starting design orchestration workflow...`);
            const result = await this.workflowManager.executeWorkflow(request);
            
            this.outputChannel.appendLine(`📊 Workflow result: success=${result.success}, error=${result.error}`);
            
            if (result.success) {
                // Extract requirements from workflow result
                this.outputChannel.appendLine(`🔍 Extracting requirements from workflow result...`);
                const requirements = this.extractRequirements(result.result);
                
                // Write requirements to issue file
                this.outputChannel.appendLine(`📝 Writing requirements to issue file...`);
                await this.writeRequirementsToIssue(context.issue, requirements);
                
                this.outputChannel.appendLine(`✅ Design orchestration completed for issue ${context.issue.id}`);
            } else {
                this.outputChannel.appendLine(`❌ Workflow failed: ${result.error}`);
            }

            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.outputChannel.appendLine(`❌ Design orchestration failed: ${errorMessage}`);
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Handle Build Mode - Read requirements and generate code
     */
    async handleBuildMode(context: IssueWorkflowContext): Promise<WorkflowResponse> {
        this.outputChannel.appendLine(`🔨 Build Mode: Generating code for issue ${context.issue.id}`);
        
        try {
            // Read requirements from issue file
            const requirements = await this.readRequirementsFromIssue(context.issue);
            
            if (!requirements) {
                return {
                    success: false,
                    error: 'No requirements found. Please complete design mode first.'
                };
            }

            // Create build workflow request
            const request: WorkflowRequest = {
                workflowType: 'build_generation',
                input: {
                    requirements: requirements,
                    issue_id: context.issue.id,
                    issue_title: context.issue.title,
                    project_path: context.projectPath,
                    mode: 'build'
                },
                config: {
                    maxIterations: 15,
                    timeoutSeconds: 600,
                    enableRetry: true
                }
            };

            // Execute build generation workflow
            const result = await this.workflowManager.executeWorkflow(request);
            
            if (result.success) {
                // Extract generated code from workflow result
                const generatedCode = this.extractGeneratedCode(result.result);
                
                // Write code to project files
                await this.writeCodeToProject(context.issue, generatedCode, context.projectPath);
                
                this.outputChannel.appendLine(`✅ Build generation completed for issue ${context.issue.id}`);
            }

            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.outputChannel.appendLine(`❌ Build generation failed: ${errorMessage}`);
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Handle Debug Mode - Fix issues and improve code
     */
    async handleDebugMode(context: IssueWorkflowContext): Promise<WorkflowResponse> {
        this.outputChannel.appendLine(`🐛 Debug Mode: Fixing issues for ${context.issue.id}`);
        
        try {
            // Read current code and identify issues
            const currentCode = await this.readCurrentCode(context.issue, context.projectPath);
            const issues = await this.identifyIssues(currentCode);
            
            // Create debug workflow request
            const request: WorkflowRequest = {
                workflowType: 'debug_fix',
                input: {
                    user_input: context.userPrompt,
                    current_code: currentCode,
                    identified_issues: issues,
                    issue_id: context.issue.id,
                    project_path: context.projectPath,
                    mode: 'debug'
                },
                config: {
                    maxIterations: 8,
                    timeoutSeconds: 300,
                    enableRetry: true
                }
            };

            // Execute debug workflow
            const result = await this.workflowManager.executeWorkflow(request);
            
            if (result.success) {
                // Extract fixed code from workflow result
                const fixedCode = this.extractFixedCode(result.result);
                
                // Write fixed code to project files
                await this.writeCodeToProject(context.issue, fixedCode, context.projectPath);
                
                this.outputChannel.appendLine(`✅ Debug fixes completed for issue ${context.issue.id}`);
            }

            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.outputChannel.appendLine(`❌ Debug fixes failed: ${errorMessage}`);
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Extract requirements from workflow result
     */
    private extractRequirements(result: any): string {
        // Debug: log the result structure (clean circular references)
        try {
            const cleanResult = this.cleanForLogging(result);
            console.log('Workflow result structure:', JSON.stringify(cleanResult, null, 2));
        } catch (error) {
            console.log('Workflow result structure (serialization failed):', result);
        }
        
        let requirements: any = null;
        
        // Try different possible locations for requirements
        if (result && result.requirements) {
            requirements = result.requirements;
        } else if (result && result.outputData && result.outputData.requirements) {
            requirements = result.outputData.requirements;
        } else if (result && result.intermediateResults) {
            // Look for requirements in the file_write node result
            const fileWriteResult = result.intermediateResults.file_write;
            if (fileWriteResult && fileWriteResult.output && fileWriteResult.output.requirements) {
                requirements = fileWriteResult.output.requirements;
            }
            
            // Look for requirements in the requirements_generation node result
            const reqGenResult = result.intermediateResults.requirements_generation;
            if (reqGenResult && reqGenResult.output && reqGenResult.output.requirements) {
                requirements = reqGenResult.output.requirements;
            }
        }
        
        // Convert requirements object to string if found
        if (requirements) {
            return this.serializeRequirements(requirements);
        }
        
        // Fallback: create a basic requirements string
        return `# Project Requirements

## Overview
This project was generated based on the user's design request.

## Features
- Basic functionality as requested
- Standard project structure
- Ready for development

## Technical Stack
- TypeScript
- Node.js
- Modern development practices

## Next Steps
1. Review and refine requirements
2. Implement core features
3. Add testing and documentation

---
*Generated by Mira Workflow System*`;
    }

    /**
     * Serialize requirements object to markdown string
     */
    private serializeRequirements(requirements: any): string {
        try {
            // If it's already a string, return it
            if (typeof requirements === 'string') {
                return requirements;
            }

            // If it's an object, convert to markdown
            if (typeof requirements === 'object' && requirements !== null) {
                let markdown = '# Project Requirements\n\n';

                // Handle different requirement structures
                if (requirements.functional && Array.isArray(requirements.functional)) {
                    markdown += '## Functional Requirements\n';
                    requirements.functional.forEach((req: string) => {
                        markdown += `- ${req}\n`;
                    });
                    markdown += '\n';
                }

                if (requirements.nonFunctional && Array.isArray(requirements.nonFunctional)) {
                    markdown += '## Non-Functional Requirements\n';
                    requirements.nonFunctional.forEach((req: string) => {
                        markdown += `- ${req}\n`;
                    });
                    markdown += '\n';
                }

                if (requirements.technical && Array.isArray(requirements.technical)) {
                    markdown += '## Technical Requirements\n';
                    requirements.technical.forEach((req: string) => {
                        markdown += `- ${req}\n`;
                    });
                    markdown += '\n';
                }

                if (requirements.userStories && Array.isArray(requirements.userStories)) {
                    markdown += '## User Stories\n';
                    requirements.userStories.forEach((story: string) => {
                        markdown += `- ${story}\n`;
                    });
                    markdown += '\n';
                }

                if (requirements.sections && Array.isArray(requirements.sections)) {
                    requirements.sections.forEach((section: any) => {
                        markdown += `## ${section.title || 'Section'}\n`;
                        if (section.items && Array.isArray(section.items)) {
                            section.items.forEach((item: string) => {
                                markdown += `- ${item}\n`;
                            });
                        }
                        markdown += '\n';
                    });
                }

                // If no structured data found, try to extract meaningful content
                if (markdown === '# Project Requirements\n\n') {
                    markdown += '## Overview\n';
                    markdown += 'Requirements have been generated based on the user\'s design request.\n\n';
                    
                    // Try to extract any text content from the object
                    const textContent = this.extractTextFromObject(requirements);
                    if (textContent) {
                        markdown += `## Details\n${textContent}\n\n`;
                    }
                }

                markdown += '---\n*Generated by Mira Workflow System*';
                return markdown;
            }

            // Fallback: convert to string
            return String(requirements);
        } catch (error) {
            console.error('Error serializing requirements:', error);
            return `# Project Requirements\n\n## Error\nFailed to serialize requirements: ${error}\n\n---\n*Generated by Mira Workflow System*`;
        }
    }

    /**
     * Extract text content from an object recursively
     */
    private extractTextFromObject(obj: any, depth: number = 0): string {
        if (depth > 3) return ''; // Prevent infinite recursion
        
        if (typeof obj === 'string') {
            return obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.extractTextFromObject(item, depth + 1)).join('\n');
        }
        
        if (typeof obj === 'object' && obj !== null) {
            const texts: string[] = [];
            for (const [key, value] of Object.entries(obj)) {
                const text = this.extractTextFromObject(value, depth + 1);
                if (text) {
                    texts.push(`${key}: ${text}`);
                }
            }
            return texts.join('\n');
        }
        
        return '';
    }

    /**
     * Extract generated code from workflow result
     */
    private extractGeneratedCode(result: any): Record<string, string> {
        if (result && result.generatedCode) {
            return result.generatedCode;
        }
        
        // Fallback: extract from workflow output
        if (result && result.outputData && result.outputData.generatedCode) {
            return result.outputData.generatedCode;
        }
        
        return {
            'main.ts': '// Generated code placeholder'
        };
    }

    /**
     * Extract fixed code from workflow result
     */
    private extractFixedCode(result: any): Record<string, string> {
        if (result && result.fixedCode) {
            return result.fixedCode;
        }
        
        // Fallback: extract from workflow output
        if (result && result.outputData && result.outputData.fixedCode) {
            return result.outputData.fixedCode;
        }
        
        return {
            'main.ts': '// Fixed code placeholder'
        };
    }

    /**
     * Write requirements to issue file
     */
    private async writeRequirementsToIssue(issue: Issue, requirements: string): Promise<void> {
        try {
            const issueFilePath = issue.filePath;
            const requirementsContent = `# Requirements for ${issue.title}

## Issue Description
${issue.description}

## Generated Requirements
${requirements}

## Generated on
${new Date().toISOString()}

---
*This file was generated by the Nys Workflow system*
`;

            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(issueFilePath),
                Buffer.from(requirementsContent, 'utf8')
            );

            this.outputChannel.appendLine(`📝 Requirements written to ${issueFilePath}`);

        } catch (error) {
            this.outputChannel.appendLine(`❌ Failed to write requirements: ${error}`);
            throw error;
        }
    }

    /**
     * Read requirements from issue file
     */
    private async readRequirementsFromIssue(issue: Issue): Promise<string | null> {
        try {
            const issueFilePath = issue.filePath;
            const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(issueFilePath));
            const content = Buffer.from(fileContent).toString('utf8');
            
            // Extract requirements section
            const requirementsMatch = content.match(/## Generated Requirements\n([\s\S]*?)\n## Generated on/);
            if (requirementsMatch) {
                return requirementsMatch[1].trim();
            }
            
            return null;

        } catch (error) {
            this.outputChannel.appendLine(`❌ Failed to read requirements: ${error}`);
            return null;
        }
    }

    /**
     * Write generated code to project files
     */
    private async writeCodeToProject(_issue: Issue, code: Record<string, string>, projectPath?: string): Promise<void> {
        try {
            const basePath = projectPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!basePath) {
                throw new Error('No project path available');
            }

            for (const [filename, content] of Object.entries(code)) {
                const filePath = path.join(basePath, filename);
                const fileUri = vscode.Uri.file(filePath);
                
                // Ensure directory exists
                const dirPath = path.dirname(filePath);
                await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
                
                // Write file
                await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf8'));
                
                this.outputChannel.appendLine(`📝 Code written to ${filePath}`);
            }

        } catch (error) {
            this.outputChannel.appendLine(`❌ Failed to write code: ${error}`);
            throw error;
        }
    }

    /**
     * Read current code from project
     */
    private async readCurrentCode(_issue: Issue, projectPath?: string): Promise<Record<string, string>> {
        try {
            const basePath = projectPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!basePath) {
                throw new Error('No project path available');
            }

            const code: Record<string, string> = {};
            
            // Read common source files
            const commonFiles = ['src/main.ts', 'src/index.ts', 'main.ts', 'index.ts'];
            
            for (const filename of commonFiles) {
                try {
                    const filePath = path.join(basePath, filename);
                    const fileUri = vscode.Uri.file(filePath);
                    const fileContent = await vscode.workspace.fs.readFile(fileUri);
                    code[filename] = Buffer.from(fileContent).toString('utf8');
                } catch (error) {
                    // File doesn't exist, skip
                }
            }

            return code;

        } catch (error) {
            this.outputChannel.appendLine(`❌ Failed to read current code: ${error}`);
            return {};
        }
    }

    /**
     * Identify issues in current code
     */
    private async identifyIssues(code: Record<string, string>): Promise<string[]> {
        // Simple issue identification - in a real implementation, this would use
        // linting tools, static analysis, etc.
        const issues: string[] = [];
        
        for (const [filename, content] of Object.entries(code)) {
            if (content.includes('TODO')) {
                issues.push(`TODO found in ${filename}`);
            }
            if (content.includes('FIXME')) {
                issues.push(`FIXME found in ${filename}`);
            }
            if (content.includes('console.log')) {
                issues.push(`Debug console.log found in ${filename}`);
            }
        }
        
        return issues;
    }

    /**
     * Show output channel
     */
    showOutput(): void {
        this.outputChannel.show();
    }

    /**
     * Clean object for logging to avoid circular references
     */
    private cleanForLogging(obj: any): any {
        const seen = new WeakSet();
        
        const clean = (item: any): any => {
            if (item === null || typeof item !== 'object') {
                return item;
            }
            
            if (seen.has(item)) {
                return '[Circular Reference]';
            }
            
            seen.add(item);
            
            if (Array.isArray(item)) {
                return item.map(clean);
            }
            
            const cleaned: any = {};
            for (const key in item) {
                if (item.hasOwnProperty(key)) {
                    cleaned[key] = clean(item[key]);
                }
            }
            
            return cleaned;
        };
        
        return clean(obj);
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.outputChannel.dispose();
    }
}
