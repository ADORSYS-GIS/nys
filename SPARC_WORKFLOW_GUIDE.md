# 📖 SPARC Workflow System - Complete Guide

## 🎯 **Overview**

The SPARC Workflow System transforms development from ad-hoc coding to structured, traceable workflows. Every development task becomes an issue that progresses through three distinct phases: **Design → Build → Debug**.

## 📂 **Issue Folder Structure**

Each development task is organized in a dedicated issue folder for complete traceability:

```
/issues/ISSUE-001/
   ├── requirements.md   # Generated requirements & technical specs
   ├── guidelines.md     # Style guides, dependencies, coding constraints  
   ├── notes.md          # Iterations, debug notes, brainstorming
   ├── status.json       # Tracks mode (design/build/debug), progress, state
```

### **File Descriptions**

#### **requirements.md**
Contains the complete technical specification for the issue:
- **Problem Statement**: Clear description of what needs to be built
- **Functional Requirements**: What the system should do
- **Non-Functional Requirements**: Performance, security, scalability constraints
- **Technical Specifications**: Architecture decisions, technology choices
- **Acceptance Criteria**: How to verify the solution works
- **Dependencies**: External libraries, services, or components needed

#### **guidelines.md**
Contains development standards and constraints:
- **Coding Standards**: Style guides, naming conventions, code organization
- **Technology Stack**: Specific versions, frameworks, libraries to use
- **Architecture Patterns**: Design patterns, architectural principles
- **Testing Requirements**: Unit tests, integration tests, coverage requirements
- **Documentation Standards**: Code comments, API documentation, README requirements
- **Security Guidelines**: Authentication, authorization, data protection requirements

#### **notes.md**
Contains development process documentation:
- **Design Decisions**: Rationale behind architectural choices
- **Iteration History**: Changes made during development
- **Debug Notes**: Issues encountered and how they were resolved
- **Brainstorming**: Alternative approaches considered
- **Lessons Learned**: Insights gained during development

#### **status.json**
Tracks the current state of the issue:
```json
{
  "id": "ISSUE-001",
  "title": "User Authentication System",
  "currentMode": "build",
  "progress": {
    "design": 100,
    "build": 75,
    "debug": 0
  },
  "status": "in-progress",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T14:45:00Z",
  "lastActivity": "Generated user model and authentication service",
  "nextSteps": [
    "Implement password hashing",
    "Add JWT token generation",
    "Create login/logout endpoints"
  ]
}
```

## 🔄 **Workflow Modes**

### **🎨 Design Mode**

**Purpose**: Transform user requirements into detailed technical specifications.

**Input**: 
- User prompt describing the problem or feature request
- Current project state and existing codebase

**Process**:
1. **Analysis**: Parse user input to understand the core problem
2. **Research**: Analyze existing codebase and project structure
3. **Specification**: Generate detailed requirements and technical specs
4. **Guidelines**: Create development standards and constraints
5. **Planning**: Define project structure and implementation approach

**Output**:
- `requirements.md` with complete technical specification
- `guidelines.md` with development standards
- Updated `status.json` with design progress

**Example Design Mode Workflow**:
```
User Input: "I need a user authentication system for my web app"

Design Mode Processing:
1. Analyze existing project structure
2. Research authentication best practices
3. Generate requirements.md with:
   - User registration/login functionality
   - Password security requirements
   - Session management specifications
   - API endpoint definitions
4. Generate guidelines.md with:
   - JWT token implementation
   - Password hashing standards
   - Security best practices
   - Testing requirements
```

### **🔨 Build Mode**

**Purpose**: Generate code and project structure based on requirements.

**Input**:
- `requirements.md` with technical specifications
- `guidelines.md` with development standards
- Current project state

**Process**:
1. **Parse Requirements**: Extract features and technical specs
2. **Plan Structure**: Determine project organization and file structure
3. **Generate Code**: Create source code, tests, and configuration files
4. **Update Project**: Write files to project or outputs directory
5. **Track Progress**: Update status.json with build progress

**Output**:
- Source code files in project or `outputs/src/`
- Test files in `outputs/tests/`
- Configuration files in `outputs/configs/`
- Documentation in `outputs/docs/`
- Updated `status.json` with build progress

**Example Build Mode Workflow**:
```
Build Mode Processing:
1. Read requirements.md and guidelines.md
2. Generate project structure:
   - src/auth/
     - user.model.ts
     - auth.service.ts
     - auth.controller.ts
   - tests/auth/
     - auth.service.test.ts
     - auth.controller.test.ts
3. Implement features:
   - User registration with password hashing
   - JWT token generation and validation
   - Login/logout endpoints
   - Input validation and error handling
4. Update status.json with progress
```

### **🐛 Debug Mode**

**Purpose**: Identify and fix issues in existing code.

**Input**:
- Existing codebase with issues
- `requirements.md` and `guidelines.md` for reference
- Error logs or user-reported problems

**Process**:
1. **Issue Identification**: Analyze code for bugs, performance issues, or violations
2. **Root Cause Analysis**: Understand why issues occurred
3. **Solution Generation**: Create fixes and improvements
4. **Code Updates**: Apply fixes to project files
5. **Documentation**: Record debug process in notes.md

**Output**:
- Fixed code files
- Updated `notes.md` with debug process
- Updated `status.json` with debug progress
- Performance improvements or optimizations

