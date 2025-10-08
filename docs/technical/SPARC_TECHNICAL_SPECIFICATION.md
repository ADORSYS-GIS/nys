# SPARC Workflow Engine - Technical Specification

## Executive Summary

The SPARC Workflow Engine is a sophisticated orchestration system that implements the SPARC framework (Specification → Pseudocode → Architecture → Refinement → Completion) for systematic, issue-driven software development. It provides a structured approach to transforming user requirements into comprehensive development artifacts through a guided, phase-based workflow.

## System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    SPARC Workflow Engine                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Design Mode   │  │   Build Mode    │  │ Debug Mode   │ │
│  │   Processor     │  │   Processor     │  │  Processor   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Specification  │  │   Pseudocode    │  │ Architecture │ │
│  │    Phase        │  │     Phase       │  │    Phase     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Refinement    │  │   Completion    │                  │
│  │     Phase       │  │     Phase       │                  │
│  └─────────────────┘  └─────────────────┘                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Artifact        │  │ State           │  │ File System  │ │
│  │ Generator       │  │ Manager         │  │ Integration  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
User Input → Mode Selection → Phase Processing → Artifact Generation → State Persistence → File Storage
     ↓              ↓              ↓                    ↓                    ↓              ↓
  Raw Text    Design/Build/    Current Phase    requirements.md      Workflow State   .nys/issue-id/
              Debug Mode       Progression      guidelines.md        JSON File        requirements.md
                                25% → 50% →      pseudocode.md                        guidelines.md
                                75% → 100%       architecture.md                      pseudocode.md
                                                implementation.md                     architecture.md
                                                tests.md                             implementation.md
                                                notes.md                             tests.md
                                                                                     notes.md
```

## Detailed Component Analysis

### 1. SPARCWorkflowEngine Class

**Purpose**: Main orchestrator that coordinates all workflow operations

**Key Responsibilities**:
- Initialize and manage workspace integration
- Coordinate mode-specific processing
- Manage workflow state persistence
- Handle artifact generation and storage

**Core Methods**:

```typescript
class SPARCWorkflowEngine {
  // Public API
  async processIssue(issueId: string, mode: WorkflowMode, userInput: string): Promise<SPARCWorkflowState>
  
  // Private Processing Methods
  private async processDesignPhase(state: SPARCWorkflowState, userInput: string): Promise<void>
  private async processBuildPhase(state: SPARCWorkflowState, userInput: string): Promise<void>
  private async processDebugPhase(state: SPARCWorkflowState, userInput: string): Promise<void>
  
  // Artifact Generation Methods
  private async generateRequirements(userInput: string): Promise<string>
  private async generatePseudocode(userInput: string, requirements?: string): Promise<string>
  private async generateArchitecture(userInput: string, artifacts: any): Promise<string>
  private async generateGuidelines(userInput: string, artifacts: any): Promise<string>
  private async generateImplementation(userInput: string, artifacts: any): Promise<string>
  private async generateTests(userInput: string, artifacts: any): Promise<string>
  private async analyzeAndDebug(userInput: string, artifacts: any): Promise<string>
  
  // State Management Methods
  private async loadWorkflowState(issueId: string): Promise<SPARCWorkflowState | null>
  private async saveWorkflowState(state: SPARCWorkflowState): Promise<void>
  private async saveArtifacts(state: SPARCWorkflowState): Promise<void>
}
```

### 2. Workflow State Management

**SPARCWorkflowState Interface**:

```typescript
interface SPARCWorkflowState {
  // Identity and Metadata
  issueId: string;                    // Unique issue identifier
  createdAt: Date;                    // Creation timestamp
  updatedAt: Date;                    // Last modification timestamp
  
  // Workflow Control
  currentPhase: WorkflowPhase;        // Current phase in the workflow
  mode: WorkflowMode;                 // Current processing mode
  progress: number;                   // Completion percentage (0-100)
  
  // Generated Artifacts
  artifacts: {
    requirements?: string;            // Requirements specification
    guidelines?: string;              // Development guidelines
    pseudocode?: string;              // Algorithm pseudocode
    architecture?: string;            // System architecture
    implementation?: string;          // Generated implementation
    tests?: string;                   // Test suite
    notes?: string;                   // Debug notes and iterations
  };
}

