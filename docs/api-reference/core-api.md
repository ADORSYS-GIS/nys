# Core API Reference

Complete API documentation for the SPARC Workflow Engine.

## SPARCWorkflowEngine Class

The main orchestrator class that manages the entire SPARC workflow lifecycle.

### Constructor

```typescript
constructor(workspaceRoot: vscode.Uri)
```

**Parameters:**
- `workspaceRoot` - The root URI of the VS Code workspace

**Example:**
```typescript
const engine = new SPARCWorkflowEngine(workspaceRoot);
```

### Main Processing Method

```typescript
async processIssue(
  issueId: string, 
  mode: 'design' | 'build' | 'debug', 
  userInput: string
): Promise<SPARCWorkflowState>
```

**Parameters:**
- `issueId` - Unique identifier for the issue
- `mode` - Current workflow mode (design/build/debug)
- `userInput` - User's input/request for processing

**Returns:**
- `Promise<SPARCWorkflowState>` - Updated workflow state with generated artifacts

**Example:**
```typescript
const state = await engine.processIssue(
  'auth-system-001', 
  'design', 
  'Create a user authentication system with JWT tokens'
);

console.log(`Current phase: ${state.currentPhase}`);
console.log(`Progress: ${state.progress}%`);
console.log(`Generated artifacts: ${Object.keys(state.artifacts).join(', ')}`);
```

**Throws:**
- `FileSystemError` - If there are issues with file operations
- `ValidationError` - If input validation fails
- `WorkflowError` - If workflow logic is violated

## SPARCWorkflowState Interface

Defines the complete state of a workflow instance.

```typescript
interface SPARCWorkflowState {
  issueId: string;
  currentPhase: 'specification' | 'pseudocode' | 'architecture' | 'refinement' | 'completion';
  mode: 'design' | 'build' | 'debug';
  progress: number;
  artifacts: {
    requirements?: string;
    guidelines?: string;
    pseudocode?: string;
    architecture?: string;
    implementation?: string;
    tests?: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Properties

#### `issueId: string`
Unique identifier for the issue. Used for file naming and state persistence.

#### `currentPhase: WorkflowPhase`
Current phase in the SPARC workflow:
- `'specification'` - Requirements extraction phase
- `'pseudocode'` - Algorithm design phase
- `'architecture'` - System architecture phase
- `'refinement'` - Requirements refinement phase
- `'completion'` - Design completion phase

#### `mode: WorkflowMode`
Current processing mode:
- `'design'` - Design mode for requirements and architecture
- `'build'` - Build mode for implementation
- `'debug'` - Debug mode for analysis and fixes

#### `progress: number`
Completion percentage (0-100) for the current workflow.

#### `artifacts: Artifacts`
Generated artifacts as strings:
- `requirements?` - Requirements specification document
- `guidelines?` - Development guidelines document
- `pseudocode?` - Algorithm pseudocode document
- `architecture?` - System architecture document
- `implementation?` - Generated implementation code
- `tests?` - Test suite document
- `notes?` - Debug notes and analysis

#### `createdAt: Date`
Timestamp when the workflow state was created.

#### `updatedAt: Date`
Timestamp when the workflow state was last updated.

## Workflow Phase Processing

### Design Mode Processing

The design mode processes user input through 5 distinct phases:

#### Phase 1: Specification (0-25%)
```typescript
// Input: Raw user requirements
// Output: requirements.md
state.artifacts.requirements = await this.generateRequirements(userInput);
state.currentPhase = 'pseudocode';
state.progress = 25;
```

#### Phase 2: Pseudocode (25-50%)
```typescript
// Input: User input + requirements
// Output: pseudocode.md
state.artifacts.pseudocode = await this.generatePseudocode(userInput, state.artifacts.requirements);
state.currentPhase = 'architecture';
state.progress = 50;
```

#### Phase 3: Architecture (50-75%)
```typescript
// Input: User input + all previous artifacts
// Output: architecture.md + guidelines.md
state.artifacts.architecture = await this.generateArchitecture(userInput, state.artifacts);
state.artifacts.guidelines = await this.generateGuidelines(userInput, state.artifacts);
state.currentPhase = 'refinement';
state.progress = 75;
```

#### Phase 4: Refinement (75-100%)
```typescript
// Input: User input + requirements
// Output: Updated requirements.md
state.artifacts.requirements = await this.refineRequirements(
  state.artifacts.requirements || '', 
  userInput
);
state.currentPhase = 'completion';
state.progress = 100;
```

#### Phase 5: Completion (100%)
```typescript
// Status: Design phase complete
// Ready for Build mode
```

### Build Mode Processing

```typescript
// Prerequisites: Design phase must be complete
if (state.currentPhase !== 'completion') {
  state.artifacts.notes = (state.artifacts.notes || '') + 
    `\n[${new Date().toISOString()}] Build requested but design incomplete. Current phase: ${state.currentPhase}`;
  return;
}

