/**
 * Requirements Generation Node
 * 
 * This node generates detailed project requirements based on the design analysis.
 */

import { BaseNode } from './baseNode';
import { WorkflowState, WorkflowStatus, NodeType } from '../types';

export class RequirementsGenerationNode extends BaseNode {
    constructor(nodeId: string = 'requirements_generation') {
        super(nodeId, NodeType.ASSISTANT, 'Requirements generation');
    }

    async execute(state: WorkflowState): Promise<WorkflowState> {
        const startTime = Date.now();

        try {
            // Update state
            state.currentNode = this.nodeId;
            state.executionPath.push(this.nodeId);
            state.updatedAt = new Date();

            // Get design analysis from previous node
            const designAnalysis = state.context.designAnalysis;
            
            if (!designAnalysis) {
                throw new Error('No design analysis found for requirements generation');
            }

            // Generate detailed requirements
            const requirements = await this.generateDetailedRequirements(designAnalysis);
            
            // Update state with requirements
            state.context.requirements = requirements;
            state.context.nextAction = 'write_requirements';

            // Add assistant response
            state.messages.push({
                role: 'assistant',
                content: `I've generated detailed requirements for your project. The requirements include ${requirements.sections.length} main sections covering all aspects of the implementation.`
            });

            const result = this.createNodeResult(
                true,
                {
                    requirements: requirements,
                    nextAction: 'write_requirements'
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

    private async generateDetailedRequirements(designAnalysis: any): Promise<any> {
        // Simulate requirements generation - in a real implementation, this would use LLM
        await new Promise(resolve => setTimeout(resolve, 150));

        const requirements = {
            projectName: this.generateProjectName(designAnalysis.summary),
            description: designAnalysis.summary,
            complexity: designAnalysis.complexity,
            estimatedTime: designAnalysis.estimatedTime,
            technologies: designAnalysis.technologies,
            features: designAnalysis.features,
            sections: this.generateRequirementSections(designAnalysis),
            technicalSpecs: this.generateTechnicalSpecs(designAnalysis),
            deliverables: this.generateDeliverables(designAnalysis),
            timeline: this.generateTimeline(designAnalysis)
        };

        return requirements;
    }

    private generateProjectName(summary: string): string {
        // Generate a project name based on the summary
        const words = summary.toLowerCase().split(' ');
        const keyWords = words.filter(word => 
            !['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word)
        );
        
        if (keyWords.length > 0) {
            return keyWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        
        return 'New Project';
    }

    private generateRequirementSections(designAnalysis: any): any[] {
        const sections = [
            {
                title: 'Project Overview',
                content: `This project involves building ${designAnalysis.summary.toLowerCase()}. The application will provide ${designAnalysis.features.join(', ').toLowerCase()}.`,
                priority: 'high'
            },
            {
                title: 'Technical Architecture',
                content: `The application will be built using ${designAnalysis.technologies.join(', ')}. The architecture will follow modern software development practices with proper separation of concerns.`,
                priority: 'high'
            },
            {
                title: 'Core Features',
                content: this.generateFeatureDetails(designAnalysis.features),
                priority: 'high'
            },
            {
                title: 'User Interface',
                content: 'The user interface will be intuitive and responsive, providing a smooth user experience across different devices and screen sizes.',
                priority: 'medium'
            },
            {
                title: 'Data Management',
                content: 'The application will implement proper data validation, storage, and retrieval mechanisms with appropriate error handling.',
                priority: 'medium'
            },
            {
                title: 'Testing Strategy',
                content: 'Comprehensive testing will be implemented including unit tests, integration tests, and end-to-end testing to ensure reliability.',
                priority: 'medium'
            },
            {
                title: 'Deployment & Maintenance',
                content: 'The application will be deployed using modern deployment practices with proper monitoring and maintenance procedures.',
                priority: 'low'
            }
        ];

        return sections;
    }

    private generateFeatureDetails(features: string[]): string {
        if (features.length === 0) {
            return 'Basic application functionality with core features.';
        }

        const featureDetails = features.map(feature => {
            switch (feature.toLowerCase()) {
                case 'user authentication':
                    return '• User registration and login system\n• Password management and security\n• User profile management';
                case 'database integration':
                    return '• Database schema design\n• Data persistence and retrieval\n• Database optimization and indexing';
                case 'api endpoints':
                    return '• RESTful API design\n• API documentation\n• Error handling and validation';
                case 'user interface':
                    return '• Responsive design\n• Interactive components\n• Accessibility compliance';
                case 'search functionality':
                    return '• Search algorithms\n• Search result ranking\n• Search filters and sorting';
                default:
                    return `• ${feature} implementation\n• Related functionality and features`;
            }
        });

        return featureDetails.join('\n\n');
    }

    private generateTechnicalSpecs(designAnalysis: any): any {
        return {
            programmingLanguages: designAnalysis.technologies,
            frameworks: this.selectFrameworks(designAnalysis.technologies),
            databases: this.selectDatabases(designAnalysis),
            deployment: this.selectDeploymentStrategy(designAnalysis.complexity),
            monitoring: this.selectMonitoringTools(designAnalysis.complexity),
            security: this.selectSecurityMeasures(designAnalysis)
        };
    }

    private selectFrameworks(technologies: string[]): string[] {
        const frameworks: string[] = [];
        
        if (technologies.includes('React')) {
            frameworks.push('React', 'Next.js');
        }
        if (technologies.includes('Node.js')) {
            frameworks.push('Express.js', 'Fastify');
        }
        if (technologies.includes('TypeScript')) {
            frameworks.push('TypeScript', 'Jest');
        }
        
        return frameworks.length > 0 ? frameworks : ['Express.js', 'React'];
    }

    private selectDatabases(designAnalysis: any): string[] {
        if (designAnalysis.complexity === 'high') {
            return ['PostgreSQL', 'Redis', 'MongoDB'];
        } else if (designAnalysis.complexity === 'medium') {
            return ['PostgreSQL', 'Redis'];
        } else {
            return ['SQLite', 'JSON files'];
        }
    }

    private selectDeploymentStrategy(complexity: string): string[] {
        if (complexity === 'high') {
            return ['Docker', 'Kubernetes', 'AWS/GCP'];
        } else if (complexity === 'medium') {
            return ['Docker', 'Vercel/Netlify'];
        } else {
            return ['Static hosting', 'Vercel'];
        }
    }

    private selectMonitoringTools(complexity: string): string[] {
        if (complexity === 'high') {
            return ['Prometheus', 'Grafana', 'Sentry'];
        } else if (complexity === 'medium') {
            return ['Sentry', 'LogRocket'];
        } else {
            return ['Console logging'];
        }
    }

    private selectSecurityMeasures(designAnalysis: any): string[] {
        const security: string[] = ['HTTPS', 'Input validation', 'Error handling'];
        
        if (designAnalysis.features.includes('User authentication')) {
            security.push('JWT tokens', 'Password hashing', 'Rate limiting');
        }
        
        if (designAnalysis.complexity === 'high') {
            security.push('OAuth integration', 'API key management', 'Audit logging');
        }
        
        return security;
    }

    private generateDeliverables(designAnalysis: any): string[] {
        const deliverables = [
            'Source code repository',
            'Documentation',
            'Deployment instructions',
            'Testing suite'
        ];

        if (designAnalysis.complexity !== 'low') {
            deliverables.push('API documentation', 'User manual', 'Technical specifications');
        }

        if (designAnalysis.complexity === 'high') {
            deliverables.push('Architecture diagrams', 'Performance benchmarks', 'Security audit report');
        }

        return deliverables;
    }

    private generateTimeline(designAnalysis: any): any {
        const timeline = {
            phases: [
                {
                    name: 'Planning & Setup',
                    duration: '1-2 days',
                    tasks: ['Project setup', 'Environment configuration', 'Initial planning']
                },
                {
                    name: 'Core Development',
                    duration: this.getCoreDevelopmentDuration(designAnalysis.complexity),
                    tasks: ['Core functionality implementation', 'Basic features development']
                },
                {
                    name: 'Testing & Refinement',
                    duration: '2-3 days',
                    tasks: ['Testing implementation', 'Bug fixes', 'Performance optimization']
                },
                {
                    name: 'Deployment & Documentation',
                    duration: '1-2 days',
                    tasks: ['Deployment setup', 'Documentation completion', 'Final testing']
                }
            ]
        };

        return timeline;
    }

    private getCoreDevelopmentDuration(complexity: string): string {
        switch (complexity) {
            case 'low':
                return '3-5 days';
            case 'medium':
                return '1-2 weeks';
            case 'high':
                return '3-6 weeks';
            default:
                return '1-2 weeks';
        }
    }
}