type WorkflowPhase = 'specification' | 'pseudocode' | 'architecture' | 'refinement' | 'completion';
type WorkflowMode = 'design' | 'build' | 'debug';
```

### 3. Phase Processing Logic

#### Design Mode Phase Progression

```typescript
private async processDesignPhase(state: SPARCWorkflowState, userInput: string): Promise<void> {
  switch (state.currentPhase) {
    case 'specification':
      // Phase 1: Extract and formalize requirements
      state.artifacts.requirements = await this.generateRequirements(userInput);
      state.currentPhase = 'pseudocode';
      state.progress = 25;
      break;
      
    case 'pseudocode':
      // Phase 2: Create algorithmic design
      state.artifacts.pseudocode = await this.generatePseudocode(userInput, state.artifacts.requirements);
      state.currentPhase = 'architecture';
      state.progress = 50;
      break;
      
    case 'architecture':
      // Phase 3: Design system architecture
      state.artifacts.architecture = await this.generateArchitecture(userInput, state.artifacts);
      state.artifacts.guidelines = await this.generateGuidelines(userInput, state.artifacts);
      state.currentPhase = 'refinement';
      state.progress = 75;
      break;
      
    case 'refinement':
      // Phase 4: Refine and finalize requirements
      state.artifacts.requirements = await this.refineRequirements(
        state.artifacts.requirements || '', 
        userInput
      );
      state.currentPhase = 'completion';
      state.progress = 100;
      break;
  }
}
```

#### Build Mode Processing

```typescript
private async processBuildPhase(state: SPARCWorkflowState, userInput: string): Promise<void> {
  // Prerequisite Check: Design must be complete
  if (state.currentPhase !== 'completion') {
    state.artifacts.notes = (state.artifacts.notes || '') + 
      `\n[${new Date().toISOString()}] Build requested but design incomplete. Current phase: ${state.currentPhase}`;
    return;
  }

  // Generate implementation artifacts
  state.artifacts.implementation = await this.generateImplementation(userInput, state.artifacts);
  state.artifacts.tests = await this.generateTests(userInput, state.artifacts);
  
  state.progress = 100;
}
```

#### Debug Mode Processing

```typescript
private async processDebugPhase(state: SPARCWorkflowState, userInput: string): Promise<void> {
  // Debug can work with any existing artifacts
  const debugNotes = await this.analyzeAndDebug(userInput, state.artifacts);
  state.artifacts.notes = (state.artifacts.notes || '') + 
    `\n[${new Date().toISOString()}] Debug Analysis:\n${debugNotes}`;
}
```

## Artifact Generation System

### 1. Requirements Generation

**Input**: Raw user requirements/description
**Output**: Structured requirements document
**Template Structure**:

```markdown
# Requirements Specification

## User Input
{userInput}

## Extracted Requirements
- Core functionality: [To be defined based on input analysis]
- Technical constraints: [To be identified]
- Performance requirements: [To be specified]
- Integration points: [To be mapped]

## Acceptance Criteria
- [ ] Feature 1: [Description]
- [ ] Feature 2: [Description]
- [ ] Feature 3: [Description]

*Generated by SPARC Workflow Engine - Design Phase*
```

### 2. Pseudocode Generation

**Input**: User input + requirements artifact
**Output**: Algorithmic pseudocode
**Template Structure**:

```markdown
# Pseudocode

## Algorithm Overview
Based on requirements analysis, here's the high-level algorithm:

```
BEGIN
  // Initialize system components
  INITIALIZE components
  
  // Main processing loop
  FOR each input item DO
    PROCESS item according to requirements
    VALIDATE output
    STORE result
  END FOR
  
  // Cleanup and finalization
  CLEANUP resources
  RETURN results
END
```

## Key Functions
- `processItem()`: Core processing logic
- `validateOutput()`: Result validation
- `storeResult()`: Data persistence

*Generated by SPARC Workflow Engine - Pseudocode Phase*
```

### 3. Architecture Generation

**Input**: User input + all previous artifacts
**Output**: System architecture and development guidelines
**Template Structure**:

```markdown
# System Architecture

## Overview
High-level system design based on requirements and pseudocode analysis.

## Components
- **Core Module**: Main processing logic
- **Data Layer**: Data persistence and retrieval
- **Interface Layer**: External API and user interface
- **Validation Layer**: Input/output validation