// Generate implementation artifacts
state.artifacts.implementation = await this.generateImplementation(userInput, state.artifacts);
state.artifacts.tests = await this.generateTests(userInput, state.artifacts);
state.progress = 100;
```

### Debug Mode Processing

```typescript
// Debug can work with any existing artifacts
const debugNotes = await this.analyzeAndDebug(userInput, state.artifacts);
state.artifacts.notes = (state.artifacts.notes || '') + 
  `\n[${new Date().toISOString()}] Debug Analysis:\n${debugNotes}`;
```

## Artifact Generation Methods

### Requirements Generation

```typescript
private async generateRequirements(userInput: string): Promise<string>
```

**Parameters:**
- `userInput` - Raw user requirements/description

**Returns:**
- `Promise<string>` - Formatted requirements document

**Example Output:**
```markdown
# Requirements Specification

## User Input
Create a user authentication system

## Extracted Requirements
- Core functionality: User login/logout
- Technical constraints: JWT tokens
- Performance requirements: < 200ms response time
- Integration points: REST API endpoints

## Acceptance Criteria
- [ ] User can register with email/password
- [ ] User can login and receive JWT token
- [ ] User can logout and invalidate token
```

### Pseudocode Generation

```typescript
private async generatePseudocode(userInput: string, requirements?: string): Promise<string>
```

**Parameters:**
- `userInput` - User input for pseudocode generation
- `requirements` - Optional requirements document

**Returns:**
- `Promise<string>` - Formatted pseudocode document

### Architecture Generation

```typescript
private async generateArchitecture(userInput: string, artifacts: any): Promise<string>
```

**Parameters:**
- `userInput` - User input for architecture design
- `artifacts` - All previously generated artifacts

**Returns:**
- `Promise<string>` - Formatted architecture document

### Implementation Generation

```typescript
private async generateImplementation(userInput: string, artifacts: any): Promise<string>
```

**Parameters:**
- `userInput` - User input for implementation
- `artifacts` - Design artifacts to base implementation on

**Returns:**
- `Promise<string>` - Formatted implementation document

### Test Generation

```typescript
private async generateTests(userInput: string, artifacts: any): Promise<string>
```

**Parameters:**
- `userInput` - User input for test generation
- `artifacts` - Implementation artifacts to test

**Returns:**
- `Promise<string>` - Formatted test suite document

## State Management

### Loading Workflow State

```typescript
private async loadWorkflowState(issueId: string): Promise<SPARCWorkflowState | null>
```

**Parameters:**
- `issueId` - Unique identifier for the issue

**Returns:**
- `Promise<SPARCWorkflowState | null>` - Loaded state or null if not found

**Example:**
```typescript
const state = await engine.loadWorkflowState('auth-system-001');
if (state) {
  console.log(`Loaded state for issue: ${state.issueId}`);
  console.log(`Current phase: ${state.currentPhase}`);
} else {
  console.log('No existing state found');
}
```

### Saving Workflow State

```typescript
private async saveWorkflowState(state: SPARCWorkflowState): Promise<void>
```

**Parameters:**
- `state` - Workflow state to save

**Returns:**
- `Promise<void>`

**Example:**
```typescript
const state = await engine.processIssue('auth-system-001', 'design', 'Add JWT support');
await engine.saveWorkflowState(state);
console.log('State saved successfully');
```

## File System Integration

### Artifact File Mapping

| Artifact Key | File Name | Purpose |
|--------------|-----------|---------|
| `requirements` | `requirements.md` | Technical specifications |
| `guidelines` | `guidelines.md` | Development guidelines |
| `pseudocode` | `pseudocode.md` | Algorithm design |
| `architecture` | `architecture.md` | System architecture |
| `implementation` | `implementation.md` | Generated code |
| `tests` | `tests.md` | Test suites |
| `notes` | `notes.md` | Debug notes |

### Directory Structure

```
.nys/
├── {issue-id}/
│   ├── requirements.md
│   ├── guidelines.md
│   ├── pseudocode.md
│   ├── architecture.md
│   ├── implementation.md
│   ├── tests.md
│   └── notes.md
└── {issue-id}-workflow.json
```

## Error Handling

### Error Types

#### FileSystemError
```typescript
class FileSystemError extends Error {
  constructor(message: string, public readonly path: string) {
    super(message);
    this.name = 'FileSystemError';
  }
}
```

#### ValidationError
```typescript
class ValidationError extends Error {
  constructor(message: string, public readonly field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### WorkflowError
```typescript
class WorkflowError extends Error {
  constructor(message: string, public readonly phase: string) {
    super(message);
    this.name = 'WorkflowError';
  }
}
```

### Error Handling Example

```typescript
try {
  const state = await engine.processIssue(issueId, mode, userInput);
  return state;
} catch (error) {
  if (error instanceof FileSystemError) {
    console.error(`File system error: ${error.message} at ${error.path}`);
  } else if (error instanceof ValidationError) {
    console.error(`Validation error in ${error.field}: ${error.message}`);
  } else if (error instanceof WorkflowError) {
    console.error(`Workflow error in phase ${error.phase}: ${error.message}`);
  } else {
    console.error('Unknown error:', error);
  }
  throw error;
}
```

## Usage Examples

### Basic Usage

```typescript
// Initialize the engine
const engine = new SPARCWorkflowEngine(workspaceRoot);

// Process an issue through design mode
let state = await engine.processIssue(
  'auth-system', 
  'design', 
  'Create a user authentication system'
);

// Continue through phases
state = await engine.processIssue(
  'auth-system', 
  'design', 
  'Add JWT token support'
);

// Switch to build mode
state = await engine.processIssue(
  'auth-system', 
  'build', 
  'Generate Express.js implementation'
);

// Debug the implementation
state = await engine.processIssue(
  'auth-system', 
  'debug', 
  'Check for security vulnerabilities'
);
```

### Advanced Usage

```typescript
// Custom error handling
async function processIssueSafely(issueId: string, mode: string, input: string) {
  try {
    const state = await engine.processIssue(issueId, mode, input);
    
    // Log progress
    console.log(`Issue ${issueId} progress: ${state.progress}%`);
    console.log(`Current phase: ${state.currentPhase}`);
    
    // Check for specific artifacts
    if (state.artifacts.implementation) {
      console.log('Implementation generated successfully');
    }
    
    return state;
  } catch (error) {
    console.error(`Failed to process issue ${issueId}:`, error);
    throw error;
  }
}

// Batch processing
async function processMultipleIssues(issues: Array<{id: string, mode: string, input: string}>) {
  const results = [];
  
  for (const issue of issues) {
    try {
      const state = await engine.processIssue(issue.id, issue.mode, issue.input);
      results.push({ success: true, state });
    } catch (error) {
      results.push({ success: false, error });
    }
  }
  
  return results;
}
```

## Performance Considerations

### Caching
The engine implements caching for frequently accessed workflow states:

```typescript
// State is automatically cached after processing
const state1 = await engine.processIssue('issue-1', 'design', 'input');
// Subsequent access to the same issue will use cached state
const state2 = await engine.processIssue('issue-1', 'design', 'more input');
```

### Batch Operations
For multiple operations, consider batching:

```typescript
// Process multiple inputs for the same issue
const inputs = ['input1', 'input2', 'input3'];
let state = await engine.processIssue('issue-1', 'design', inputs[0]);

for (let i = 1; i < inputs.length; i++) {
  state = await engine.processIssue('issue-1', 'design', inputs[i]);
}
```

---

*For more detailed information, see the [Complete User Guide](../user-guide/SPARC_WORKFLOW_ENGINE_DOCUMENTATION.md) and [Technical Specification](../technical/SPARC_TECHNICAL_SPECIFICATION.md).*
