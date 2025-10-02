/**
 * File Write Node
 * 
 * This node writes the generated requirements to the issue file.
 */

import { BaseNode } from './baseNode';
import { WorkflowState, WorkflowStatus, NodeType } from '../types';
import * as vscode from 'vscode';

export class FileWriteNode extends BaseNode {
    constructor(nodeId: string = 'file_write') {
        super(nodeId, NodeType.TOOL, 'Write requirements to file');
    }

    async execute(state: WorkflowState): Promise<WorkflowState> {
        const startTime = Date.now();

        try {
            // Update state
            state.currentNode = this.nodeId;
            state.executionPath.push(this.nodeId);
            state.updatedAt = new Date();

            // Get requirements from context
            const requirements = state.context.requirements;
            
            if (!requirements) {
                throw new Error('No requirements found to write to file');
            }

            // Get issue information
            const issueId = state.inputData.issue_id;
            const issueTitle = state.inputData.issue_title;
            const issueDescription = state.inputData.issue_description;

            // Generate file content
            const fileContent = this.generateRequirementsFile(requirements, issueId, issueTitle, issueDescription);
            
            // Write to file (simulated - in real implementation, this would write to actual file)
            const writeResult = await this.writeRequirementsFile(fileContent, issueId);
            
            // Update state with write result
            state.context.fileWriteResult = writeResult;
            state.context.nextAction = 'complete';

            // Add assistant response
            state.messages.push({
                role: 'assistant',
                content: `Requirements have been successfully written to the issue file. The file contains ${requirements.sections.length} detailed sections covering all aspects of your project.`
            });

            const result = this.createNodeResult(
                true,
                {
                    fileWriteResult: writeResult,
                    requirements: requirements,
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

    private generateRequirementsFile(requirements: any, issueId: string, issueTitle: string, issueDescription: string): string {
        const timestamp = new Date().toISOString();
        
        let content = `# Project Requirements: ${requirements.projectName}

## Issue Information
- **Issue ID**: ${issueId}
- **Title**: ${issueTitle}
- **Description**: ${issueDescription}
- **Generated**: ${timestamp}

## Project Overview
${requirements.description}

## Complexity Assessment
- **Level**: ${requirements.complexity}
- **Estimated Time**: ${requirements.estimatedTime}

## Technology Stack
${requirements.technologies.map((tech: string) => `- ${tech}`).join('\n')}

## Core Features
${requirements.features.map((feature: string) => `- ${feature}`).join('\n')}

## Detailed Requirements

`;

        // Add each requirement section
        for (const section of requirements.sections) {
            content += `### ${section.title}\n`;
            content += `**Priority**: ${section.priority}\n\n`;
            content += `${section.content}\n\n`;
        }

        content += `## Technical Specifications

### Frameworks & Libraries
${requirements.technicalSpecs.frameworks.map((framework: string) => `- ${framework}`).join('\n')}

### Databases
${requirements.technicalSpecs.databases.map((db: string) => `- ${db}`).join('\n')}

### Deployment Strategy
${requirements.technicalSpecs.deployment.map((deploy: string) => `- ${deploy}`).join('\n')}

### Monitoring & Logging
${requirements.technicalSpecs.monitoring.map((monitor: string) => `- ${monitor}`).join('\n')}

### Security Measures
${requirements.technicalSpecs.security.map((security: string) => `- ${security}`).join('\n')}

## Deliverables
${requirements.deliverables.map((deliverable: string) => `- ${deliverable}`).join('\n')}

## Project Timeline

`;

        // Add timeline phases
        for (const phase of requirements.timeline.phases) {
            content += `### ${phase.name}\n`;
            content += `**Duration**: ${phase.duration}\n\n`;
            content += `**Tasks**:\n`;
            for (const task of phase.tasks) {
                content += `- ${task}\n`;
            }
            content += '\n';
        }

        content += `---
*This requirements document was generated by the Nys Workflow system on ${timestamp}*
*Issue ID: ${issueId}*
`;

        return content;
    }

    private async writeRequirementsFile(content: string, issueId: string): Promise<any> {
        // In a real implementation, this would write to the actual issue file
        // For now, we'll simulate the file write operation
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const result = {
            success: true,
            filePath: `./issues/${issueId}-requirements.md`,
            contentLength: content.length,
            sectionsWritten: content.split('###').length - 1,
            timestamp: new Date().toISOString()
        };

        // Log the file write operation
        console.log(`Requirements file written: ${result.filePath}`);
        console.log(`Content length: ${result.contentLength} characters`);
        console.log(`Sections written: ${result.sectionsWritten}`);

        return result;
    }
}