## Dependencies
- Framework: [To be specified]
- Database: [To be specified]
- External APIs: [To be identified]

## Data Flow
1. Input → Validation Layer
2. Validation → Core Module
3. Core Module → Data Layer
4. Data Layer → Interface Layer
5. Interface Layer → Output

*Generated by SPARC Workflow Engine - Architecture Phase*
```

### 4. Implementation Generation

**Input**: User input + design artifacts
**Output**: Generated source code and configuration
**Template Structure**:

```markdown
# Implementation

## Generated Code Structure
Based on the design artifacts, here's the implementation:

```typescript
// Main implementation file
export class {ClassName} {
  constructor() {
    // Initialize based on architecture
  }

  async process(input: any): Promise<any> {
    // Implementation based on pseudocode
    return this.validateAndStore(input);
  }

  private validateAndStore(input: any): any {
    // Validation and storage logic
    return input;
  }
}
```

## Configuration Files
- Package configuration
- Environment setup
- Build configuration

*Generated by SPARC Workflow Engine - Build Phase*
```

## File System Integration

### Directory Structure

```
workspace-root/
└── .nys/                                    # SPARC workflow data directory
    ├── {issue-id}/                          # Issue-specific folder
    │   ├── requirements.md                  # Requirements specification
    │   ├── guidelines.md                    # Development guidelines
    │   ├── pseudocode.md                    # Algorithm pseudocode
    │   ├── architecture.md                  # System architecture
    │   ├── implementation.md                # Generated implementation
    │   ├── tests.md                         # Test suite
    │   └── notes.md                         # Debug notes
    ├── {issue-id}-workflow.json             # Workflow state file
    └── {other-issue-id}/                    # Additional issue folders
```

### State Persistence Strategy

**Dual Persistence Model**:

1. **JSON State File**: `{issue-id}-workflow.json`
   - Complete workflow state serialization
   - Metadata and progress tracking
   - Artifact references and timestamps

2. **Markdown Artifact Files**: Individual `.md` files
   - Human-readable content
   - Version control friendly
   - Direct editing capability

### File Operations

```typescript
// State Loading
private async loadWorkflowState(issueId: string): Promise<SPARCWorkflowState | null> {
  if (!this._nysFolder) return null;

  try {
    const stateFile = vscode.Uri.joinPath(this._nysFolder, `${issueId}-workflow.json`);
    const content = await vscode.workspace.fs.readFile(stateFile);
    return JSON.parse(content.toString());
  } catch {
    return null; // File doesn't exist or is corrupted
  }
}

// State Saving
private async saveWorkflowState(state: SPARCWorkflowState): Promise<void> {
  if (!this._nysFolder) return;

  // Save state file
  const stateFile = vscode.Uri.joinPath(this._nysFolder, `${state.issueId}-workflow.json`);
  const content = JSON.stringify(state, null, 2);
  await vscode.workspace.fs.writeFile(stateFile, Buffer.from(content, 'utf8'));

  // Save individual artifact files
  await this.saveArtifacts(state);
}

// Artifact Saving
private async saveArtifacts(state: SPARCWorkflowState): Promise<void> {
  if (!this._nysFolder) return;

  const issueFolder = vscode.Uri.joinPath(this._nysFolder, state.issueId);
  
  // Create issue folder if it doesn't exist
  try {
    await vscode.workspace.fs.stat(issueFolder);
  } catch {
    await vscode.workspace.fs.createDirectory(issueFolder);
  }

  // Save each artifact as a separate file
  for (const [key, content] of Object.entries(state.artifacts)) {
    if (content) {
      const fileName = this.getArtifactFileName(key);
      const filePath = vscode.Uri.joinPath(issueFolder, fileName);
      await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf8'));
    }
  }
}
```

## Error Handling and Validation

### Error Types

1. **FileSystemError**: Issues with file operations
2. **ValidationError**: Invalid input or state
3. **WorkflowError**: Workflow logic violations
4. **ArtifactError**: Artifact generation failures

### Error Handling Strategy

```typescript
try {
  const state = await engine.processIssue(issueId, mode, userInput);
  return state;
} catch (error) {
  console.error('SPARC workflow error:', error);
  
  // Specific error handling
  if (error instanceof FileSystemError) {
    // Handle file system issues
    await this.handleFileSystemError(error);
  } else if (error instanceof ValidationError) {
    // Handle validation issues
    await this.handleValidationError(error);
  } else if (error instanceof WorkflowError) {
    // Handle workflow logic issues
    await this.handleWorkflowError(error);
  }
  
  // Re-throw for upstream handling
  throw error;
}
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load artifacts only when needed
2. **Caching**: Cache frequently accessed workflow states
3. **Batch Operations**: Group file operations when possible
4. **Async Operations**: All I/O operations are asynchronous

