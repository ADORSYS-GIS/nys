# Nys - SPARC Workflow-Driven Development Assistant

A Visual Studio Code extension that implements a **workflow-driven assistant** based on the **SPARC framework** (Specification → Pseudocode → Architecture → Refinement → Completion). The assistant is **issue-driven**: every new task is stored as an *issue folder*, and each issue goes through **Design → Build → Debug** modes for systematic development.

## 🎯 **Core Philosophy**

Mira transforms development from ad-hoc coding to structured, traceable workflows. Every development task becomes an issue that progresses through three distinct phases:

- **🎨 Design Mode**: Analyze requirements, generate specifications, and create technical guidelines
- **🔨 Build Mode**: Generate code, create project structure, and implement features
- **🐛 Debug Mode**: Identify issues, apply fixes, and optimize performance

This ensures every piece of code has clear requirements, documented decisions, and traceable evolution.

## 🚀 **Key Features**

### **Issue-Driven Workflow System**
- **Issue Folder Structure**: Each task gets a dedicated folder with requirements, guidelines, notes, and outputs
- **Three-Mode Progression**: Design → Build → Debug workflow for systematic development
- **Persistent State Management**: All workflow state stored in `.nys/` directory for session continuity
- **Traceable Development**: Every code change linked to specific requirements and decisions

### **SPARC Framework Integration**
- **Specification**: Automated requirements extraction and technical specification generation
- **Pseudocode**: Architecture planning and design documentation
- **Architecture**: Project structure planning and dependency management
- **Refinement**: Iterative improvement and optimization
- **Completion**: Final implementation and testing

### **Advanced Tool Integration**
- **MCP Server Support**: Connect to HTTP/WebSocket servers and local stdio binaries
- **Built-in Tools**: Computation, search, parsing, and file operations
- **External Data Sources**: GitHub, web APIs, and custom data integrations
- **AI Chat Interface**: Context-aware conversations with project understanding

### **Development Workflow Features**
- **Mode-Specific Processing**: Tailored workflows for design, build, and debug phases
- **File System Integration**: Direct project file manipulation and structure management
- **State Persistence**: Workflow progress saved across sessions
- **Rollback Capability**: Version control integration for code state management

## 📂 **Issue Folder Structure**

Each development task is organized in a dedicated issue folder for complete traceability:

```
/issues/ISSUE-001/
   ├── requirements.md   # Generated requirements & technical specs
   ├── guidelines.md     # Style guides, dependencies, coding constraints  
   ├── notes.md          # Iterations, debug notes, brainstorming
   ├── status.json       # Tracks mode (design/build/debug), progress, state
```

## 🔄 **Workflow Modes**

### **🎨 Design Mode**
- **Input**: User prompt (problem statement)
- **Process**:
    - Analyze user input & project state
    - Extract features and constraints
    - Generate `requirements.md` and `guidelines.md`
- **Output**: Structured documents inside issue folder

### **🔨 Build Mode**
- **Input**: `requirements.md` + `guidelines.md`
- **Process**:
    - Parse requirements and technical specifications
    - Propose project structure (if needed)
    - Generate source code, configs, tests
    - Update `status.json` with progress
- **Output**: Code written to project files or `outputs/`

### **🐛 Debug Mode**
- **Input**: Existing code + requirements/guidelines
- **Process**:
    - Identify bugs, errors, or performance issues
    - Generate fixes and improvements
    - Apply fixes to project files
    - Record debug notes in `notes.md`
- **Output**: Updated project files and documentation
