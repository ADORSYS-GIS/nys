# Workflow Modes Guide

Understanding the three core modes of the SPARC Workflow Engine: Design, Build, and Debug.

## 🎨 Design Mode

**Purpose**: Transform user requirements into structured specifications and architectural designs.

### When to Use Design Mode
- Starting a new project or feature
- Defining requirements and specifications
- Creating system architecture
- Planning implementation approach

### SPARC Phases in Design Mode

#### 1. Specification Phase (0-25%)
**Input**: Raw user requirements
**Process**: Extract and formalize requirements
**Output**: `requirements.md`

**Example**:
```
User Input: "Create a user authentication system"
↓
Generated: requirements.md with:
- Core functionality requirements
- Technical constraints
- Performance requirements
- Integration points
- Acceptance criteria
```

#### 2. Pseudocode Phase (25-50%)
**Input**: User input + requirements
**Process**: Create algorithmic design
**Output**: `pseudocode.md`

**Example**:
```
User Input: "Add JWT token support"
↓
Generated: pseudocode.md with:
- High-level algorithm
- Key functions
- Data flow logic
- Processing steps
```

#### 3. Architecture Phase (50-75%)
**Input**: User input + previous artifacts
**Process**: Design system architecture
**Output**: `architecture.md` + `guidelines.md`

**Example**:
```
User Input: "Include password hashing with bcrypt"
↓
Generated: architecture.md with:
- System components
- Component interactions
- Dependencies
- Data flow
+ guidelines.md with:
- Coding standards
- Architecture guidelines
- Testing guidelines
```

#### 4. Refinement Phase (75-100%)
**Input**: User input + requirements
**Process**: Refine and finalize requirements
**Output**: Updated `requirements.md`

**Example**:
```
User Input: "Finalize requirements"
↓
Generated: Updated requirements.md with:
- Refined specifications
- Additional details
- Final acceptance criteria
```

#### 5. Completion Phase (100%)
**Status**: Design phase complete
**Next**: Ready for Build mode

### Design Mode Best Practices
- **Be specific**: Provide detailed requirements and constraints
- **Iterate**: Use multiple inputs to refine your design
- **Think ahead**: Consider implementation challenges during design
- **Document decisions**: The system will track all your design decisions

## 🔨 Build Mode

**Purpose**: Generate implementation code, tests, and configuration files based on design artifacts.

### Prerequisites
- Design phase must be complete (100% progress)
- All design artifacts must be generated

### When to Use Build Mode
- Design phase is complete
- Ready to implement the solution
- Need to generate code and tests
- Want to create project structure

### Build Mode Process

#### Implementation Generation
**Input**: User input + all design artifacts
**Process**: Generate source code and configuration
**Output**: `implementation.md`

**Example**:
```
User Input: "Generate Express.js implementation with TypeScript"
↓
Generated: implementation.md with:
- TypeScript source code
- Express.js controllers and services
- Configuration files
- Package.json dependencies
```

#### Test Generation
**Input**: User input + design artifacts
**Process**: Create comprehensive test suites
**Output**: `tests.md`

**Example**:
```
User Input: "Add unit tests for authentication"
↓
Generated: tests.md with:
- Unit tests for all functions
- Integration tests
- End-to-end tests
- Test configuration
```

### Build Mode Best Practices
- **Be specific about technology stack**: Mention frameworks, languages, databases
- **Include testing requirements**: Specify what types of tests you need
- **Consider deployment**: Mention deployment and environment requirements
- **Review generated code**: Always review and validate generated implementations

## 🐛 Debug Mode

**Purpose**: Analyze existing code, identify issues, and provide recommendations for fixes and improvements.

### When to Use Debug Mode
- Code has bugs or issues
- Performance problems
- Security vulnerabilities
- Code quality improvements needed
- Integration issues

### Debug Mode Process

#### Issue Analysis
**Input**: Debug request + any existing artifacts
**Process**: Analyze code and identify problems
**Output**: Updated `notes.md`

**Example**:
```
User Input: "Fix JWT token expiration issue"
↓
Generated: notes.md with:
- Issue analysis
- Root cause identification
- Performance impact assessment
- Security implications
- Recommended fixes
```

#### Debug Capabilities
- **Code Quality Analysis**: Identifies code smells and anti-patterns
- **Performance Analysis**: Finds bottlenecks and optimization opportunities
- **Security Analysis**: Detects vulnerabilities and security issues
- **Integration Analysis**: Checks for integration problems
- **Best Practices**: Suggests improvements based on industry standards

### Debug Mode Best Practices
- **Be specific about the problem**: Describe the exact issue you're facing
- **Provide context**: Include relevant code snippets or error messages
- **Mention symptoms**: Describe what's not working as expected
- **Include environment details**: Mention frameworks, versions, and configurations

## 🔄 Mode Transitions

### Design → Build
**Requirements**:
- Design phase must be 100% complete
- All design artifacts must be generated

**Process**:
1. Complete all SPARC phases in Design mode
2. Switch to Build mode
3. Provide implementation requirements
4. System generates code and tests

### Build → Debug
**Requirements**:
- Implementation must be generated
- No specific prerequisites

**Process**:
1. Generate implementation in Build mode
2. Switch to Debug mode
3. Provide debug requests
4. System analyzes and provides recommendations

### Debug → Design
**Requirements**:
- None (can switch anytime)

**Process**:
1. Use Debug mode to identify issues
2. Switch to Design mode
3. Refine requirements based on debug findings
4. Update design artifacts

### Debug → Build
**Requirements**:
- None (can switch anytime)

**Process**:
1. Use Debug mode to identify issues
2. Switch to Build mode
3. Implement fixes based on debug recommendations
4. Generate updated implementation

## 📊 Mode Comparison

| Aspect | Design Mode | Build Mode | Debug Mode |
|--------|-------------|------------|------------|
| **Purpose** | Requirements & Architecture | Implementation | Analysis & Fixes |
| **Prerequisites** | None | Design Complete | None |
| **Input** | User Requirements | Implementation Specs | Debug Requests |
| **Output** | Specifications, Architecture | Code, Tests | Analysis, Recommendations |
| **Progress** | 0-100% (5 phases) | 100% (implementation) | Continuous (notes) |
| **Artifacts** | requirements.md, guidelines.md, pseudocode.md, architecture.md | implementation.md, tests.md | notes.md |

## 🎯 Choosing the Right Mode

### Start with Design Mode when:
- Beginning a new project
- Defining requirements
- Planning architecture
- Creating specifications

### Use Build Mode when:
- Design is complete
- Ready to implement
- Need code generation
- Creating project structure

### Switch to Debug Mode when:
- Issues arise
- Performance problems
- Security concerns
- Code quality issues

## 💡 Pro Tips

1. **Iterative Approach**: Don't try to complete everything in one mode. Switch between modes as needed.

2. **Context Preservation**: The system maintains context across mode switches, so you can build upon previous work.

3. **Artifact Reuse**: Generated artifacts are reused and updated across modes, ensuring consistency.

4. **Progressive Refinement**: Use multiple iterations in each mode to refine and improve your work.

5. **Mode-Specific Input**: Tailor your input to the current mode for better results.

---

*Ready to dive deeper? Check out the [Complete User Guide](./SPARC_WORKFLOW_ENGINE_DOCUMENTATION.md) for comprehensive documentation.*