### Memory Management

```typescript
class SPARCWorkflowEngine {
  private _stateCache: Map<string, SPARCWorkflowState> = new Map();
  private _cacheTimeout: number = 300000; // 5 minutes
  
  private async getCachedState(issueId: string): Promise<SPARCWorkflowState | null> {
    const cached = this._stateCache.get(issueId);
    if (cached && (Date.now() - cached.updatedAt.getTime()) < this._cacheTimeout) {
      return cached;
    }
    return null;
  }
  
  private setCachedState(state: SPARCWorkflowState): void {
    this._stateCache.set(state.issueId, state);
  }
}
```

## Security Considerations

### Input Sanitization

```typescript
private sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .trim();
}
```

### File System Security

- Validate file paths to prevent directory traversal
- Limit file sizes to prevent DoS attacks
- Sanitize file names to prevent conflicts

## Testing Strategy

### Unit Tests

```typescript
describe('SPARCWorkflowEngine', () => {
  let engine: SPARCWorkflowEngine;
  let mockWorkspace: vscode.Uri;

  beforeEach(() => {
    mockWorkspace = vscode.Uri.file('/mock/workspace');
    engine = new SPARCWorkflowEngine(mockWorkspace);
  });

  describe('processIssue', () => {
    it('should create initial state for new issue', async () => {
      const state = await engine.processIssue('test-issue', 'design', 'Test input');
      
      expect(state.issueId).toBe('test-issue');
      expect(state.mode).toBe('design');
      expect(state.currentPhase).toBe('specification');
      expect(state.progress).toBe(0);
    });

    it('should progress through design phases', async () => {
      // Test phase progression
      let state = await engine.processIssue('test-issue', 'design', 'Initial requirements');
      expect(state.currentPhase).toBe('pseudocode');
      expect(state.progress).toBe(25);

      state = await engine.processIssue('test-issue', 'design', 'Add pseudocode');
      expect(state.currentPhase).toBe('architecture');
      expect(state.progress).toBe(50);
    });
  });
});
```

### Integration Tests

```typescript
describe('SPARCWorkflowEngine Integration', () => {
  it('should persist and restore workflow state', async () => {
    // Create workflow state
    const state1 = await engine.processIssue('integration-test', 'design', 'Test input');
    
    // Create new engine instance (simulates restart)
    const engine2 = new SPARCWorkflowEngine(mockWorkspace);
    
    // Process same issue
    const state2 = await engine2.processIssue('integration-test', 'design', 'Continue');
    
    // Verify state persistence
    expect(state2.issueId).toBe(state1.issueId);
    expect(state2.artifacts.requirements).toBeDefined();
  });
});
```

## Future Enhancements

### Planned Features

1. **AI Integration**: Connect with external AI services for enhanced artifact generation
2. **Template System**: Customizable templates for different project types
3. **Collaboration**: Multi-user workflow support
4. **Analytics**: Workflow performance metrics and insights
5. **Plugin System**: Extensible architecture for custom processors

### Extension Points

```typescript
interface SPARCWorkflowExtension {
  name: string;
  version: string;
  
  // Custom artifact generators
  generateRequirements?(input: string): Promise<string>;
  generateImplementation?(input: string, artifacts: any): Promise<string>;
  
  // Custom validators
  validateState?(state: SPARCWorkflowState): Promise<boolean>;
  
  // Custom processors
  processCustomPhase?(state: SPARCWorkflowState, input: string): Promise<void>;
}
```

## Conclusion

The SPARC Workflow Engine represents a sophisticated approach to systematic software development, providing structure, traceability, and automation to the development process. Its modular architecture, comprehensive artifact generation, and robust state management make it a powerful tool for issue-driven development workflows.

The engine's design emphasizes extensibility, allowing for future enhancements while maintaining backward compatibility and performance. Its dual persistence model ensures both machine-readable state management and human-editable artifact files, making it suitable for both automated and manual development processes.