**Example Debug Mode Workflow**:
```
Debug Mode Processing:
1. Analyze existing authentication code
2. Identify issues:
   - Password not being hashed properly
   - JWT token expiration not handled
   - Missing input validation
3. Generate fixes:
   - Implement proper bcrypt hashing
   - Add token refresh mechanism
   - Add comprehensive input validation
4. Apply fixes to project files
5. Update notes.md with debug process
```

## 🛠️ **Tool Integration**

### **Built-in Tools**

The system includes core utility tools for common operations:

- **Computation Tools**: Mathematical calculations, data processing
- **Search Tools**: Code search, web search, documentation lookup
- **Parsing Tools**: File parsing, data extraction, format conversion
- **File Operations**: Read, write, create, delete files and directories
- **Code Analysis**: Syntax checking, dependency analysis, complexity metrics

### **MCP Server Integration**

External capabilities via Model Context Protocol servers:

- **HTTP/WebSocket Servers**: Connect to REST APIs and real-time services
- **Stdio Binaries**: Local tools like GitHub CLI, database clients
- **Custom Servers**: Project-specific tools and integrations
- **Data Sources**: External databases, APIs, file systems

### **File System Integration**

Direct project manipulation with version control awareness:

- **Project Files**: Read and write source code, configuration files
- **Issue Folders**: Manage requirements, guidelines, notes, outputs
- **State Management**: Track workflow progress and issue status
- **Version Control**: Integration with Git for change tracking

## 🧠 **State Management**

### **Workflow State**
Tracks progress within each mode:
- Current step in the workflow
- Completed tasks and remaining work
- Error states and recovery information
- Tool usage and results

### **Issue State**
Maintained in `status.json` for each issue:
- Current mode (design/build/debug)
- Progress percentages for each mode
- Last activity and next steps
- Creation and update timestamps

### **Project State**
Reflects the current codebase:
- File structure and organization
- Dependencies and configurations
- Generated code and artifacts
- Integration points and APIs

### **Mode Switching**
Smooth transitions between workflow modes:
- State preservation across mode changes
- Context transfer between modes
- Progress tracking and resumption
- Error handling and recovery

## 🚀 **End-to-End Workflow Example**

### **Step 1: Create Issue**
```
User: "I need a REST API for managing blog posts"

System: Creates /issues/BLOG-API-001/ folder
```

### **Step 2: Design Mode**
```
User: "Design a blog post API with CRUD operations"

Design Mode Processing:
1. Analyzes user requirements
2. Generates requirements.md:
   - CRUD operations for blog posts
   - RESTful API design
   - Database schema requirements
   - Authentication and authorization
3. Generates guidelines.md:
   - Node.js/Express.js stack
   - MongoDB database
   - JWT authentication
   - API documentation standards
4. Updates status.json: design: 100%
```

### **Step 3: Build Mode**
```
User: "Build the blog post API"

Build Mode Processing:
1. Reads requirements.md and guidelines.md
2. Generates project structure:
   - src/models/Post.js
   - src/controllers/postController.js
   - src/routes/postRoutes.js
   - src/middleware/auth.js
3. Implements CRUD operations
4. Adds authentication middleware
5. Creates tests and documentation
6. Updates status.json: build: 100%
```

### **Step 4: Debug Mode**
```
User: "Fix the API - it's not handling errors properly"

Debug Mode Processing:
1. Analyzes existing code
2. Identifies issues:
   - Missing error handling middleware
   - Inconsistent error response format
   - No validation for required fields
3. Generates fixes:
   - Adds comprehensive error handling
   - Standardizes error response format
   - Implements input validation
4. Applies fixes to project files
5. Updates notes.md with debug process
6. Updates status.json: debug: 100%
```

## 📋 **Best Practices**

### **Issue Creation**
- Use descriptive titles that clearly state the problem
- Provide sufficient context in the initial description
- Consider breaking large features into smaller issues
- Link related issues for better organization

### **Design Mode**
- Be specific about requirements and constraints
- Consider edge cases and error scenarios
- Define clear acceptance criteria
- Document architectural decisions and rationale

### **Build Mode**
- Follow the guidelines.md standards consistently
- Generate comprehensive tests for all features
- Include proper error handling and validation
- Document code with clear comments

### **Debug Mode**
- Document the debugging process thoroughly
- Test fixes thoroughly before applying
- Consider root causes, not just symptoms
- Update documentation when making changes

### **State Management**
- Keep status.json updated with current progress
- Document important decisions in notes.md
- Maintain clear separation between modes
- Preserve context when switching modes

## 🔧 **Configuration**

### **Workflow Settings**
Configure the workflow system behavior:
- Default mode for new issues
- Auto-save intervals for state files
- Output directory preferences
- Tool integration settings

### **MCP Server Configuration**
Set up external tool integrations:
- Server endpoints and authentication
- Tool selection and filtering
- Response processing and formatting
- Error handling and retry logic

### **File System Settings**
Configure file operations:
- Issue folder location and structure
- Output directory organization
- File naming conventions
- Version control integration

This comprehensive guide provides everything needed to understand and use the SPARC Workflow System effectively. The system transforms development from chaotic coding to structured, traceable workflows that ensure quality and maintainability.
