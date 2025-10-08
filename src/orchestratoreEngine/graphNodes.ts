import * as vscode from 'vscode';
import { SPARCWorkflowState } from './sparcWorkflowEngine';
import { AIService, AIRequest } from './aiService';
import { CodeExecutionEngine } from './codeExecutionEngine';

/**
 * Graph Node Types for SPARC Workflow Orchestration
 */

export interface GraphNodeState {
  // Core workflow information
  issueId: string;
  currentMode: 'design' | 'build' | 'debug';
  currentPhase: string;
  progress: number;
  
  // Issue context
  issueTitle: string;
  issueDescription: string;
  userInput: string;
  
  // Generated artifacts
  artifacts: {
    requirements?: string;
    guidelines?: string;
    pseudocode?: string;
    architecture?: string;
    implementation?: string;
    tests?: string;
    notes?: string;
  };
  
  // AI context
  aiContext: {
    currentAgent: string;
    agentHistory: AgentAction[];
    toolCalls: ToolCall[];
    decisions: Decision[];
    lastAIResponse?: any;
    confidence?: number;
    buildResult?: any;
  };
  
  // Memory and context
  memory: {
    chatHistory: ChatMessage[];
    context: ContextData;
    retrievedContext: RetrievedContext[];
  };
  
  // Workflow metadata
  metadata: {
    transitions: Transition[];
    errors: Error[];
    performance: PerformanceMetrics;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentAction {
  id: string;
  agentId: string;
  action: string;
  input: string;
  output: string;
  timestamp: Date;
  success: boolean;
}

export interface ToolCall {
  id: string;
  toolName: string;
  parameters: any;
  result: any;
  timestamp: Date;
  success: boolean;
}

export interface Decision {
  id: string;
  decision: string;
  reasoning: string;
  confidence: number;
  timestamp: Date;
  context: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface ContextData {
  [key: string]: any;
}

export interface RetrievedContext {
  id: string;
  content: string;
  relevance: number;
  source: string;
  timestamp: Date;
}

export interface Transition {
  from: string;
  to: string;
  condition: string;
  timestamp: Date;
  success: boolean;
}

export interface PerformanceMetrics {
  executionTime: number;
  nodeExecutionTimes: Map<string, number>;
  toolUsageCounts: Map<string, number>;
  errorRates: Map<string, number>;
  successRate: number;
}

/**
 * Graph Node Classes for SPARC Workflow
 */

export abstract class BaseGraphNode {
  protected id: string;
  protected name: string;
  protected type: string;
  protected status: 'active' | 'completed' | 'pending' | 'blocked';
  protected aiService: AIService;
  protected codeExecutionEngine: CodeExecutionEngine;
  
  constructor(id: string, name: string, type: string, workspaceRoot: vscode.Uri) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.status = 'pending';
    this.aiService = new AIService();
    this.codeExecutionEngine = new CodeExecutionEngine(workspaceRoot);
  }
  
  abstract execute(state: GraphNodeState): Promise<GraphNodeState>;
  
  protected logExecution(nodeId: string, action: string, result: any): void {
    console.log(`[${nodeId}] ${action}:`, result);
  }
  
  protected updateProgress(state: GraphNodeState, progress: number): GraphNodeState {
    state.progress = progress;
    state.updatedAt = new Date();
    return state;
  }
  
  protected addArtifact(state: GraphNodeState, key: string, content: string): GraphNodeState {
    (state.artifacts as any)[key] = content;
    state.updatedAt = new Date();
    return state;
  }
  
  protected addAgentAction(
    state: GraphNodeState,
    agentId: string,
    action: string,
    input: string,
    output: string,
    success: boolean = true
  ): GraphNodeState {
    const agentAction: AgentAction = {
      id: `action-${Date.now()}`,
      agentId,
      action,
      input,
      output,
      timestamp: new Date(),
      success
    };
    
    state.aiContext.agentHistory.push(agentAction);
    state.updatedAt = new Date();
    return state;
  }
}

/**
 * Design Mode Graph Nodes
 */

export class SpecificationNode extends BaseGraphNode {
  constructor(workspaceRoot: vscode.Uri) {
    super('specification', 'Specification Phase', 'design', workspaceRoot);
  }
  
  async execute(state: GraphNodeState): Promise<GraphNodeState> {
    this.logExecution(this.id, 'Starting specification phase', state.issueDescription);
    
    try {
      // Use AI service to generate requirements based on user input
      const aiRequest: AIRequest = {
        userInput: state.userInput,
        mode: state.currentMode,
        phase: 'specification',
        context: {
          issueTitle: state.issueTitle,
          issueDescription: state.issueDescription,
          existingArtifacts: state.artifacts
        }
      };
      
      const aiResponse = await this.aiService.processRequest(aiRequest);
      const requirements = aiResponse.content;
      
      // Update state with AI-generated requirements
      state = this.addArtifact(state, 'requirements', requirements);
      state = this.updateProgress(state, 20);
      state = this.addAgentAction(
        state,
        'design-agent',
        'generate_requirements',
        state.issueDescription,
        requirements
      );
      
      // Add AI context to state
      state.aiContext = {
        ...state.aiContext,
        lastAIResponse: aiResponse,
        confidence: aiResponse.confidence
      };
      
      // Move to next phase
      state.currentPhase = 'pseudocode';
      this.status = 'completed';
      
      this.logExecution(this.id, 'Specification phase completed', requirements);
      return state;
    } catch (error) {
      this.logExecution(this.id, 'Specification phase failed', error);
      this.status = 'blocked';
      throw error;
    }
  }
  
  private async generateRequirements(description: string): Promise<string> {
    // Simulate AI-generated requirements
    return `# Requirements Specification

## Overview
${description}

## Functional Requirements
- [ ] Core functionality implementation
- [ ] User interface components
- [ ] Data processing capabilities
- [ ] Integration requirements

## Non-Functional Requirements
- [ ] Performance requirements
- [ ] Security requirements
- [ ] Scalability requirements
- [ ] Maintainability requirements

## Constraints
- [ ] Technical constraints
- [ ] Resource constraints
- [ ] Time constraints
- [ ] Compliance requirements

## Acceptance Criteria
- [ ] Feature completeness
- [ ] Performance benchmarks
- [ ] Quality standards
- [ ] User experience goals`;
  }
}

export class PseudocodeNode extends BaseGraphNode {
  constructor(workspaceRoot: vscode.Uri) {
    super('pseudocode', 'Pseudocode Phase', 'design', workspaceRoot);
  }
  
  async execute(state: GraphNodeState): Promise<GraphNodeState> {
    this.logExecution(this.id, 'Starting pseudocode phase', state.artifacts.requirements);
    
    try {
      // Use AI service to generate pseudocode based on user input
      const aiRequest: AIRequest = {
        userInput: state.userInput,
        mode: state.currentMode,
        phase: 'pseudocode',
        context: {
          issueTitle: state.issueTitle,
          issueDescription: state.issueDescription,
          existingArtifacts: state.artifacts
        }
      };
      
      const aiResponse = await this.aiService.processRequest(aiRequest);
      const pseudocode = aiResponse.content;
      
      // Update state with AI-generated pseudocode
      state = this.addArtifact(state, 'pseudocode', pseudocode);
      state = this.updateProgress(state, 40);
      state = this.addAgentAction(
        state,
        'design-agent',
        'generate_pseudocode',
        state.artifacts.requirements || '',
        pseudocode
      );
      
      // Add AI context to state
      state.aiContext = {
        ...state.aiContext,
        lastAIResponse: aiResponse,
        confidence: aiResponse.confidence
      };
      
      // Move to next phase
      state.currentPhase = 'architecture';
      this.status = 'completed';
      
      this.logExecution(this.id, 'Pseudocode phase completed', pseudocode);
      return state;
    } catch (error) {
      this.logExecution(this.id, 'Pseudocode phase failed', error);
      this.status = 'blocked';
      throw error;
    }
  }
  
  private async generatePseudocode(_requirements: string): Promise<string> {
    // Simulate AI-generated pseudocode
    return `# Pseudocode Implementation

## Main Algorithm
\`\`\`
BEGIN
  INITIALIZE system
  LOAD requirements
  VALIDATE inputs
  
  FOR each requirement DO
    ANALYZE requirement
    DESIGN solution
    IMPLEMENT logic
    TEST functionality
  END FOR
  
  INTEGRATE components
  VALIDATE system
  DEPLOY solution
END
\`\`\`

## Data Structures
\`\`\`
STRUCTURE UserData {
  id: STRING
  name: STRING
  email: STRING
  preferences: OBJECT
}

STRUCTURE SystemState {
  currentUser: UserData
  session: STRING
  permissions: ARRAY
}
\`\`\`

## Key Functions
\`\`\`
FUNCTION processUserInput(input: STRING) -> RESULT
  VALIDATE input
  PARSE input
  EXECUTE command
  RETURN result
END FUNCTION

FUNCTION validateData(data: OBJECT) -> BOOLEAN
  CHECK data integrity
  VERIFY permissions
  RETURN validation result
END FUNCTION
\`\`\``;
  }
}

export class ArchitectureNode extends BaseGraphNode {
  constructor(workspaceRoot: vscode.Uri) {
    super('architecture', 'Architecture Phase', 'design', workspaceRoot);
  }
  
  async execute(state: GraphNodeState): Promise<GraphNodeState> {
    this.logExecution(this.id, 'Starting architecture phase', state.artifacts.pseudocode);
    
    try {
      // Use AI service to generate architecture based on user input
      const aiRequest: AIRequest = {
        userInput: state.userInput,
        mode: state.currentMode,
        phase: 'architecture',
        context: {
          issueTitle: state.issueTitle,
          issueDescription: state.issueDescription,
          existingArtifacts: state.artifacts
        }
      };
      
      const aiResponse = await this.aiService.processRequest(aiRequest);
      const architecture = aiResponse.content;
      
      // Update state with AI-generated architecture
      state = this.addArtifact(state, 'architecture', architecture);
      state = this.updateProgress(state, 60);
      state = this.addAgentAction(
        state,
        'design-agent',
        'generate_architecture',
        state.artifacts.pseudocode || '',
        architecture
      );
      
      // Add AI context to state
      state.aiContext = {
        ...state.aiContext,
        lastAIResponse: aiResponse,
        confidence: aiResponse.confidence
      };
      
      // Move to next phase
      state.currentPhase = 'refinement';
      this.status = 'completed';
      
      this.logExecution(this.id, 'Architecture phase completed', architecture);
      return state;
    } catch (error) {
      this.logExecution(this.id, 'Architecture phase failed', error);
      this.status = 'blocked';
      throw error;
    }
  }
  
  private async generateArchitecture(_pseudocode: string): Promise<string> {
    // Simulate AI-generated architecture
    return `# System Architecture

## Architecture Overview
\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │   Business      │    │   Data          │
│   Layer         │    │   Logic Layer   │    │   Layer         │
│                 │    │                 │    │                 │
│ • UI Components │    │ • Core Services │    │ • Database      │
│ • Controllers   │    │ • Business      │    │ • File System   │
│ • Views         │    │   Rules         │    │ • External APIs │
│ • Templates     │    │ • Validation    │    │ • Cache         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## Component Design
- **Frontend**: React/Vue.js components with TypeScript
- **Backend**: Node.js/Express with RESTful APIs
- **Database**: PostgreSQL with Redis caching
- **Authentication**: JWT-based with OAuth2 support
- **File Storage**: AWS S3 or local file system

## API Design
\`\`\`
GET    /api/users           - List users
POST   /api/users           - Create user
GET    /api/users/:id       - Get user by ID
PUT    /api/users/:id       - Update user
DELETE /api/users/:id       - Delete user
\`\`\`

## Security Considerations
- Input validation and sanitization
- Authentication and authorization
- Rate limiting and DDoS protection
- Data encryption in transit and at rest
- Audit logging and monitoring`;
  }
  
  private async generateGuidelines(_requirements: string): Promise<string> {
    // Simulate AI-generated guidelines
    return `# Development Guidelines

## Code Standards
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Implement comprehensive error handling
- Write unit tests for all functions
- Use meaningful variable and function names

## Architecture Principles
- Follow SOLID principles
- Implement dependency injection
- Use design patterns appropriately
- Maintain separation of concerns
- Ensure scalability and maintainability

## Testing Strategy
- Unit tests for individual components
- Integration tests for API endpoints
- End-to-end tests for user workflows
- Performance tests for critical paths
- Security tests for vulnerabilities

## Deployment Guidelines
- Use containerization (Docker)
- Implement CI/CD pipelines
- Use environment-specific configurations
- Monitor application performance
- Implement rollback strategies`;
  }
}

export class RefinementNode extends BaseGraphNode {
  constructor(workspaceRoot: vscode.Uri) {
    super('refinement', 'Refinement Phase', 'design', workspaceRoot);
  }
  
  async execute(state: GraphNodeState): Promise<GraphNodeState> {
    this.logExecution(this.id, 'Starting refinement phase', state.artifacts.requirements);
    
    try {
      // Refine requirements based on architecture
      const refinedRequirements = await this.refineRequirements(
        state.artifacts.requirements || '',
        state.artifacts.architecture || ''
      );
      
      // Update state with refined requirements
      state = this.addArtifact(state, 'requirements', refinedRequirements);
      state = this.updateProgress(state, 80);
      state = this.addAgentAction(
        state,
        'design-agent',
        'refine_requirements',
        state.artifacts.requirements || '',
        refinedRequirements
      );
      
      // Move to next phase
      state.currentPhase = 'completion';
      this.status = 'completed';
      
      this.logExecution(this.id, 'Refinement phase completed', refinedRequirements);
      return state;
    } catch (error) {
      this.logExecution(this.id, 'Refinement phase failed', error);
      this.status = 'blocked';
      throw error;
    }
  }
  
  private async refineRequirements(requirements: string, _architecture: string): Promise<string> {
    // Simulate AI-refined requirements
    return `${requirements}

## Refined Requirements (Post-Architecture)

### Technical Refinements
- Updated based on architecture decisions
- Clarified implementation details
- Added technical constraints
- Refined performance requirements

### Implementation Notes
- Specific technology stack requirements
- Integration points and dependencies
- Performance benchmarks and SLAs
- Security and compliance requirements

### Quality Assurance
- Updated acceptance criteria
- Performance testing requirements
- Security testing requirements
- User acceptance testing criteria`;
  }
}

export class CompletionNode extends BaseGraphNode {
  constructor(workspaceRoot: vscode.Uri) {
    super('completion', 'Completion Phase', 'design', workspaceRoot);
  }
  
  async execute(state: GraphNodeState): Promise<GraphNodeState> {
    this.logExecution(this.id, 'Starting completion phase', state.artifacts);
    
    try {
      // Generate completion summary
      const completionSummary = await this.generateCompletionSummary(state.artifacts);
      
      // Update state with completion summary
      state = this.addArtifact(state, 'notes', completionSummary);
      state = this.updateProgress(state, 100);
      state = this.addAgentAction(
        state,
        'design-agent',
        'complete_design',
        JSON.stringify(state.artifacts),
        completionSummary
      );
      
      // Design phase completed
      state.currentMode = 'build';
      state.currentPhase = 'implementation';
      this.status = 'completed';
      
      this.logExecution(this.id, 'Design phase completed', completionSummary);
      return state;
    } catch (error) {
      this.logExecution(this.id, 'Completion phase failed', error);
      this.status = 'blocked';
      throw error;
    }
  }
  
  private async generateCompletionSummary(_artifacts: any): Promise<string> {
    // Simulate AI-generated completion summary
    return `# Design Phase Completion Summary

## Completed Artifacts
✅ **Requirements Specification**: Comprehensive requirements document
✅ **Pseudocode Implementation**: Detailed algorithmic approach
✅ **System Architecture**: Complete architectural design
✅ **Development Guidelines**: Coding standards and best practices

## Key Decisions Made
- Technology stack selection
- Architecture pattern choice
- Security implementation approach
- Performance optimization strategy

## Next Steps
1. **Build Phase**: Implement the designed solution
2. **Code Generation**: Create actual implementation
3. **Testing**: Implement comprehensive test suite
4. **Documentation**: Generate technical documentation

## Quality Metrics
- Requirements coverage: 100%
- Architecture completeness: 100%
- Design consistency: 100%
- Implementation readiness: 100%

## Risk Assessment
- Low risk: Well-defined requirements
- Medium risk: Complex integration points
- Mitigation: Comprehensive testing strategy

The design phase is now complete and ready for implementation.`;
  }
}

/**
 * Build Mode Graph Nodes
 */

export class ImplementationNode extends BaseGraphNode {
  constructor(workspaceRoot: vscode.Uri) {
    super('implementation', 'Implementation Phase', 'build', workspaceRoot);
  }
  
  async execute(state: GraphNodeState): Promise<GraphNodeState> {
    this.logExecution(this.id, 'Starting implementation phase', state.artifacts.architecture);
    
    try {
      // Use AI service to generate implementation based on user input
      const aiRequest: AIRequest = {
        userInput: state.userInput,
        mode: state.currentMode,
        phase: 'implementation',
        context: {
          issueTitle: state.issueTitle,
          issueDescription: state.issueDescription,
          existingArtifacts: state.artifacts
        }
      };
      
      const aiResponse = await this.aiService.processRequest(aiRequest);
      const implementation = aiResponse.content;
      
      // Execute the build workflow: write files, build, run, test
      console.log('[ImplementationNode] Starting code execution workflow...');
      const buildResult = await this.codeExecutionEngine.executeBuildWorkflow(
        state.userInput,
        state.issueDescription,
        implementation
      );
      
      // Create comprehensive implementation report
      const implementationReport = this.createImplementationReport(implementation, buildResult);
      
      // Update state with AI-generated implementation and execution results
      state = this.addArtifact(state, 'implementation', implementationReport);
      state = this.updateProgress(state, 40);
      state = this.addAgentAction(
        state,
        'build-agent',
        'generate_and_execute_implementation',
        state.artifacts.architecture || '',
        JSON.stringify(buildResult)
      );
      
      // Add AI context and execution results to state
      state.aiContext = {
        ...state.aiContext,
        lastAIResponse: aiResponse,
        confidence: aiResponse.confidence,
        buildResult: buildResult
      };
      
      // Move to next phase
      state.currentPhase = 'testing';
      this.status = 'completed';
      
      this.logExecution(this.id, 'Implementation phase completed with execution', buildResult);
      return state;
    } catch (error) {
      this.logExecution(this.id, 'Implementation phase failed', error);
      this.status = 'blocked';
      throw error;
    }
  }
  
  /**
   * Create a comprehensive implementation report
   */
  private createImplementationReport(generatedCode: string, buildResult: any): string {
    let report = `# Implementation Report\n\n`;
    
    report += `## Generated Code\n\`\`\`\n${generatedCode}\n\`\`\`\n\n`;
    
    report += `## Execution Results\n\n`;
    report += `**Status**: ${buildResult.success ? '✅ Success' : '❌ Failed'}\n\n`;
    
    if (buildResult.filesCreated && buildResult.filesCreated.length > 0) {
      report += `### Files Created\n`;
      buildResult.filesCreated.forEach((file: any) => {
        report += `- \`${file.path}\` (${file.language})\n`;
      });
      report += `\n`;
    }
    
    if (buildResult.commandsExecuted && buildResult.commandsExecuted.length > 0) {
      report += `### Commands Executed\n`;
      buildResult.commandsExecuted.forEach((cmd: any) => {
        const status = cmd.success ? '✅' : '❌';
        report += `- ${status} \`${cmd.command}\` (${cmd.duration}ms)\n`;
        if (cmd.stdout) {
          report += `  **Output**: \`${cmd.stdout.substring(0, 100)}${cmd.stdout.length > 100 ? '...' : ''}\`\n`;
        }
        if (cmd.stderr) {
          report += `  **Error**: \`${cmd.stderr.substring(0, 100)}${cmd.stderr.length > 100 ? '...' : ''}\`\n`;
        }
      });
      report += `\n`;
    }
    
    if (buildResult.errors && buildResult.errors.length > 0) {
      report += `### Errors\n`;
      buildResult.errors.forEach((error: string) => {
        report += `- ❌ ${error}\n`;
      });
      report += `\n`;
    }
    
    if (buildResult.warnings && buildResult.warnings.length > 0) {
      report += `### Warnings\n`;
      buildResult.warnings.forEach((warning: string) => {
        report += `- ⚠️ ${warning}\n`;
      });
      report += `\n`;
    }
    
    if (buildResult.nextSteps && buildResult.nextSteps.length > 0) {
      report += `### Next Steps\n`;
      buildResult.nextSteps.forEach((step: string) => {
        report += `- ${step}\n`;
      });
      report += `\n`;
    }
    
    return report;
  }
  
  private async generateImplementation(_architecture: string): Promise<string> {
    // Simulate AI-generated implementation
    return `# Implementation Code

## Main Application File
\`\`\`typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { userRoutes } from './routes/users';
import { authRoutes } from './routes/auth';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

export default app;
\`\`\`

## User Service
\`\`\`typescript
// src/services/userService.ts
import { User } from '../models/User';
import { Database } from '../database/Database';

export class UserService {
  constructor(private db: Database) {}
  
  async createUser(userData: Partial<User>): Promise<User> {
    // Validate input
    if (!userData.email || !userData.name) {
      throw new Error('Email and name are required');
    }
    
    // Create user
    const user = await this.db.users.create(userData);
    return user;
  }
  
  async getUserById(id: string): Promise<User | null> {
    return await this.db.users.findById(id);
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.db.users.update(id, updates);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
  
  async deleteUser(id: string): Promise<boolean> {
    return await this.db.users.delete(id);
  }
}
\`\`\`

## Database Models
\`\`\`typescript
// src/models/User.ts
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
}
\`\`\``;
  }
}

export class TestingNode extends BaseGraphNode {
  constructor(workspaceRoot: vscode.Uri) {
    super('testing', 'Testing Phase', 'build', workspaceRoot);
  }
  
  async execute(state: GraphNodeState): Promise<GraphNodeState> {
    this.logExecution(this.id, 'Starting testing phase', state.artifacts.implementation);
    
    try {
      // Generate test suite
      const tests = await this.generateTests(state.artifacts.implementation || '');
      
      // Update state with tests
      state = this.addArtifact(state, 'tests', tests);
      state = this.updateProgress(state, 80);
      state = this.addAgentAction(
        state,
        'build-agent',
        'generate_tests',
        state.artifacts.implementation || '',
        tests
      );
      
      // Move to next phase
      state.currentPhase = 'documentation';
      this.status = 'completed';
      
      this.logExecution(this.id, 'Testing phase completed', tests);
      return state;
    } catch (error) {
      this.logExecution(this.id, 'Testing phase failed', error);
      this.status = 'blocked';
      throw error;
    }
  }
  
  private async generateTests(_implementation: string): Promise<string> {
    // Simulate AI-generated tests
    return `# Test Suite

## Unit Tests
\`\`\`typescript
// tests/unit/userService.test.ts
import { UserService } from '../../src/services/userService';
import { Database } from '../../src/database/Database';
import { User } from '../../src/models/User';

describe('UserService', () => {
  let userService: UserService;
  let mockDb: jest.Mocked<Database>;
  
  beforeEach(() => {
    mockDb = {
      users: {
        create: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }
    } as any;
    
    userService = new UserService(mockDb);
  });
  
  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      const expectedUser = {
        id: '1',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockDb.users.create.mockResolvedValue(expectedUser);
      
      const result = await userService.createUser(userData);
      
      expect(result).toEqual(expectedUser);
      expect(mockDb.users.create).toHaveBeenCalledWith(userData);
    });
    
    it('should throw error for missing email', async () => {
      const userData = { name: 'John Doe' };
      
      await expect(userService.createUser(userData)).rejects.toThrow(
        'Email and name are required'
      );
    });
  });
  
  describe('getUserById', () => {
    it('should return user when found', async () => {
      const user = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockDb.users.findById.mockResolvedValue(user);
      
      const result = await userService.getUserById('1');
      
      expect(result).toEqual(user);
      expect(mockDb.users.findById).toHaveBeenCalledWith('1');
    });
    
    it('should return null when user not found', async () => {
      mockDb.users.findById.mockResolvedValue(null);
      
      const result = await userService.getUserById('999');
      
      expect(result).toBeNull();
    });
  });
});
\`\`\`

## Integration Tests
\`\`\`typescript
// tests/integration/api.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('User API', () => {
  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        name: userData.name,
        email: userData.email
      });
      expect(response.body.id).toBeDefined();
    });
    
    it('should return 400 for invalid data', async () => {
      const invalidData = { name: 'John Doe' }; // Missing email
      
      await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(400);
    });
  });
  
  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      // First create a user
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      const createResponse = await request(app)
        .post('/api/users')
        .send(userData);
      
      const userId = createResponse.body.id;
      
      // Then get the user
      const response = await request(app)
        .get(\`/api/users/\${userId}\`)
        .expect(200);
      
      expect(response.body).toMatchObject(userData);
    });
  });
});
\`\`\`

## Test Configuration
\`\`\`json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
\`\`\``;
  }
}

/**
 * Debug Mode Graph Nodes
 */

export class AnalysisNode extends BaseGraphNode {
  constructor(workspaceRoot: vscode.Uri) {
    super('analysis', 'Analysis Phase', 'debug', workspaceRoot);
  }
  
  async execute(state: GraphNodeState): Promise<GraphNodeState> {
    this.logExecution(this.id, 'Starting analysis phase', state.artifacts.implementation);
    
    try {
      // Analyze code for issues
      const analysis = await this.analyzeCode(state.artifacts.implementation || '');
      
      // Update state with analysis
      state = this.addArtifact(state, 'notes', analysis);
      state = this.updateProgress(state, 50);
      state = this.addAgentAction(
        state,
        'debug-agent',
        'analyze_code',
        state.artifacts.implementation || '',
        analysis
      );
      
      // Move to next phase
      state.currentPhase = 'fix_generation';
      this.status = 'completed';
      
      this.logExecution(this.id, 'Analysis phase completed', analysis);
      return state;
    } catch (error) {
      this.logExecution(this.id, 'Analysis phase failed', error);
      this.status = 'blocked';
      throw error;
    }
  }
  
  private async analyzeCode(_implementation: string): Promise<string> {
    // Simulate AI code analysis
    return `# Code Analysis Report

## Issues Found

### High Priority
1. **Missing Error Handling**: UserService methods lack comprehensive error handling
   - Location: src/services/userService.ts
   - Impact: Runtime errors may crash the application
   - Recommendation: Add try-catch blocks and proper error responses

2. **Input Validation**: Insufficient input validation in API endpoints
   - Location: src/routes/users.ts
   - Impact: Security vulnerabilities and data corruption
   - Recommendation: Implement comprehensive input validation

### Medium Priority
3. **Database Connection**: No connection pooling or retry logic
   - Location: src/database/Database.ts
   - Impact: Performance issues and connection failures
   - Recommendation: Implement connection pooling and retry mechanisms

4. **Logging**: Missing structured logging throughout the application
   - Location: Multiple files
   - Impact: Difficult debugging and monitoring
   - Recommendation: Implement comprehensive logging system

### Low Priority
5. **Code Duplication**: Similar validation logic repeated across services
   - Location: Multiple service files
   - Impact: Maintenance overhead
   - Recommendation: Extract common validation logic

## Performance Analysis
- **Memory Usage**: Within acceptable limits
- **CPU Usage**: Efficient algorithms used
- **Database Queries**: Some N+1 query patterns detected
- **API Response Times**: Generally fast, some endpoints could be optimized

## Security Analysis
- **Authentication**: Basic JWT implementation present
- **Authorization**: Role-based access control missing
- **Input Sanitization**: Partial implementation
- **SQL Injection**: Protected by ORM, but raw queries need review

## Recommendations
1. Implement comprehensive error handling
2. Add input validation middleware
3. Set up connection pooling
4. Implement structured logging
5. Add performance monitoring
6. Enhance security measures`;
  }
}

export class FixGenerationNode extends BaseGraphNode {
  constructor(workspaceRoot: vscode.Uri) {
    super('fix_generation', 'Fix Generation Phase', 'debug', workspaceRoot);
  }
  
  async execute(state: GraphNodeState): Promise<GraphNodeState> {
    this.logExecution(this.id, 'Starting fix generation phase', state.artifacts.notes);
    
    try {
      // Generate fixes based on analysis
      const fixes = await this.generateFixes(state.artifacts.notes || '');
      
      // Update state with fixes
      state = this.addArtifact(state, 'notes', fixes);
      state = this.updateProgress(state, 100);
      state = this.addAgentAction(
        state,
        'debug-agent',
        'generate_fixes',
        state.artifacts.notes || '',
        fixes
      );
      
      // Debug phase completed
      state.currentMode = 'design';
      state.currentPhase = 'specification';
      this.status = 'completed';
      
      this.logExecution(this.id, 'Fix generation phase completed', fixes);
      return state;
    } catch (error) {
      this.logExecution(this.id, 'Fix generation phase failed', error);
      this.status = 'blocked';
      throw error;
    }
  }
  
  private async generateFixes(analysis: string): Promise<string> {
    // Simulate AI-generated fixes
    return `${analysis}

## Generated Fixes

### 1. Enhanced Error Handling
\`\`\`typescript
// src/services/userService.ts (Updated)
export class UserService {
  constructor(private db: Database, private logger: Logger) {}
  
  async createUser(userData: Partial<User>): Promise<User> {
    try {
      // Validate input
      if (!userData.email || !userData.name) {
        throw new ValidationError('Email and name are required');
      }
      
      // Validate email format
      if (!this.isValidEmail(userData.email)) {
        throw new ValidationError('Invalid email format');
      }
      
      // Create user
      const user = await this.db.users.create(userData);
      this.logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', { error: error.message, userData });
      throw error;
    }
  }
  
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
\`\`\`

### 2. Input Validation Middleware
\`\`\`typescript
// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required()
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details
    });
  }
  
  next();
};
\`\`\`

### 3. Database Connection Pooling
\`\`\`typescript
// src/database/Database.ts (Updated)
import { Pool } from 'pg';

export class Database {
  private pool: Pool;
  
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  
  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }
}
\`\`\`

### 4. Structured Logging
\`\`\`typescript
// src/utils/logger.ts
import winston from 'winston';

export class Logger {
  private logger: winston.Logger;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }
  
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }
  
  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }
  
  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }
}
\`\`\`

## Implementation Priority
1. **High Priority**: Error handling and input validation
2. **Medium Priority**: Database connection pooling
3. **Low Priority**: Logging and monitoring

## Testing the Fixes
- Run existing test suite to ensure no regressions
- Add new tests for error handling scenarios
- Test input validation with invalid data
- Monitor database connection performance
- Verify logging output format and content`;
  }
}

